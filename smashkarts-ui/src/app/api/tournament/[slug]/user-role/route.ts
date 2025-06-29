import { db } from "@/server/db";
import { eq, and } from "drizzle-orm";
import { tournament, participant } from "@/server/db/schema";
import { NextResponse } from "next/server";
import { getServerSession } from "@/auth/auth-server";
import { getParticipantTournamentRoles } from "@/actions/tournament";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    const session = await getServerSession()
    const userId = session?.user?.id
    console.log("userId", userId);
    console.log("user name", session?.user?.name);

    if (userId) {
        const tournamentData = await db.query.tournament.findFirst({
            where: eq(tournament.slug, slug)
        });

        if (!tournamentData) {
            return NextResponse.json({
                role: "viewer",
                roles: [],
                teamRole: null,
                canBid: false,
                isOrganizer: false
            });
        }

        const participantData = await db.query.participant.findFirst({
            where: and(
                eq(participant.userId, userId),
                eq(participant.tournamentId, tournamentData.id)
            ),
            with: {
                tournamentRoles: true,
            }
        });

        if (!participantData) {
            return NextResponse.json({
                role: "viewer",
                roles: [],
                teamRole: null,
                canBid: false,
                isOrganizer: false
            });
        }

        // Get user's tournament roles
        const userRoles = participantData.tournamentRoles.map(role => role.role);

        // Determine primary role based on hierarchy
        let primaryRole = "viewer";
        if (userRoles.includes("organizer")) {
            primaryRole = "organizer";
        } else if (userRoles.includes("admin")) {
            primaryRole = "admin";
        } else if (userRoles.includes("maintainer")) {
            primaryRole = "maintainer";
        } else if (userRoles.includes("auctioneer")) {
            primaryRole = "auctioneer";
        }

        // Check if user is a team captain (for bidding purposes)
        const isCaptain = participantData.teamRole === "captain";

        // only (team captain) can bid
        const canBid = isCaptain

        return NextResponse.json({
            role: primaryRole,
            roles: userRoles,
            teamRole: participantData.teamRole ?? null,
            canBid: canBid,
            isOrganizer: userRoles.includes("organizer")
        });
    }

    return NextResponse.json({
        role: "viewer",
        roles: [],
        teamRole: null,
        canBid: false,
        isOrganizer: false
    });
}