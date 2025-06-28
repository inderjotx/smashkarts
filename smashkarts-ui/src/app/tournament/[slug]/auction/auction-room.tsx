"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { socketService } from "@/service/socket-service";
import { webSocketClientService } from "@/service/websocket-client-service";
import { toast } from "sonner";
import type { team } from "@/server/db/schema";
import { AmountInput } from "@/components/ui/amount-input";
import { formatIndianNumber } from "@/lib/utils";

type Team = typeof team.$inferSelect;

interface Bid {
  teamId: string;
  amount: number;
  participantId: string;
}

interface Participant {
  participantId: string;
  currentBid: Bid | null;
  isSold: boolean;
  biddingLogs: Bid[];
  basePrice: number;
  increment: number;
  sellingBid: Bid | null;
  name: string;
  image: string;
  kd: number;
  gamesPlayed: number;
  description: string;
}

interface AuctionRoomProps {
  tournamentSlug: string;
  userRole: "organizer" | "bidder" | "viewer";
  isOrganizer: boolean;
  userTeam: Team | null;
  auctionUrl: string;
  teams: {
    id: string;
    name: string;
    purse: number | null;
    currentTeamPlayers: number;
    maxTeamParticipants: number;
  }[];
  onCurrentParticipantChange: (participant: Participant | null) => void;
}

export function AuctionRoom({
  tournamentSlug,
  userRole,
  isOrganizer,
  userTeam,
  auctionUrl,
  teams,
  onCurrentParticipantChange,
}: AuctionRoomProps) {
  const [currentParticipant, setCurrentParticipant] =
    useState<Participant | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [bidAmount, setBidAmount] = useState<number>(0);
  const [auctionStatus, setAuctionStatus] = useState<{
    exists: boolean;
    checking: boolean;
    restarting: boolean;
  }>({
    exists: false,
    checking: true,
    restarting: false,
  });

  // Check auction status on mount
  useEffect(() => {
    const checkAuctionStatus = async () => {
      if (!tournamentSlug) return;

      setAuctionStatus((prev) => ({ ...prev, checking: true }));

      try {
        const result =
          await webSocketClientService.checkAuctionExists(tournamentSlug);
        setAuctionStatus({
          exists: result.exists,
          checking: false,
          restarting: false,
        });

        if (!result.exists && userRole === "organizer") {
          toast.warning("Auction is not active. You can restart it to begin.");
        }
      } catch (error) {
        console.error("Failed to check auction status:", error);
        setAuctionStatus({
          exists: false,
          checking: false,
          restarting: false,
        });
        toast.error("Failed to check auction status");
      }
    };

    void checkAuctionStatus();
  }, [tournamentSlug, userRole]);

  // Restart auction function
  const handleRestartAuction = async () => {
    if (!tournamentSlug) return;

    setAuctionStatus((prev) => ({ ...prev, restarting: true }));

    try {
      const result =
        await webSocketClientService.ensureAuctionExists(tournamentSlug);

      if (result.restarted) {
        toast.success("Auction restarted successfully!");
        setAuctionStatus({
          exists: true,
          checking: false,
          restarting: false,
        });

        // Reconnect to the auction
        if (auctionUrl) {
          socketService.disconnect();
          socketService.initialize(auctionUrl);
        }
      } else {
        toast.info("Auction is already active");
        setAuctionStatus({
          exists: true,
          checking: false,
          restarting: false,
        });
      }
    } catch (error) {
      console.error("Failed to restart auction:", error);
      toast.error("Failed to restart auction");
      setAuctionStatus((prev) => ({ ...prev, restarting: false }));
    }
  };

  // Initialize socket connection
  useEffect(() => {
    if (!auctionUrl || !auctionStatus.exists) return;

    // Initialize socket service
    socketService.initialize(auctionUrl);
    const socket = socketService.getSocket();

    if (!socket) return;

    // Connection status
    const handleConnect = () => {
      console.log("Connected to auction room");
      setIsConnected(true);
      toast.success("Connected to auction room");
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      toast.error("Disconnected from auction room");
    };

    // Set up event listeners
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    // Set up auction state change callback
    socketService.onAuctionStateChange((state) => {
      console.log("Auction state updated:", state);

      if (state.isActive && state.currentParticipant) {
        setCurrentParticipant(state.currentParticipant);
        onCurrentParticipantChange(state.currentParticipant);
        // Set initial bid amount based on whether there's already a bid
        if (state.currentParticipant.currentBid) {
          setBidAmount(
            state.currentParticipant.currentBid.amount +
              state.currentParticipant.increment,
          );
        } else {
          setBidAmount(state.currentParticipant.basePrice);
        }
      } else {
        setCurrentParticipant(null);
        onCurrentParticipantChange(null);
        console.log("No active participant in auction");
      }
    });

    // Set up individual event handlers for toast messages
    socket.on(
      "server:participantBiddingStarted",
      (data: { participant: Participant }) => {
        toast.info(`Bidding started for ${data.participant.name}`);
      },
    );

    socket.on("server:bid", (data: { participant: Participant }) => {
      if (data.participant.currentBid) {
        toast.success(
          `New bid: ₹${formatIndianNumber(data.participant.currentBid.amount)} by ${getTeamName(data.participant.currentBid.teamId)}`,
        );
      }
    });

    socket.on(
      "server:participantSold",
      (data: { participant: Participant }) => {
        toast.success(
          `${data.participant.name} sold for ₹${formatIndianNumber(data.participant.sellingBid?.amount ?? 0)} to ${getTeamName(data.participant.sellingBid?.teamId)}`,
        );

        // Clear current participant after a delay
        setTimeout(() => {
          setCurrentParticipant(null);
          onCurrentParticipantChange(null);
        }, 3000);
      },
    );

    socket.on(
      "server:participantBiddingCanceled",
      (data: { participant: Participant }) => {
        toast.info(`Bidding canceled for ${data.participant.name}`);
        setCurrentParticipant(null);
        onCurrentParticipantChange(null);
      },
    );

    socket.on("server:error", (data: { error: string }) => {
      toast.error(data.error);
    });

    // Cleanup
    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("server:participantBiddingStarted");
      socket.off("server:bid");
      socket.off("server:participantSold");
      socket.off("server:participantBiddingCanceled");
      socket.off("server:error");
      socketService.disconnect();
    };
  }, [auctionUrl, userRole, auctionStatus.exists, onCurrentParticipantChange]);

  // Helper function to get team name
  const getTeamName = (teamId?: string) => {
    if (!teamId || !teams.length) return "Unknown Team";
    const team = teams.find((t) => t.id === teamId);
    return team?.name ?? "Unknown Team";
  };

  // Helper function to get team purse
  const getTeamPurse = (teamId?: string) => {
    if (!teamId || !teams.length) return 0;
    const team = teams.find((t) => t.id === teamId);
    return team?.purse ?? 0;
  };

  // Helper function to get team current players count
  const getTeamCurrentPlayers = (teamId?: string) => {
    if (!teamId || !teams.length) return 0;
    const team = teams.find((t) => t.id === teamId);
    return team?.currentTeamPlayers ?? 0;
  };

  // Helper function to get team max participants
  const getTeamMaxParticipants = (teamId?: string) => {
    if (!teamId || !teams.length) return 4; // default fallback
    const team = teams.find((t) => t.id === teamId);
    return team?.maxTeamParticipants ?? 4;
  };

  // Helper function to check if team can add more players
  const canTeamAddPlayer = (teamId?: string) => {
    if (!teamId) return false;
    const currentPlayers = getTeamCurrentPlayers(teamId);
    const maxPlayers = getTeamMaxParticipants(teamId);
    return currentPlayers < maxPlayers;
  };

  // Helper function to calculate remaining purse for a team after their current bid
  const getTeamRemainingPurse = (teamId?: string, bidAmount?: number) => {
    if (!teamId || !bidAmount) return 0;
    const teamPurse = getTeamPurse(teamId);
    return teamPurse - bidAmount;
  };

  // Helper function to check if current user's team is the highest bidder
  const isCurrentTeamHighestBidder = () => {
    if (!currentParticipant?.currentBid || !userTeam) return false;
    return currentParticipant.currentBid.teamId === userTeam.id;
  };

  // Helper function to check if user can bid
  const canUserBid = () => {
    if (userRole === "bidder") {
      return userTeam ? canTeamAddPlayer(userTeam.id) : false;
    }
    if (userRole === "organizer" && userTeam) {
      return canTeamAddPlayer(userTeam.id);
    }
    return false;
  };

  // Helper function to get descriptive role text
  const getRoleText = () => {
    if (userRole === "organizer" && userTeam) {
      return "Organizer & Captain";
    }
    if (userRole === "organizer") {
      return "Organizer";
    }
    if (userRole === "bidder") {
      return "Team Captain";
    }
    return "Viewer";
  };

  // Calculate recommended bid amounts
  const getRecommendedBids = () => {
    if (!currentParticipant || !userTeam) return [];

    const currentBidAmount =
      currentParticipant.currentBid?.amount ?? currentParticipant.basePrice;
    const increment = currentParticipant.increment;
    const teamPurse = userTeam.purse ?? 0;

    const recommendations = [
      {
        label: `₹${formatIndianNumber(currentBidAmount + increment)}`,
        amount: currentBidAmount + increment,
      },
      {
        label: `₹${formatIndianNumber(currentBidAmount + increment * 2)}`,
        amount: currentBidAmount + increment * 2,
      },
      {
        label: `₹${formatIndianNumber(currentBidAmount + increment * 5)}`,
        amount: currentBidAmount + increment * 5,
      },
    ];

    // Filter out recommendations that exceed available purse
    return recommendations.filter((rec) => rec.amount <= teamPurse);
  };

  // Calculate remaining purse after current bid
  const getRemainingPurse = (bidAmount: number) => {
    if (!userTeam) return 0;

    const teamPurse = userTeam.purse ?? 0;
    const currentTeamCommitted = isCurrentTeamHighestBidder()
      ? (currentParticipant?.currentBid?.amount ?? 0)
      : 0;

    // If it's the same team, we only pay the difference
    if (isCurrentTeamHighestBidder()) {
      return (
        teamPurse -
        currentTeamCommitted -
        (bidAmount - (currentParticipant?.currentBid?.amount ?? 0))
      );
    }

    // If it's a different team, we pay the full bid amount
    return teamPurse - bidAmount;
  };

  // Check if bid amount is valid (within purse limits and meets minimum requirements)
  const isBidAmountValid = (amount: number) => {
    if (!userTeam || !currentParticipant) return false;

    const teamPurse = userTeam.purse ?? 0;
    const currentTeamCommitted = isCurrentTeamHighestBidder()
      ? (currentParticipant.currentBid?.amount ?? 0)
      : 0;

    // Check if amount is within purse limits
    let purseValid = false;
    if (isCurrentTeamHighestBidder()) {
      // If it's the same team, we only pay the difference
      const additionalAmount =
        amount - (currentParticipant.currentBid?.amount ?? 0);
      purseValid = additionalAmount <= teamPurse - currentTeamCommitted;
    } else {
      // If it's a different team, we pay the full bid amount
      purseValid = amount <= teamPurse;
    }

    if (!purseValid) return false;

    // Check if amount meets minimum bid requirements
    const isSameTeam = isCurrentTeamHighestBidder();

    if (isSameTeam) {
      // If it's the same team, they can only increase their bid
      return amount > (currentParticipant.currentBid?.amount ?? 0);
    } else {
      // If it's a different team, they must meet the minimum increment
      const minBid = currentParticipant.currentBid
        ? currentParticipant.currentBid.amount + currentParticipant.increment
        : currentParticipant.basePrice;
      return amount >= minBid;
    }
  };

  // Handle bid submission
  const handleBidSubmit = async (amount: number) => {
    if (!currentParticipant || !userTeam) return;

    // Check if this is the same team trying to outbid themselves
    const isSameTeam = isCurrentTeamHighestBidder();

    if (isSameTeam) {
      // If it's the same team, they can only increase their bid
      if (amount <= (currentParticipant.currentBid?.amount ?? 0)) {
        toast.error("New bid must be higher than your current bid");
        return;
      }
    } else {
      // If it's a different team, they must meet the minimum increment
      const minBid = currentParticipant.currentBid
        ? currentParticipant.currentBid.amount + currentParticipant.increment
        : currentParticipant.basePrice;
      if (amount < minBid) {
        toast.error(
          `Bid must be at least ₹${formatIndianNumber(minBid)} ${currentParticipant.currentBid ? "(current bid + increment)" : "(base price)"}`,
        );
        return;
      }
    }

    // Check purse validation
    if (!isBidAmountValid(amount)) {
      const teamPurse = userTeam.purse ?? 0;
      if (isSameTeam) {
        const additionalAmount =
          amount - (currentParticipant.currentBid?.amount ?? 0);
        toast.error(
          `Bid increase (₹${formatIndianNumber(additionalAmount)}) exceeds your team's available purse (₹${formatIndianNumber(teamPurse - (currentParticipant.currentBid?.amount ?? 0))})`,
        );
      } else {
        toast.error(
          `Bid amount (₹${formatIndianNumber(amount)}) exceeds your team's purse (₹${formatIndianNumber(teamPurse)})`,
        );
      }
      return;
    }

    try {
      await socketService.makeBid(
        currentParticipant.participantId,
        amount,
        userTeam.id,
        userRole,
      );
      setBidAmount(amount + currentParticipant.increment);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to place bid",
      );
    }
  };

  // Handle end bidding (organizer only)
  const handleEndBidding = async () => {
    if (!currentParticipant) return;

    try {
      await socketService.endParticipantBidding(
        currentParticipant.participantId,
        userRole,
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to end bidding",
      );
    }
  };

  // Handle cancel bidding (organizer only)
  const handleCancelBidding = async () => {
    if (!currentParticipant) return;

    try {
      await socketService.cancelParticipantBidding(
        currentParticipant.participantId,
        userRole,
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to cancel bidding",
      );
    }
  };

  // Show loading state while checking auction status
  if (auctionStatus.checking) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center space-y-4 p-6">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-center text-muted-foreground">
              Checking auction status...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show auction not found state
  if (!auctionStatus.exists) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center space-y-4 p-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-red-600">
                Auction Not Found
              </h2>
              <p className="mt-2 text-center text-muted-foreground">
                The auction for this tournament is not currently active.
              </p>
              {userRole === "organizer" && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm text-muted-foreground">
                    As an organizer, you can restart the auction to begin.
                  </p>
                  <Button
                    onClick={handleRestartAuction}
                    disabled={auctionStatus.restarting}
                    className="w-full"
                  >
                    {auctionStatus.restarting ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        Restarting...
                      </>
                    ) : (
                      "Restart Auction"
                    )}
                  </Button>
                </div>
              )}
              {userRole !== "organizer" && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Please contact the tournament organizer to start the auction.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center space-y-4 p-6">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-center text-muted-foreground">
              Connecting to auction room...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentParticipant) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center space-y-4 p-6">
            <h2 className="text-xl font-semibold">Waiting for Auction</h2>
            <p className="text-center text-muted-foreground">
              No participant is currently being auctioned.
              {userRole === "organizer" &&
                " Start bidding on a participant to begin."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto w-full space-y-6 py-6">
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div
            className={`h-3 w-3 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}
          ></div>
          <span className="text-sm text-muted-foreground">
            {isConnected ? "Connected" : "Disconnected"}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Badge
            variant={
              userRole === "organizer"
                ? "default"
                : userRole === "bidder"
                  ? "secondary"
                  : "outline"
            }
          >
            {getRoleText()}
          </Badge>
          {userRole === "organizer" && userTeam && (
            <Badge variant="outline" className="text-xs">
              👑 Captain of {userTeam.name}
            </Badge>
          )}
          {canUserBid() && userTeam && (
            <Badge variant="secondary" className="text-xs">
              💰 Purse: ₹{formatIndianNumber(userTeam.purse ?? 0)}
            </Badge>
          )}
          {userTeam && (
            <Badge variant="outline" className="text-xs">
              👥 Team: {getTeamCurrentPlayers(userTeam.id)}/
              {getTeamMaxParticipants(userTeam.id)} players
            </Badge>
          )}
          {canUserBid() && (
            <Badge variant="secondary" className="text-xs">
              ✅ Can Bid
            </Badge>
          )}
          {userTeam && !canTeamAddPlayer(userTeam.id) && (
            <Badge variant="destructive" className="text-xs">
              ❌ Team Full
            </Badge>
          )}
        </div>
      </div>

      {/* Current Participant Card */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Current Auction</span>
            {userRole === "organizer" && (
              <div className="flex gap-2">
                {currentParticipant.currentBid ? (
                  <Button
                    variant="default"
                    onClick={handleEndBidding}
                    disabled={currentParticipant.isSold}
                  >
                    Sold to {getTeamName(currentParticipant.currentBid.teamId)}
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    onClick={handleEndBidding}
                    disabled={currentParticipant.isSold}
                  >
                    End Bidding
                  </Button>
                )}
                <Button
                  variant="destructive"
                  onClick={handleCancelBidding}
                  disabled={currentParticipant.isSold}
                >
                  Cancel
                </Button>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Participant Info */}
          <div className="flex items-start space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage
                src={currentParticipant.image}
                alt={currentParticipant.name}
              />
              <AvatarFallback>
                {currentParticipant.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <h3 className="text-2xl font-bold">{currentParticipant.name}</h3>
              <p className="text-muted-foreground">
                {currentParticipant.description}
              </p>
              <div className="flex space-x-4">
                <div>
                  <span className="text-sm font-medium">K/D Ratio:</span>
                  <span className="ml-1 text-sm">{currentParticipant.kd}</span>
                </div>
                <div>
                  <span className="text-sm font-medium">Games Played:</span>
                  <span className="ml-1 text-sm">
                    {currentParticipant.gamesPlayed}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bidding Info */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-4">
              <h4 className="font-medium text-muted-foreground">Base Price</h4>
              <p className="text-2xl font-bold">
                ₹{formatIndianNumber(currentParticipant.basePrice)}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <h4 className="font-medium text-muted-foreground">Current Bid</h4>
              <p className="text-2xl font-bold">
                {currentParticipant.currentBid
                  ? `₹${formatIndianNumber(currentParticipant.currentBid.amount)}`
                  : "No bids yet"}
              </p>
              {currentParticipant.currentBid && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    by {getTeamName(currentParticipant.currentBid.teamId)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Remaining purse: ₹
                    {formatIndianNumber(
                      getTeamRemainingPurse(
                        currentParticipant.currentBid.teamId,
                        currentParticipant.currentBid.amount,
                      ),
                    )}
                  </p>
                  {isCurrentTeamHighestBidder() && (
                    <p className="text-xs font-medium text-green-600">
                      🎯 You are the highest bidder
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="rounded-lg border p-4">
              <h4 className="font-medium text-muted-foreground">
                Minimum Increment
              </h4>
              <p className="text-2xl font-bold">
                ₹{formatIndianNumber(currentParticipant.increment)}
              </p>
            </div>
          </div>

          {/* Bidding History */}
          {currentParticipant.biddingLogs.length > 0 && (
            <div>
              <h4 className="mb-2 font-medium">Bidding History</h4>
              <div className="max-h-32 space-y-1 overflow-y-auto">
                {currentParticipant.biddingLogs
                  .slice(-5)
                  .reverse()
                  .map((bid, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <div>
                        <span>{getTeamName(bid.teamId)}</span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          (Remaining: ₹
                          {formatIndianNumber(
                            getTeamRemainingPurse(bid.teamId, bid.amount),
                          )}
                          )
                        </span>
                      </div>
                      <span className="font-medium">
                        ₹ {formatIndianNumber(bid.amount)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bidding Interface (for bidders and organizers with teams) */}
      {canUserBid() && !currentParticipant.isSold && (
        <Card>
          <CardHeader>
            <CardTitle>
              {isCurrentTeamHighestBidder()
                ? "Increase Your Bid"
                : "Place Your Bid"}
            </CardTitle>
            {isCurrentTeamHighestBidder() && (
              <p className="text-sm text-muted-foreground">
                You are currently the highest bidder. You can increase your bid
                to secure this participant.
              </p>
            )}
            {!isCurrentTeamHighestBidder() && currentParticipant && (
              <p className="text-sm text-muted-foreground">
                {currentParticipant.currentBid
                  ? `Current highest bid is ₹${formatIndianNumber(currentParticipant.currentBid.amount)}. You must bid at least ₹${formatIndianNumber(currentParticipant.currentBid.amount + currentParticipant.increment)}.`
                  : `No bids yet. You can start bidding at the base price of ₹${formatIndianNumber(currentParticipant.basePrice)}.`}
              </p>
            )}
            {userRole === "organizer" && userTeam && (
              <p className="text-sm text-blue-600">
                👑 You are bidding as the tournament organizer and captain of{" "}
                {userTeam.name}
              </p>
            )}
            {userTeam && (
              <div className="flex items-center space-x-4 text-sm">
                <span className="text-muted-foreground">
                  Available:{" "}
                  <span className="font-medium text-green-600">
                    ₹
                    {formatIndianNumber(
                      (userTeam.purse ?? 0) -
                        (isCurrentTeamHighestBidder()
                          ? (currentParticipant?.currentBid?.amount ?? 0)
                          : 0),
                    )}
                  </span>
                </span>
                <span className="text-muted-foreground">
                  Team Size:{" "}
                  <span className="font-medium">
                    {getTeamCurrentPlayers(userTeam.id)}/
                    {getTeamMaxParticipants(userTeam.id)}
                  </span>
                </span>
                {isCurrentTeamHighestBidder() &&
                  currentParticipant?.currentBid && (
                    <span className="text-muted-foreground">
                      Committed:{" "}
                      <span className="font-medium text-orange-600">
                        ₹
                        {formatIndianNumber(
                          currentParticipant.currentBid.amount,
                        )}
                      </span>
                    </span>
                  )}
                {!canTeamAddPlayer(userTeam.id) && (
                  <span className="font-medium text-red-600">
                    ❌ Team is full - cannot bid
                  </span>
                )}
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Recommended Bids */}
            <div>
              <h4 className="mb-2 font-medium">
                {isCurrentTeamHighestBidder()
                  ? "Increase Bid Options"
                  : currentParticipant.currentBid
                    ? "Quick Bid Options"
                    : "Quick Bid Options (Starting from Base Price)"}
              </h4>
              <div className="flex flex-wrap gap-2">
                {getRecommendedBids().map((recommendation, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    onClick={() => handleBidSubmit(recommendation.amount)}
                    disabled={
                      isCurrentTeamHighestBidder()
                        ? recommendation.amount <=
                          (currentParticipant.currentBid?.amount ?? 0)
                        : recommendation.amount <
                            (currentParticipant.currentBid
                              ? currentParticipant.currentBid.amount +
                                currentParticipant.increment
                              : currentParticipant.basePrice) ||
                          !canTeamAddPlayer(userTeam?.id)
                    }
                  >
                    {recommendation.label}
                    {userTeam && (
                      <span className="ml-1 text-xs text-muted-foreground">
                        (Remaining: ₹
                        {formatIndianNumber(
                          getRemainingPurse(recommendation.amount),
                        )}
                        )
                      </span>
                    )}
                  </Button>
                ))}
              </div>
              {getRecommendedBids().length === 0 && userTeam && (
                <p className="mt-2 text-sm text-red-600">
                  ❌ No bid options available within your team&apos;s purse
                  limit
                </p>
              )}
            </div>

            {/* Custom Bid */}
            <div className="flex items-center space-x-2">
              <div className="flex-1">
                <label className="text-sm font-medium">
                  {isCurrentTeamHighestBidder()
                    ? "New Bid Amount"
                    : "Custom Amount"}
                </label>
                <AmountInput
                  value={bidAmount}
                  onChange={(value) => setBidAmount(value)}
                  placeholder={
                    isCurrentTeamHighestBidder()
                      ? "Enter new bid amount"
                      : currentParticipant.currentBid
                        ? `Enter bid amount (min: ₹${formatIndianNumber(currentParticipant.currentBid.amount + currentParticipant.increment)})`
                        : `Enter bid amount (min: ₹${formatIndianNumber(currentParticipant.basePrice)})`
                  }
                  disabled={!canTeamAddPlayer(userTeam?.id)}
                  error={!isBidAmountValid(bidAmount)}
                />
                {userTeam && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Remaining purse after this bid: ₹
                    {formatIndianNumber(getRemainingPurse(bidAmount))}
                    {!isBidAmountValid(bidAmount) && (
                      <span className="ml-2 text-red-600">
                        ❌ Invalid Bid Amount
                      </span>
                    )}
                  </p>
                )}
              </div>
              <Button
                onClick={() => handleBidSubmit(bidAmount)}
                className="mt-2"
                disabled={
                  isCurrentTeamHighestBidder()
                    ? bidAmount <= (currentParticipant.currentBid?.amount ?? 0)
                    : bidAmount <
                        (currentParticipant.currentBid
                          ? currentParticipant.currentBid.amount +
                            currentParticipant.increment
                          : currentParticipant.basePrice) ||
                      !isBidAmountValid(bidAmount) ||
                      !canTeamAddPlayer(userTeam?.id)
                }
              >
                {isCurrentTeamHighestBidder() ? "Increase Bid" : "Place Bid"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Message for teams that are full */}
      {userTeam &&
        !canTeamAddPlayer(userTeam.id) &&
        !currentParticipant.isSold && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-red-800">
                  ❌ Team is Full
                </h3>
                <p className="mt-2 text-red-700">
                  Your team has reached the maximum number of players (
                  {getTeamMaxParticipants(userTeam.id)}). You cannot bid on more
                  participants.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

      {/* Message for organizers without teams */}
      {userRole === "organizer" && !userTeam && !currentParticipant.isSold && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-blue-800">
                👑 Tournament Organizer
              </h3>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sold Status */}
      {currentParticipant.isSold && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-xl font-bold text-green-800">Sold!</h3>
              <p className="text-green-700">
                {currentParticipant.name} was sold for ₹
                {formatIndianNumber(currentParticipant.sellingBid?.amount ?? 0)}{" "}
                to {getTeamName(currentParticipant.sellingBid?.teamId)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
