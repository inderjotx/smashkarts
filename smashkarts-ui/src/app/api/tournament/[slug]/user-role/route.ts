import { db } from "@/server/db";
import { eq, and } from "drizzle-orm";
import { tournament, participant } from "@/server/db/schema";
import { NextResponse } from "next/server";
import { getServerSession } from "@/auth/auth-server";
import { getParticipantTournamentRoles } from "@/actions/tournament";
import { NextRequest } from "next/server";
import { assignTournamentRole, removeTournamentRole, assertTournamentRoles } from "@/actions/tournament";
import { type TournamentRole } from "@/lib/utils";

interface UpdateRoleRequest {
    participantId: string;
    role: TournamentRole;
    action: 'add' | 'remove';
}

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

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        const session = await getServerSession();

        if (!session) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        // Get tournament data
        const tournamentData = await db.query.tournament.findFirst({
            where: eq(tournament.slug, slug),
        });

        if (!tournamentData) {
            return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
        }

        // Check if user has organizer permissions
        try {
            await assertTournamentRoles(tournamentData.id, ["organizer"]);
        } catch (error) {
            return NextResponse.json({ error: "Only organizers can update tournament roles" }, { status: 403 });
        }

        const body = await request.json() as UpdateRoleRequest;
        const { participantId, role, action } = body;

        if (!participantId || !role || !action) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        if (!["add", "remove"].includes(action)) {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

        if (!["organizer", "admin", "maintainer", "auctioneer"].includes(role)) {
            return NextResponse.json({ error: "Invalid role" }, { status: 400 });
        }

        // Get the current user's participant record to use as assignedBy
        const currentParticipant = await db.query.participant.findFirst({
            where: eq(participant.userId, session.user.id),
        });

        if (!currentParticipant) {
            return NextResponse.json({ error: "Current user not found as participant" }, { status: 404 });
        }

        if (action === "add") {
            await assignTournamentRole(tournamentData.id, participantId, role, currentParticipant.id);
        } else {
            await removeTournamentRole(tournamentData.id, participantId, role);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating tournament role:", error);
        return NextResponse.json(
            { error: "Failed to update tournament role" },
            { status: 500 }
        );
    }
}