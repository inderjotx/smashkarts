"use server"

import { getServerSession } from "@/auth/auth-server";
import { actionClient, ServerError } from "@/lib/safe-action";
import { registerForTournamentSchema } from "./form-schema";
import { db } from "@/server/db";
import { and, eq } from "drizzle-orm";
import { participant, tournament } from "@/server/db/schema";
import { revalidatePath } from "next/cache";


export const registerForTournament = actionClient
    .schema(registerForTournamentSchema)
    .action(async ({ parsedInput: { tournamentId } }) => {
        const session = await getServerSession();

        if (!session) {
            throw new ServerError("Unauthorized");
        }

        const currentTournament = await db.query.tournament.findFirst({
            where: and(
                eq(tournament.id, tournamentId),
                eq(tournament.status, "active"),
            ),

        });

        if (!currentTournament) {
            throw new ServerError("Tournament not found");
        }

        const isParticipant = await db.query.participant.findFirst({
            where: and(
                eq(participant.tournamentId, tournamentId),
                eq(participant.userId, session.user.id),
            ),
        });

        if (isParticipant) {
            throw new ServerError("You are already a participant in this tournament");
        }

        const result = await db.insert(participant).values({
            tournamentId,
            userId: session.user.id,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        if (!result) {
            throw new ServerError("Failed to register for tournament");
        }

        revalidatePath(`/tournament/${currentTournament.slug}`);

        return {
            success: true,
        };
    })
