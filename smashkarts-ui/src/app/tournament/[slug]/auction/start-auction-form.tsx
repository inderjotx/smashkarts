"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { startAuctionAction } from "./action";

export const StartAuctionForm = ({
  tournamentId,
}: {
  tournamentId: string;
}) => {
  const router = useRouter();
  const startAuctionMutation = useMutation({
    mutationFn: async () => {
      return startAuctionAction(tournamentId);
    },
    onSuccess: () => {
      router.refresh();
    },
  });

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <h1 className="mb-4 text-3xl font-bold">Start Auction</h1>
      <Button
        onClick={() => startAuctionMutation.mutate()}
        disabled={startAuctionMutation.isPending}
      >
        {startAuctionMutation.isPending ? "Starting..." : "Start Auction"}
      </Button>
    </div>
  );
};
