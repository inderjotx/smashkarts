'use server'
import { updateUser } from "@/actions/user";
import { actionClient } from "@/lib/safe-action";
import { updateUserFormSchema } from "./form-schema";

export const updateUserAction = actionClient.schema(updateUserFormSchema).action(async ({ parsedInput }) => {
    return await updateUser(parsedInput);
}); 