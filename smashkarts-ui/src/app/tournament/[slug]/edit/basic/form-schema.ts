import { z } from "zod";

export const updateTournamentFormSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string(),
    bannerImage: z.string().url("Must be a valid URL"),
    prizePool: z.string().min(1, "Prize pool must be positive"),
    tournamentId: z.string().min(1),
});

export type UpdateTournamentFormSchema = z.infer<typeof updateTournamentFormSchema>;
