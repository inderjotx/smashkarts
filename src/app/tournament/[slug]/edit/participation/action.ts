'use server'

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


