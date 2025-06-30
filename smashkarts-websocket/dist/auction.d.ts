import { type DefaultEventsMap, type Namespace, type Server } from "socket.io";
import { SyncServer } from "./sync-server.js";
type AuctionNamespace = Namespace<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>;
export type Bid = {
    teamId: string;
    amount: number;
    participantId: string;
};
export type Participant = {
    auctionSlug: string;
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
};
type AuctionState = {
    isActive: boolean;
    currentParticipantId: string | null;
    auctionStartTime: Date | null;
    soldParticipants: number;
};
export declare class AuctionManager {
    private activeAuctions;
    private auctionStates;
    private io;
    private participantManager;
    private syncServer;
    constructor(io: Server, syncServer: SyncServer);
    createAuction(auctionSlug: string): string;
    setMiddleware(nspace: AuctionNamespace, auctionSlug: string): void;
    setEventHandlers(nspace: AuctionNamespace): void;
    private sendCurrentAuctionState;
    private getAuctionSlugFromNamespace;
    getAuctionState(auctionSlug: string): AuctionState | undefined;
    getCurrentActiveParticipant(auctionSlug: string): Participant | null;
    doesAuctionExist(auctionSlug: string): boolean;
    getAllActiveAuctions(): Array<{
        auctionSlug: string;
        state: AuctionState;
    }>;
    deleteAuction(auctionSlug: string): boolean;
}
export {};
//# sourceMappingURL=auction.d.ts.map