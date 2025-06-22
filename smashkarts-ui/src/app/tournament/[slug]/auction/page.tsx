import { db } from "@/server/db";
import { eq } from "drizzle-orm";
import { tournament } from "@/server/db/schema";
import { notFound } from "next/navigation";
import AuctionClient from "./client-page";
import { StartAuctionForm } from "./start-auction-form";
import { getServerSession } from "@/auth/auth-server";
import { participant } from "@/server/db/schema";

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
      },
    }),
    db.query.tournament.findFirst({
      where: eq(tournament.slug, slug),
      with: {
        categories: true,
        teams: true,
      },
    }),
  ]);

  const isOrganizer = session?.user?.id === tournamentData?.organizerId;
  const isCaptain = participantData?.teamRole === "captain";
  const hasTeam = participantData?.team !== null;

  // Determine user role:
  // - If organizer AND has team (captain) → organizer role (can bid)
  // - If organizer but no team → organizer role (cannot bid)
  // - If captain but not organizer → bidder role (can bid)
  // - If neither → viewer role (cannot bid)
  const userRole = isOrganizer ? "organizer" : isCaptain ? "bidder" : "viewer";

  if (!tournamentData) {
    return notFound();
  }

  if (!tournamentData.auctionUrl) {
    return <StartAuctionForm tournamentId={tournamentData.id} />;
  }

  return (
    <AuctionClient
      tournament={tournamentData}
      userRole={userRole}
      isOrganizer={isOrganizer}
      userTeam={participantData?.team ?? null}
    />
  );
}
