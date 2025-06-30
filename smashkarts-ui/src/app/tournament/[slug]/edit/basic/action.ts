'use server'
import { updateTournament } from "@/actions/tournament";
import { actionClient } from "@/lib/safe-action";
import { updateTournamentFormSchema } from "./form-schema";
import { getServerSession } from "@/auth/auth-server";
import { db } from "@/server/db";
import { tournament } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export const getData = async (slug: string) => {
    const [currentTournament, session] = await Promise.all([
        db.query.tournament.findFirst({
            where: eq(tournament.slug, slug),
        }),
        getServerSession(),
    ]);

    return { tournament: currentTournament, session };
};

export const updateTournamentAction = actionClient.schema(updateTournamentFormSchema).action(async ({ parsedInput }) => {
    return await updateTournament(parsedInput);
});




