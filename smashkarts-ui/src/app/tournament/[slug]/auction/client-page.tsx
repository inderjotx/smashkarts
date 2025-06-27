"use client";

import { CategoryParticipantsSheet } from "./category-participants-sheet";
import { TeamParticipantsSheet } from "./team-participants-sheet";
import { AuctionRoom } from "./auction-room";
import type { team } from "@/server/db/schema";
import { useState } from "react";

type Team = typeof team.$inferSelect;

interface Participant {
  participantId: string;
  currentBid: {
    teamId: string;
    amount: number;
    participantId: string;
  } | null;
  isSold: boolean;
  biddingLogs: Array<{
    teamId: string;
    amount: number;
    participantId: string;
  }>;
  basePrice: number;
  increment: number;
  sellingBid: {
    teamId: string;
    amount: number;
    participantId: string;
  } | null;
  name: string;
  image: string;
  kd: number;
  gamesPlayed: number;
  description: string;
}

interface AuctionClientProps {
  tournament: {
    id: string;
    slug: string;
    auctionUrl: string | null;
    maxTeamParticipants: number;
    categories: {
      id: string;
      name: string;
    }[];
    teams: {
      id: string;
      name: string;
      purse: number | null;
      currentTeamPlayers: number;
      maxTeamParticipants: number;
    }[];
  };
  userRole: "organizer" | "bidder" | "viewer";
  isOrganizer: boolean;
  userTeam: Team | null;
}

export default function AuctionClient({
  tournament,
  userRole,
  isOrganizer,
  userTeam,
}: AuctionClientProps) {
  const [currentParticipant, setCurrentParticipant] =
    useState<Participant | null>(null);

  return (
    <div className="container mx-auto max-w-7xl space-y-6 py-6">
      {/* Participant and Team Management */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Auction Management</h1>
        <div className="flex gap-4">
          <CategoryParticipantsSheet
            tournamentId={tournament.id}
            categories={tournament.categories}
            userRole={userRole}
            currentParticipant={currentParticipant}
            onCurrentParticipantChange={setCurrentParticipant}
          />
          <TeamParticipantsSheet
            tournamentId={tournament.id}
            teams={tournament.teams}
          />
        </div>
      </div>

      {/* Auction Room - Main bidding interface */}
      {tournament.auctionUrl && (
        <AuctionRoom
          tournamentSlug={tournament.slug}
          userRole={userRole}
          isOrganizer={isOrganizer}
          userTeam={userTeam}
          auctionUrl={tournament.auctionUrl}
          teams={tournament.teams}
          onCurrentParticipantChange={setCurrentParticipant}
        />
      )}
    </div>
  );
}
