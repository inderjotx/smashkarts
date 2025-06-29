import { getServerSession } from "@/auth/auth-server";
import { db } from "@/server/db";
import { tournament } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { assertTournamentPermission } from "@/actions/tournament";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    console.log("slug basic", slug);
    const [session, data] = await Promise.all([
        getServerSession(),
        db.query.tournament.findFirst({
            where: eq(tournament.slug, slug),
            columns: {
                id: true,
                name: true,
                slug: true,
                description: true,
                bannerImage: true,
                status: true,
                maxTeamParticipants: true,
            },
        })
    ]);

    if (!data) {
        return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    if (!session) {
        return NextResponse.json({ error: "Please sign in to edit this tournament" }, { status: 401 });
    }

    // Check if user has permission to edit tournament
    try {
        await assertTournamentPermission(data.id, "dashboard");
    } catch (error) {
        return NextResponse.json({ error: "You don't have permission to edit this tournament" }, { status: 403 });
    }

    return NextResponse.json({ tournament: data, session });
}