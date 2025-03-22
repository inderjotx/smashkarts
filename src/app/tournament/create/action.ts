'use server'

import { eq } from "drizzle-orm";
import { actionClient } from "@/lib/safe-action";
import { createTournamentSchema } from "./form-schema";
import { db } from "@/server/db";
import { participant, tournament, player } from "@/server/db/schema";
import { getServerSession } from "@/auth/auth-server";
import { redirect } from "next/navigation";
import slugify from "slugify";

export const createTournament = actionClient
    .schema(createTournamentSchema)
    .action(async ({ parsedInput: { name, description, prizePool, bannerImage } }) => {

        const session = await getServerSession();

        if (!session) {
            redirect('/sign-in')
        }

        const organizerPlayer = await db.select().from(player).where(eq(player.userId, session.user.id));

        if (!organizerPlayer || organizerPlayer.length === 0 || !organizerPlayer?.[0]?.id) {
            throw new Error("Player not found");
        }

        const result = await db.insert(tournament).values({
            name,
            slug: slugify(name).toLowerCase(),
            description,
            prizePool,
            bannerImage,
            organizerId: organizerPlayer[0].id,
            createdAt: new Date(),
            updatedAt: new Date(),
        }).returning({ id: tournament.id, slug: tournament.slug });

        if (!result || result.length === 0) {
            throw new Error("Failed to create tournament");
        }

        if (result?.[0]?.id && organizerPlayer?.[0]?.id) {
            await db.insert(participant).values({
                tournamentId: result[0].id,
                playerId: organizerPlayer[0].id,
                createdAt: new Date(),
                updatedAt: new Date(),
                status: "confirmed"
            });
        }

        return result[0];
    });
