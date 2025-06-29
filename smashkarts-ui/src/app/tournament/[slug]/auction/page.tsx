import { db } from "@/server/db";
import { eq } from "drizzle-orm";
import { tournament } from "@/server/db/schema";
import { notFound } from "next/navigation";
import AuctionClient from "./client-page";
import { StartAuctionForm } from "./start-auction-form";
import { getServerSession } from "@/auth/auth-server";
import { participant } from "@/server/db/schema";
import { canManageAuction, type TournamentRole } from "@/lib/utils";

export default async function AuctionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const session = await getServerSession();
  const [participantData, tournamentData] = await Promise.all([
    db.query.participant.findFirst({
      where: eq(participant.userId, session?.user?.id ?? ""),
      columns: {
        teamRole: true,
      },
      with: {
        team: true,
        tournamentRoles: true,
      },
    }),
    db.query.tournament.findFirst({
      where: eq(tournament.slug, slug),
      with: {
        categories: true,
        teams: {
          columns: {
            id: true,
            name: true,
            purse: true,
          },
          with: {
            participants: {
              columns: {
                id: true,
              },
            },
          },
        },
      },
    }),
  ]);

  // Get user's tournament roles
  const userRoles: TournamentRole[] =
    participantData?.tournamentRoles.map((role) => role.role) ?? [];

  // Check if user has auction permissions
  const hasAuctionPermission = canManageAuction(userRoles);
  const isCaptain = participantData?.teamRole === "captain";
  const hasTeam = participantData?.team !== null;

  // Determine user role:
  // - If has auction permission AND has team (captain) → organizer role (can bid)
  // - If has auction permission but no team → organizer role (cannot bid)
  // - If captain but no auction permission → bidder role (can bid)
  // - If neither → viewer role (cannot bid)
  const userRole = hasAuctionPermission
    ? "organizer"
    : isCaptain
      ? "bidder"
      : "viewer";

  if (!tournamentData) {
    return notFound();
  }

  if (!tournamentData.auctionUrl) {
    return <StartAuctionForm tournamentId={tournamentData.id} />;
  }

  // Transform tournament data to match expected format
  const transformedTournament = {
    id: tournamentData.id,
    slug: tournamentData.slug,
    auctionUrl: tournamentData.auctionUrl,
    maxTeamParticipants: tournamentData.maxTeamParticipants ?? 4,
    categories: tournamentData.categories,
    teams: tournamentData.teams.map((team) => ({
      id: team.id,
      name: team.name,
      purse: team.purse,
      currentTeamPlayers: team.participants.length,
      maxTeamParticipants: tournamentData.maxTeamParticipants ?? 4,
    })),
  };

  return (
    <AuctionClient
      tournament={transformedTournament}
      userRole={userRole}
      isOrganizer={hasAuctionPermission}
      userTeam={participantData?.team ?? null}
    />
  );
}
