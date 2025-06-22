import { db } from "@/server/db";
import { env } from "@/env";
import { eq } from "drizzle-orm";
import { participant, tournament } from "@/server/db/schema";

// todo  add authorization check

export async function getParticipantRole(playerId: string) {
    const player = await db.query.participant.findFirst({
        where: eq(participant.id, playerId),
    });

    return player?.role;
}

export async function markParticipantSold(participantId: string, teamId: string, sellingPrice: number) {
    await db.transaction(async (tx) => {
        await tx.update(participant).set({
            sellingPrice,
        }).where(eq(participant.id, participantId));
    });
}

export async function startAuction(tournamentSlug: string) {
    console.log("socket url", env.NEXT_PUBLIC_SOCKET_URL);
    const res = await fetch(`${env.NEXT_PUBLIC_SOCKET_URL}/create-auction/${tournamentSlug}`, {
        method: 'POST',
    });

    const data = await res.json() as { auctionSlug: string };

    if (!res.ok) {
        throw new Error('Failed to start auction');
    }

    if (!('auctionSlug' in data)) {
        throw new Error('Failed to start auction');
    }

    const url = `${env.NEXT_PUBLIC_SOCKET_URL}/auction-${data?.auctionSlug}`;

    await db.update(tournament).set({
        auctionUrl: url,
    }).where(eq(tournament.slug, tournamentSlug));

    return url;
}

