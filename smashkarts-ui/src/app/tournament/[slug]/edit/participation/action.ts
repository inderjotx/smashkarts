'use server'

import { getServerSession } from "@/auth/auth-server";
import { db } from "@/server/db";
import { tournament, participant } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { actionClient } from "@/lib/safe-action"
import { z } from "zod";
import { updateParticipantCategory, updateParticipantStatus } from "@/actions/tournament"

export const updateParticipantCategoryAction = actionClient.schema(z.object({
    participantId: z.string(),
    categoryId: z.string(),
    tournamentId: z.string(),
})).action(async ({ parsedInput: { participantId, categoryId, tournamentId } }) => {
    console.log("updateParticipantCategoryAction", participantId, categoryId, tournamentId);
    return await updateParticipantCategory({ participantId, categoryId, tournamentId });
});

export const updateParticipantStatusAction = actionClient.schema(z.object({
    participantId: z.string(),
    status: z.enum(["confirmed", "pending", "rejected"]),
    tournamentId: z.string(),
})).action(async ({ parsedInput: { participantId, status, tournamentId } }) => {
    return await updateParticipantStatus({ participantId, status, tournamentId });
});

export const getData = async (slug: string) => {
    const session = await getServerSession();

    const data = await db.query.tournament.findFirst({
        where: eq(tournament.slug, slug),
        with: {
            categories: true,
            participants: {
                with: {
                    user: true,
                    category: true,
                    team: {
                        columns: {
                            id: true,
                            name: true,
                        }
                    },
                    tournamentRoles: true,
                },
            },
        },
    });

    let currentUserParticipant = null;
    if (session?.user?.id && data) {
        currentUserParticipant = await db.query.participant.findFirst({
            where: and(
                eq(participant.tournamentId, data.id),
                eq(participant.userId, session.user.id)
            ),
            with: {
                user: true,
                category: true,
                team: {
                    columns: {
                        id: true,
                        name: true,
                    }
                },
                tournamentRoles: true,
            },
        });
    }

    return { data, session, currentUserParticipant };
};