
import { getServerSession } from "@/auth/auth-server";
import { db } from "@/server/db";
import { tournament } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";


export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {

    const { slug } = await params;
    const [data, session] = await Promise.all([
        db.query.tournament.findFirst({
            where: eq(tournament.slug, slug),
            with: {
                categories: true,
                organizer: true,
                participants: {
                    with: {
                        user: true,
                        category: true,
                        team: true,
                    },
                },
            },
        }),
        getServerSession(),
    ]);

    if (!data) {
        return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    if (session?.user.id !== data.organizer.id) {
        return NextResponse.json({ error: "You are not authorized to edit this tournament" }, { status: 403 });
    }

    return NextResponse.json({ data: data, session });
}
