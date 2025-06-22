import { db } from "@/server/db";
import { eq, and } from "drizzle-orm";
import { tournament, participant } from "@/server/db/schema";
import { NextResponse } from "next/server";
import { getServerSession } from "@/auth/auth-server";


export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {

    const { slug } = await params;

    const session = await getServerSession()
    const userId = session?.user?.id

    if (userId) {

        const [tournamentData, participantData] = await Promise.all([
            db.query.tournament.findFirst({
                where: eq(tournament.slug, slug)
            }),
            db.query.participant.findFirst({
                where: and(
                    eq(participant.userId, userId),
                    eq(participant.tournamentId, (await db.query.tournament.findFirst({
                        where: eq(tournament.slug, slug)
                    }))?.id ?? "")
                )
            })
        ])

        const isOrganizer = tournamentData?.organizerId === userId
        if (isOrganizer) {
            return NextResponse.json({ role: "organizer" })
        }

        const isCaptain = participantData?.teamRole == "captain"
        if (isCaptain) {
            return NextResponse.json({ role: "captain" })
        }

        return NextResponse.json({ role: "viewer" })
    }

    return NextResponse.json({ role: "viewer" })
}