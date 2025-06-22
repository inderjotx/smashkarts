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
  }[];
}

export function AuctionRoom({
  tournamentSlug,
  userRole,
  isOrganizer,
  userTeam,
  auctionUrl,
  teams,
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
        setBidAmount(
          state.currentParticipant.currentBid
            ? state.currentParticipant.currentBid.amount +
                state.currentParticipant.increment
            : state.currentParticipant.basePrice,
        );
      } else {
        setCurrentParticipant(null);
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
          `New bid: ₹${data.participant.currentBid.amount} by ${getTeamName(data.participant.currentBid.teamId)}`,
        );
      }
    });

    socket.on(
      "server:participantSold",
      (data: { participant: Participant }) => {
        toast.success(
          `${data.participant.name} sold for ₹${data.participant.sellingBid?.amount} to ${getTeamName(data.participant.sellingBid?.teamId)}`,
        );

        // Clear current participant after a delay
        setTimeout(() => {
          setCurrentParticipant(null);
        }, 3000);
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
      socket.off("server:error");
      socketService.disconnect();
    };
  }, [auctionUrl, userRole, auctionStatus.exists]);

  // Helper function to get team name
  const getTeamName = (teamId?: string) => {
    if (!teamId || !teams.length) return "Unknown Team";
    const team = teams.find((t) => t.id === teamId);
    return team?.name ?? "Unknown Team";
  };

  // Helper function to check if current user's team is the highest bidder
  const isCurrentTeamHighestBidder = () => {
    if (!currentParticipant?.currentBid || !userTeam) return false;
    return currentParticipant.currentBid.teamId === userTeam.id;
  };

  // Helper function to check if user can bid
  const canUserBid = () => {
    if (userRole === "bidder") return true;
    if (userRole === "organizer" && userTeam) return true;
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
    if (!currentParticipant) return [];

    const currentBidAmount =
      currentParticipant.currentBid?.amount ?? currentParticipant.basePrice;
    const increment = currentParticipant.increment;

    return [
      {
        label: `₹${currentBidAmount + increment}`,
        amount: currentBidAmount + increment,
      },
      {
        label: `₹${currentBidAmount + increment * 2}`,
        amount: currentBidAmount + increment * 2,
      },
      {
        label: `₹${currentBidAmount + increment * 5}`,
        amount: currentBidAmount + increment * 5,
      },
    ];
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
      const minBid =
        (currentParticipant.currentBid?.amount ??
          currentParticipant.basePrice) + currentParticipant.increment;
      if (amount < minBid) {
        toast.error(
          `Bid must be at least ₹${minBid} (current bid + increment)`,
        );
        return;
      }
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
    <div className="container mx-auto max-w-4xl space-y-6 py-6">
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
          {canUserBid() && (
            <Badge variant="secondary" className="text-xs">
              ✅ Can Bid
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
              <Button
                variant="destructive"
                onClick={handleEndBidding}
                disabled={currentParticipant.isSold}
              >
                End Bidding
              </Button>
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
                ₹{currentParticipant.basePrice}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <h4 className="font-medium text-muted-foreground">Current Bid</h4>
              <p className="text-2xl font-bold">
                {currentParticipant.currentBid
                  ? `₹${currentParticipant.currentBid.amount}`
                  : "No bids yet"}
              </p>
              {currentParticipant.currentBid && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    by {getTeamName(currentParticipant.currentBid.teamId)}
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
                ₹{currentParticipant.increment}
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
                      <span>{getTeamName(bid.teamId)}</span>
                      <span className="font-medium">₹{bid.amount}</span>
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
            {userRole === "organizer" && userTeam && (
              <p className="text-sm text-blue-600">
                👑 You are bidding as the tournament organizer and captain of{" "}
                {userTeam.name}
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Recommended Bids */}
            <div>
              <h4 className="mb-2 font-medium">
                {isCurrentTeamHighestBidder()
                  ? "Increase Bid Options"
                  : "Quick Bid Options"}
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
                        : recommendation.amount <=
                          (currentParticipant.currentBid?.amount ??
                            currentParticipant.basePrice)
                    }
                  >
                    {recommendation.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom Bid */}
            <div className="flex items-end space-x-2">
              <div className="flex-1">
                <label className="text-sm font-medium">
                  {isCurrentTeamHighestBidder()
                    ? "New Bid Amount"
                    : "Custom Amount"}
                </label>
                <input
                  type="number"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(Number(e.target.value))}
                  min={
                    isCurrentTeamHighestBidder()
                      ? (currentParticipant.currentBid?.amount ?? 0) + 1
                      : currentParticipant.currentBid
                        ? currentParticipant.currentBid.amount +
                          currentParticipant.increment
                        : currentParticipant.basePrice
                  }
                  className="mt-1 w-full rounded-md border px-3 py-2"
                  placeholder={
                    isCurrentTeamHighestBidder()
                      ? "Enter new bid amount"
                      : "Enter bid amount"
                  }
                />
              </div>
              <Button
                onClick={() => handleBidSubmit(bidAmount)}
                disabled={
                  isCurrentTeamHighestBidder()
                    ? bidAmount <= (currentParticipant.currentBid?.amount ?? 0)
                    : bidAmount <=
                      (currentParticipant.currentBid?.amount ??
                        currentParticipant.basePrice)
                }
              >
                {isCurrentTeamHighestBidder() ? "Increase Bid" : "Place Bid"}
              </Button>
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
              <p className="text-blue-700">
                You are the tournament organizer. To participate in bidding, you
                need to be a captain of a team.
              </p>
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
                {currentParticipant.sellingBid?.amount} to{" "}
                {getTeamName(currentParticipant.sellingBid?.teamId)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
