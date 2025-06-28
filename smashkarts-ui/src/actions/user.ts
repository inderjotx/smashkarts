'use server'
import { getServerSession } from "@/auth/auth-server";
import { ServerError } from "@/lib/safe-action";
import { db } from "@/server/db";
import { user } from "@/server/db/schema";
import { eq } from "drizzle-orm";

interface UpdateUserParams {
    name: string;
    image?: string;
    description?: string;
    sId?: string;
}

export async function updateUser(params: UpdateUserParams) {
    const session = await getServerSession();
    if (!session) {
        throw new ServerError("Unauthorized");
    }

    const { name, image, description, sId } = params;

    const updatedUser = await db.update(user)
        .set({
            name,
            image: image ?? null,
            description: description ?? null,
            sId: sId ?? null,
            updatedAt: new Date()
        })
        .where(eq(user.id, session.user.id))
        .returning();

    return updatedUser[0];
} 