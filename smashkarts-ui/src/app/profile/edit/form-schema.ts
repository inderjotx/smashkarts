import { z } from "zod";

export const updateUserFormSchema = z.object({
    name: z.string().min(1, "Name is required"),
    image: z.string().url("Must be a valid URL").optional().or(z.literal("")),
    description: z.string().optional(),
    sId: z.string().optional(),
});

export type UpdateUserFormSchema = z.infer<typeof updateUserFormSchema>; 