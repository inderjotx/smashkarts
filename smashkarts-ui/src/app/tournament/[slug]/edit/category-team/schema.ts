import { z } from "zod";

export const createCategorySchema = z.object({
    tournamentId: z.string().min(1, "Tournament ID is required"),
    name: z.string().min(1, "Name is required"),
    basePrice: z.number().min(0, "Base price must be positive"),
});

export const createTeamSchema = z.object({
    tournamentId: z.string().min(1, "Tournament ID is required"),
    name: z.string().min(1, "Name is required"),
    captainId: z.string().min(1, "Captain is required"),
    purse: z.number().min(0, "Purse must be positive").default(0),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type CreateTeamInput = z.infer<typeof createTeamSchema>;

export const updateCategorySchema = z.object({
    tournamentId: z.string().min(1, "Tournament ID is required"),
    categoryId: z.string().min(1, "Category ID is required"),
    name: z.string().min(1, "Name is required"),
    basePrice: z.number().min(0, "Base price must be positive"),
});

export const swapCategoryRankSchema = z.object({
    tournamentId: z.string().min(1, "Tournament ID is required"),
    categoryId: z.string().min(1, "Category ID is required"),
    participantId1: z.string().min(1, "First participant ID is required"),
    participantId2: z.string().min(1, "Second participant ID is required"),
});

export type SwapCategoryRankInput = z.infer<typeof swapCategoryRankSchema>;