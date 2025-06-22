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
      userTeam={participantData?.team ?? null}
    />
  );
}
