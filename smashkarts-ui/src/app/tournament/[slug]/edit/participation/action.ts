'use server'

import { getServerSession } from "@/auth/auth-server";
import { db } from "@/server/db";
import { tournament } from "@/server/db/schema";
import { eq } from "drizzle-orm";
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
    const [data, session] = await Promise.all([
        db.query.tournament.findFirst({
            where: eq(tournament.slug, slug),
            with: {
                categories: true,
                participants: {
                    with: {
                        user: true,
                        category: true,
                        team: {
                            columns: {
                                name: true,
                            }
                        }
                    },
                },
            },
        }),
        getServerSession(),
    ]);

    return { data, session };
};