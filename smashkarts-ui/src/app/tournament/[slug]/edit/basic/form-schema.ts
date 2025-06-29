import { z } from "zod";

export const updateTournamentFormSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string(),
    bannerImage: z.string().url("Must be a valid URL"),
    maxTeamParticipants: z.number().min(1, "Max team participants must be at least 1").max(10, "Max team participants cannot exceed 10"),
    tournamentId: z.string().min(1),
});

export type UpdateTournamentFormSchema = z.infer<typeof updateTournamentFormSchema>;
