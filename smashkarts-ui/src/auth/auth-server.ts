import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/server/db";
import { env } from "@/env";
import { headers } from "next/headers";
export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
    }),
    socialProviders: {
        google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
        }
    },
});



export const getServerSession = async () => {

    const session = await auth.api.getSession({
        headers: await headers(),
    });

    return session;
}