"use server"
import { getServerSession } from "@/auth/auth-server";
import { db } from "@/server/db";
import { tournament, team, participant } from "@/server/db/schema";
import { eq, and, not, isNull } from "drizzle-orm";

import { createCategory, createTeam, updateCategory, deleteCategory, deleteTeam, assertTournamentPermission } from "@/actions/tournament";
import { actionClient, ServerError } from "@/lib/safe-action";
import { createCategorySchema, createTeamSchema, updateCategorySchema, swapCategoryRankSchema } from "./schema";
import { z } from "zod";


export const createCategoryAction = actionClient
    .schema(createCategorySchema)
    .action(async ({ parsedInput }) => {
        const { tournamentId, name, basePrice, increment } = parsedInput;
        return await createCategory({
            tournamentId,
            name,
            basePrice,
            increment,
        });
    });

export const updateCategoryAction = actionClient
    .schema(updateCategorySchema)
    .action(async ({ parsedInput }) => {
        const { tournamentId, categoryId, name, basePrice, increment } = parsedInput;
        return await updateCategory({
            categoryId,
            tournamentId,
            name,
            basePrice,
            increment,
        });
    });

export const swapCategoryRankAction = actionClient
    .schema(swapCategoryRankSchema)
    .action(async ({ parsedInput }) => {

        console.log("swapCategoryRankAction", parsedInput);

        const { tournamentId, categoryId, participantId1, participantId2 } = parsedInput;

        // Get both participants
        const [participant1, participant2] = await Promise.all([
            db.query.participant.findFirst({
                where: and(
                    eq(participant.id, participantId1),
                    eq(participant.tournamentId, tournamentId),
                    eq(participant.categoryId, categoryId)
                ),
            }),
            db.query.participant.findFirst({
                where: and(
                    eq(participant.id, participantId2),
                    eq(participant.tournamentId, tournamentId),
                    eq(participant.categoryId, categoryId)
                ),
            }),
        ]);


        if (!participant1 || !participant2) {
            throw new ServerError("One or both participants not found in the category");
        }

        // Swap their ranks
        const [updatedParticipant1, updatedParticipant2] = await Promise.all([
            db.update(participant)
                .set({ categoryRank: participant2.categoryRank })
                .where(eq(participant.id, participantId1))
                .returning(),
            db.update(participant)
                .set({ categoryRank: participant1.categoryRank })
                .where(eq(participant.id, participantId2))
                .returning(),
        ]);


        return {
            participant1: updatedParticipant1[0],
            participant2: updatedParticipant2[0],
        };
    });

export const createTeamActionAndAddCaptain = actionClient
    .schema(createTeamSchema)
    .action(async ({ parsedInput }) => {
        const { tournamentId, name, captainId, purse } = parsedInput;
        console.log("parsedInput", parsedInput);

        const isParticipantExists = await db.query.participant.findFirst({
            where: and(eq(participant.id, captainId), eq(participant.tournamentId, tournamentId)),
        });

        console.log("isParticipantExists", isParticipantExists);

        if (!isParticipantExists) {
            throw new ServerError("Captain not found");
        }

        const team = await createTeam({
            tournamentId,
            name,
            purse,
        });



        if (!team) {
            throw new ServerError("Failed to create team");
        }


        await db.update(participant).set({
            teamId: team.id,
            teamRole: "captain",
            status: "confirmed",
        }).where(eq(participant.id, isParticipantExists.id));



        return team;
    });

export type { CreateCategoryInput, CreateTeamInput } from "./schema";




export const getData = async (slug: string) => {
    const [data, session] = await Promise.all([
        db.query.tournament.findFirst({
            where: eq(tournament.slug, slug),
            with: {
                teams: {
                    with: {
                        participants: {
                            with: {
                                user: true,
                            },
                        },
                    },
                },
                categories: true,
                participants: {
                    with: {
                        user: true,
                        category: true,
                        team: true,
                    },
                },
            },
        }),
        getServerSession(),
    ]);

    return { data, session };
};

export async function updateTeamAction({
    teamId,
    tournamentId,
    name,
    purse,
    captainId,
}: {
    teamId: string;
    tournamentId: string;
    name: string;
    purse: number;
    captainId: string;
}) {
    const session = await getServerSession();
    if (!session) throw new Error("Not authenticated");

    // Check if user has permission to manage teams
    await assertTournamentPermission(tournamentId, "dashboard");

    // Update team details
    await db
        .update(team)
        .set({
            name,
            purse,
        })
        .where(eq(team.id, teamId));

    // Update captain
    await db
        .update(participant)
        .set({
            teamRole: null,
            teamId: null,
        })
        .where(
            and(
                eq(participant.teamId, teamId),
                eq(participant.teamRole, "captain")
            )
        );

    await db
        .update(participant)
        .set({
            teamRole: "captain",
            teamId: teamId,
        })
        .where(
            and(
                eq(participant.userId, captainId)
            )
        );

    return { success: true };
}

export async function getPotentialCaptainsAction(tournamentId: string) {
    const session = await getServerSession();
    if (!session) throw new Error("Not authenticated");

    // Check if user has permission to manage teams
    await assertTournamentPermission(tournamentId, "dashboard");

    const tournamentData = await db.query.tournament.findFirst({
        where: eq(tournament.id, tournamentId),
        with: {
            participants: {
                with: {
                    user: true,
                },
                where: and(
                    eq(participant.status, "confirmed"),
                    isNull(participant.teamRole),
                ),
            },
        },
    });

    if (!tournamentData) throw new Error("Tournament not found");

    return {
        potentialCaptains: tournamentData.participants.map((p) => ({
            id: p.user.id,
            name: p.user.name,
        })),
    };
}

export async function getCategoryParticipantsAction(tournamentId: string, categoryId: string) {
    const session = await getServerSession();
    if (!session) throw new Error("Not authenticated");

    // Check if user has permission to manage categories
    await assertTournamentPermission(tournamentId, "dashboard");

    const tournamentData = await db.query.tournament.findFirst({
        where: eq(tournament.id, tournamentId),
        with: {
            participants: {
                where: eq(participant.categoryId, categoryId),
                with: {
                    user: true,
                    category: true,
                },
            },
        },
    });

    if (!tournamentData) throw new Error("Tournament not found");

    return {
        participants: tournamentData.participants.sort((a, b) => (a.categoryRank ?? 0) - (b.categoryRank ?? 0)),
    };
}

export const deleteCategoryAction = actionClient
    .schema(z.object({
        categoryId: z.string().min(1, "Category ID is required"),
        tournamentId: z.string().min(1, "Tournament ID is required"),
    }))
    .action(async ({ parsedInput }) => {
        const { categoryId, tournamentId } = parsedInput;
        return await deleteCategory({
            categoryId,
            tournamentId,
        });
    });

export const deleteTeamAction = actionClient
    .schema(z.object({
        teamId: z.string().min(1, "Team ID is required"),
        tournamentId: z.string().min(1, "Tournament ID is required"),
    }))
    .action(async ({ parsedInput }) => {
        const { teamId, tournamentId } = parsedInput;
        return await deleteTeam({
            teamId,
            tournamentId,
        });
    });