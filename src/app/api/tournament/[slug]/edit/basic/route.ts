import { getServerSession } from "@/auth/auth-server";
import { db } from "@/server/db";
import { tournament } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";


export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    console.log("slug basic", slug);
    const [session, data] = await Promise.all([
        getServerSession(),
        db.query.tournament.findFirst({
            where: eq(tournament.slug, slug),
            with: {
                organizer: true,
            },
            columns: {
                id: true,
                name: true,
                slug: true,
                description: true,
                bannerImage: true,
                prizePool: true,
                status: true,
            },
        })
    ]);

    if (!data) {
        return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    if (session?.user?.id != data?.organizer?.id) {
        return NextResponse.json({ error: "You are not the organizer of this tournament" }, { status: 403 });
    }

    return NextResponse.json({ tournament: data, session });
}