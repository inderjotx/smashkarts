'use server'
import { actionClient } from "@/lib/safe-action";
import { createTournamentSchema } from "./form-schema";
import { db } from "@/server/db";
import { participant, tournament, tournamentRoleAssignment } from "@/server/db/schema";
import { getServerSession } from "@/auth/auth-server";
import { redirect } from "next/navigation";
import slugify from "slugify";

export const createTournament = actionClient
    .schema(createTournamentSchema)
    .action(async ({ parsedInput: { name, description, bannerImage } }) => {

        const session = await getServerSession();

        if (!session) {
            redirect('/sign-in')
        }

        const result = await db.insert(tournament).values({
            name,
            slug: slugify(name).toLowerCase(),
            description,
            bannerImage,
            createdAt: new Date(),
            updatedAt: new Date(),
        }).returning({ id: tournament.id, slug: tournament.slug });

        if (!result || result.length === 0) {
            throw new Error("Failed to create tournament");
        }

        if (result?.[0]?.id) {
            // Create participant record
            const participantResult = await db.insert(participant).values({
                tournamentId: result[0].id,
                userId: session.user.id,
                createdAt: new Date(),
                updatedAt: new Date(),
                status: "confirmed"
            }).returning({ id: participant.id });

            if (participantResult?.[0]?.id) {
                // Assign organizer role to the creator
                await db.insert(tournamentRoleAssignment).values({
                    tournamentId: result[0].id,
                    participantId: participantResult[0].id,
                    role: "organizer",
                    assignedBy: session.user.id,
                });
            }
        }

        return result[0];
    });
