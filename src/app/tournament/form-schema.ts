
import { z } from "zod";

export const registerForTournamentSchema = z.object({
    tournamentId: z.string(),
});

