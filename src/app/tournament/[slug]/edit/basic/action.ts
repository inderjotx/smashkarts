'use server'
import { updateTournament } from "@/actions/tournament";
import { actionClient } from "@/lib/safe-action";
import { updateTournamentFormSchema } from "./form-schema";





export const updateTournamentAction = actionClient.schema(updateTournamentFormSchema).action(async ({ parsedInput }) => {
    return await updateTournament(parsedInput);
});




