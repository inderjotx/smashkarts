import { db } from "@/server/db";
import { participant, team, tournament } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

type Bid = {
    teamId: string,
    amount: number,
    participantId: string
}



type SocketParticipant = {
    auctionSlug: string;
    participantId: string;
    currentBid: Bid | null
    isSold: boolean
    biddingLogs: Bid[]
    basePrice: number
    increment: number
    sellingBid: Bid | null
    name: string
    image: string
    kd: number
    gamesPlayed: number
    description: string
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {

    const { slug } = await params;
    const data = await request.json() as SocketParticipant;
    console.log("Data", data);

    const auctionData = await db.query.tournament.findFirst({
        where: eq(tournament.slug, slug),
    })

    if (!auctionData) {
        console.log("Tournament not found", auctionData);
        return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    if (!data.sellingBid) {
        console.log("No selling bid", data);
        return NextResponse.json({ error: "No selling bid" }, { status: 400 });
    }


    const teamData = await db.query.team.findFirst({
        where: eq(team.id, data.sellingBid?.teamId),
    })


    if (!teamData) {
        console.log("Team not found", data.sellingBid?.teamId);
        return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const hasEnoughtBalance = teamData?.purse && teamData?.purse >= data.sellingBid?.amount;

    if (!hasEnoughtBalance) {
        return NextResponse.json({ error: "Team does not have enough balance" }, { status: 400 });
    }

    await db.transaction(async (tx) => {

        await tx.update(team).set({
            purse: (teamData?.purse ?? 0) - (data.sellingBid?.amount ?? 0),
        }).where(eq(team.id, teamData.id))

        await tx.update(participant).set({
            sellingPrice: data.sellingBid?.amount,
            teamId: data?.sellingBid?.teamId,
            teamRole: "member",
        }).where(and(eq(participant.id, data.participantId), eq(participant.tournamentId, auctionData.id)))

    })

    revalidatePath(`/tournament/${slug}/auction`);
    return NextResponse.json({ message: "Participant sold" }, { status: 200 });

}