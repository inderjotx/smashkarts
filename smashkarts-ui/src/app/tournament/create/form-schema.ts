import { z } from "zod";

export const createTournamentSchema = z.object({
    name: z.string().min(3, "Tournament name must be at least 3 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    bannerImage: z.string().url("Banner image must be a valid URL").optional(),
});

export type CreateTournamentInput = z.infer<typeof createTournamentSchema>;
