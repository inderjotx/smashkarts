'use server'

import { actionClient } from "@/lib/safe-action";
import { createTournamentSchema } from "./form-schema";
import { db } from "@/server/db";
import { tournament } from "@/server/db/schema";
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

        const result = await db.insert(tournament).values({
            name,
            slug: slugify(name),
            description,
            prizePool,
            bannerImage,
            organizerId: session.user.id,
            createdAt: new Date(),
            updatedAt: new Date(),
        }).returning({ id: tournament.id, slug: tournament.slug });

        return result[0];
    });
