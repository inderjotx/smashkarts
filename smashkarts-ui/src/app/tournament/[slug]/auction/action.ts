"use server";

import { getServerSession } from "@/auth/auth-server";
import { db } from "@/server/db";
import { participant, tournament, team } from "@/server/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { startAuction } from "@/service/webhook-service";
import { assertTournamentPermission } from "@/actions/tournament";

export async function getCategoryParticipantsAction(tournamentId: string, categoryId: string) {
    const session = await getServerSession();
    if (!session) throw new Error("Not authenticated");

    const tournamentData = await db.query.tournament.findFirst({
        where: eq(tournament.id, tournamentId),
        with: {
            participants: {
                where: and(
                    eq(participant.categoryId, categoryId),
                    isNull(participant.teamId),
                    eq(participant.status, "confirmed")
                ),
                with: {
                    user: true,
                    category: true,
                },
            },
        },
    });

    if (!tournamentData) throw new Error("Tournament not found");

    let hasAuctionPermission = false;
    try {
        await assertTournamentPermission(tournamentId, "auction");
        hasAuctionPermission = true;
    } catch (error) {
        hasAuctionPermission = false;
    }

    return {
        participants: tournamentData.participants.sort((a, b) => (a.categoryRank ?? 0) - (b.categoryRank ?? 0)),
        isOrganizer: hasAuctionPermission,
    };
}

export async function startAuctionAction(tournamentId: string) {
    const session = await getServerSession();
    if (!session) throw new Error("Not authenticated");

    await assertTournamentPermission(tournamentId, "auction");

    const tournamentData = await db.query.tournament.findFirst({
        where: eq(tournament.id, tournamentId),
    });

    if (!tournamentData) throw new Error("Tournament not found");

    // Call your existing startAuction function here
    // This is just a placeholder - implement your actual auction start logic
    const url = await startAuction(tournamentData.slug);

    return { success: true, url };
}

export async function getTeamParticipantsAction(tournamentId: string, teamId: string) {
    const session = await getServerSession();
    if (!session) throw new Error("Not authenticated");

    const teamData = await db.query.team.findFirst({
        where: and(
            eq(team.id, teamId),
            eq(team.tournamentId, tournamentId)
        ),
        with: {
            participants: {
                with: {
                    user: true,
                },
            },
        },
    });

    if (!teamData) throw new Error("Team not found");

    let hasAuctionPermission = false;
    try {
        await assertTournamentPermission(tournamentId, "auction");
        hasAuctionPermission = true;
    } catch (error) {
        hasAuctionPermission = false;
    }

    return {
        team: teamData,
        isOrganizer: hasAuctionPermission,
    };
}