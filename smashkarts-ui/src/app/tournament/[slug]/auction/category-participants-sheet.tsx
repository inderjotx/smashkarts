"use client";

import { useQuery } from "@tanstack/react-query";
import { formatIndianNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { getCategoryParticipantsAction } from "./action";
import { socketService } from "@/service/socket-service";
import { toast } from "sonner";

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

interface CategoryParticipantsSheetProps {
  tournamentId: string;
  categories: {
    id: string;
    name: string;
  }[];
  userRole: "organizer" | "bidder" | "viewer";
  currentParticipant: Participant | null;
  onCurrentParticipantChange: (participant: Participant | null) => void;
}

export function CategoryParticipantsSheet({
  tournamentId,
  categories,
  userRole,
  currentParticipant,
  onCurrentParticipantChange,
}: CategoryParticipantsSheetProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>(
    categories[0]?.id ?? "",
  );

  const { data: participantsData } = useQuery({
    queryKey: ["category-participants", tournamentId, selectedCategory],
    queryFn: async () => {
      if (!selectedCategory) return null;
      return getCategoryParticipantsAction(tournamentId, selectedCategory);
    },
    enabled: !!selectedCategory,
  });

  const handleStartBidding = async (participantId: string) => {
    try {
      await socketService.startParticipantBidding(participantId, userRole);
      toast.success("Bidding started successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to start bidding",
      );
    }
  };

  const handleCancelBidding = async (participantId: string) => {
    try {
      await socketService.cancelParticipantBidding(participantId, userRole);
      toast.success("Bidding canceled successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to cancel bidding",
      );
    }
  };

  // Check if a participant is currently being auctioned
  const isParticipantCurrentlyAuctioned = (participantId: string) => {
    console.log(
      "Checking participant:",
      participantId,
      "Current participant:",
      currentParticipant?.participantId,
    );
    return currentParticipant?.participantId === participantId;
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button>View Participants</Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>Category Participants</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>K/D</TableHead>
                <TableHead>Games Played</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Selling Price</TableHead>
                {userRole === "organizer" && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {participantsData?.participants.map((participant) => {
                const isCurrentlyAuctioned = isParticipantCurrentlyAuctioned(
                  participant.id,
                );
                const isAuctionActive = currentParticipant !== null;

                return (
                  <TableRow key={participant.id}>
                    <TableCell>{participant.categoryRank ?? "N/A"}</TableCell>
                    <TableCell>{participant.user.name}</TableCell>
                    <TableCell>{participant.user.kd}</TableCell>
                    <TableCell>{participant.user.gamesPlayed}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${
                          participant.status === "confirmed"
                            ? "bg-green-100 text-green-800"
                            : participant.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {participant.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      {participant.sellingPrice ? (
                        <span className="font-medium">
                          ₹{formatIndianNumber(participant.sellingPrice)}
                        </span>
                      ) : (
                        "N/A"
                      )}
                    </TableCell>
                    {userRole === "organizer" && (
                      <TableCell>
                        {!participant.sellingPrice && (
                          <>
                            {isCurrentlyAuctioned ? (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() =>
                                  handleCancelBidding(participant.id)
                                }
                              >
                                Cancel
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleStartBidding(participant.id)
                                }
                                disabled={isAuctionActive}
                              >
                                Start Bid
                              </Button>
                            )}
                          </>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </SheetContent>
    </Sheet>
  );
}
