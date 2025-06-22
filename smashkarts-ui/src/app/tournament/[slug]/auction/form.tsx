"use client";

import { Button } from "@/components/ui/button";
import { startAuctionAction } from "./action";

export default function AuctionForm({
  tournamentId,
}: {
  tournamentId: string;
}) {
  const handleStartAuction = async () => {
    const auctionUrl = await startAuctionAction(tournamentId);
    console.log(auctionUrl);
  };

  return (
    <div>
      Start Auction
      <Button onClick={handleStartAuction}>Start Auction</Button>
    </div>
  );
}
