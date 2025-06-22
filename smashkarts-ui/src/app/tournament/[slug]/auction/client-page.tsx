"use client";

import { CategoryParticipantsSheet } from "./category-participants-sheet";
import { TeamParticipantsSheet } from "./team-participants-sheet";
import { AuctionRoom } from "./auction-room";
import type { team } from "@/server/db/schema";

type Team = typeof team.$inferSelect;

interface AuctionClientProps {
  tournament: {
    id: string;
    slug: string;
    auctionUrl: string | null;
    categories: {
      id: string;
      name: string;
    }[];
    teams: {
      id: string;
      name: string;
    }[];
  };
  userRole: "organizer" | "bidder" | "viewer";
  userTeam: Team | null;
}

export default function AuctionClient({
  tournament,
  userRole,
  userTeam,
}: AuctionClientProps) {
  return (
    <div className="container mx-auto max-w-7xl space-y-6 py-6">
      {/* Auction Room - Main bidding interface */}
      {tournament.auctionUrl && (
        <AuctionRoom
          tournamentSlug={tournament.slug}
          userRole={userRole}
          userTeam={userTeam}
          auctionUrl={tournament.auctionUrl}
          teams={tournament.teams}
        />
      )}

      {/* Participant and Team Management */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Auction Management</h1>
        <div className="flex gap-4">
          <CategoryParticipantsSheet
            tournamentId={tournament.id}
            categories={tournament.categories}
            userRole={userRole}
          />
          <TeamParticipantsSheet
            tournamentId={tournament.id}
            teams={tournament.teams}
          />
        </div>
      </div>
    </div>
  );
}
