import { db } from "@/server/db";
import { eq } from "drizzle-orm";
import { team, tournament } from "@/server/db/schema";
import { NextResponse } from "next/server";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ slug: string; teamId: string }> }
) {
    try {
        const { slug, teamId } = await params;

        // First, get the tournament to validate the slug
        const tournamentData = await db.query.tournament.findFirst({
            where: eq(tournament.slug, slug),
        });

        if (!tournamentData) {
            return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
        }

        // Get the team data with participants count
        const teamData = await db.query.team.findFirst({
            where: eq(team.id, teamId),
            with: {
                participants: {
                    columns: {
                        id: true,
                    },
                },
            },
        });

        if (!teamData) {
            return NextResponse.json({ error: "Team not found" }, { status: 404 });
        }

        // Verify the team belongs to this tournament
        if (teamData.tournamentId !== tournamentData.id) {
            return NextResponse.json({ error: "Team does not belong to this tournament" }, { status: 403 });
        }

        return NextResponse.json({
            teamId: teamData.id,
            purse: teamData.purse ?? 0,
            currentTeamPlayers: teamData.participants.length,
            maxTeamParticipants: tournamentData.maxTeamParticipants ?? 4,
        });
    } catch (error) {
        console.error("Error fetching team purse:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
} 