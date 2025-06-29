import { io, type Socket } from 'socket.io-client';
import { category, participant } from '@/server/db/schema';
import { participantDataAuction } from '@/actions/tournament';
import { type TournamentRole } from '@/lib/utils';

type UserRole = "organizer" | "bidder" | "viewer";

type Participant = {
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

type AuctionState = {
    isActive: boolean;
    currentParticipant: Participant | null;
    auctionStartTime: Date | null;
    soldParticipants: number;
    allParticipants: Participant[];
    currentBiddingLogs: Array<{
        teamId: string;
        amount: number;
        participantId: string;
    }>;
    currentHighestBid: {
        teamId: string;
        amount: number;
        participantId: string;
    } | null;
}

class SocketService {
    private socket: Socket | null = null;
    private isInitialized = false;
    private currentAuctionState: AuctionState | null = null;
    private onAuctionStateUpdate: ((state: AuctionState) => void) | null = null;

    initialize(url: string) {
        if (this.isInitialized) {
            console.log('Socket service already initialized');
            return;
        }

        console.log('Initializing socket with URL:', url);

        // Connect to the specific auction namespace
        this.socket = io(url, {
            withCredentials: true,
        });

        this.setupEventListeners();

        console.log("socket initialized");
        this.isInitialized = true;
    }

    private setupEventListeners() {
        if (!this.socket) return;

        console.log('Setting up event listeners');

        // Listen for current auction state when joining
        this.socket.on("server:currentAuctionState", (state: AuctionState) => {
            console.log("Received current auction state:", state);
            this.currentAuctionState = state;
            this.onAuctionStateUpdate?.(state);
        });

        // Listen for participant bidding started
        this.socket.on("server:participantBiddingStarted", (data: { participant: Participant }) => {
            console.log("Participant bidding started:", data.participant);
            // Update current auction state
            if (this.currentAuctionState) {
                this.currentAuctionState.isActive = true;
                this.currentAuctionState.currentParticipant = data.participant;
                this.currentAuctionState.auctionStartTime = new Date();
                // Trigger callback with updated state
                this.onAuctionStateUpdate?.(this.currentAuctionState);
            }
        });

        // Listen for new bids
        this.socket.on("server:bid", (data: { participant: Participant }) => {
            console.log("New bid received:", data.participant);
            // Update current auction state with new bid
            if (this.currentAuctionState?.currentParticipant) {
                this.currentAuctionState.currentParticipant = data.participant;
                // Trigger callback with updated state
                this.onAuctionStateUpdate?.(this.currentAuctionState);
            }
        });

        // Listen for participant sold
        this.socket.on("server:participantSold", (data: { participant: Participant }) => {
            console.log("Participant sold:", data.participant);
            // Update current auction state
            if (this.currentAuctionState) {
                this.currentAuctionState.isActive = false;
                this.currentAuctionState.currentParticipant = data.participant;
                this.currentAuctionState.soldParticipants++;
                // Trigger callback with updated state
                this.onAuctionStateUpdate?.(this.currentAuctionState);
            }
        });

        // Listen for participant bidding canceled
        this.socket.on("server:participantBiddingCanceled", (data: { participant: Participant }) => {
            console.log("Participant bidding canceled:", data.participant);
            // Update current auction state
            if (this.currentAuctionState) {
                this.currentAuctionState.isActive = false;
                this.currentAuctionState.currentParticipant = null;
                // Trigger callback with updated state
                this.onAuctionStateUpdate?.(this.currentAuctionState);
            }
        });

        // Listen for errors
        this.socket.on("server:error", (data: { error: string }) => {
            console.error("Server error:", data.error);
        });

        // Listen for connection events
        this.socket.on("connect", () => {
            console.log("Socket connected to namespace:", this.socket?.id);
        });

        this.socket.on("disconnect", () => {
            console.log("Socket disconnected");
        });

        this.socket.on("connect_error", (error) => {
            console.error("Socket connection error:", error);
        });
    }

    getSocket(): Socket | null {
        return this.socket;
    }

    isConnected(): boolean {
        return this.socket?.connected ?? false;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isInitialized = false;
            this.currentAuctionState = null;
        }
    }

    // Get current auction state
    getCurrentAuctionState(): AuctionState | null {
        return this.currentAuctionState;
    }

    // Set callback for auction state updates
    onAuctionStateChange(callback: (state: AuctionState) => void) {
        this.onAuctionStateUpdate = callback;
    }

    // Check if auction is currently active
    isAuctionActive(): boolean {
        return this.currentAuctionState?.isActive ?? false;
    }

    // Get currently active participant
    getCurrentActiveParticipant(): Participant | null {
        return this.currentAuctionState?.currentParticipant ?? null;
    }

    // Get current bidding logs for the active participant
    getCurrentBiddingLogs(): Array<{ teamId: string; amount: number; participantId: string }> {
        return this.currentAuctionState?.currentBiddingLogs ?? [];
    }

    // Get current highest bid for the active participant
    getCurrentHighestBid(): { teamId: string; amount: number; participantId: string } | null {
        return this.currentAuctionState?.currentHighestBid ?? null;
    }

    // Get the minimum next bid amount required
    getMinimumNextBid(): number {
        const currentParticipant = this.getCurrentActiveParticipant();
        if (!currentParticipant) return 0;

        if (!currentParticipant.currentBid) {
            return currentParticipant.basePrice;
        }

        return currentParticipant.currentBid.amount + currentParticipant.increment;
    }

    // Get number of sold participants
    getSoldParticipantsCount(): number {
        return this.currentAuctionState?.soldParticipants ?? 0;
    }

    // Get all participants
    getAllParticipants(): Participant[] {
        return this.currentAuctionState?.allParticipants ?? [];
    }

    async startParticipantBidding(participantId: string, userRole: UserRole) {
        console.log("starting bidding", participantId);
        console.log("user role", userRole);
        console.log("socket connected:", this.socket?.connected);
        console.log("socket id:", this.socket?.id);

        // Check if user has organizer role (which includes auction permissions)
        if (userRole !== "organizer") {
            throw new Error("User does not have permission to start bidding");
        }

        if (!this.socket?.connected) {
            throw new Error("Socket is not connected");
        }

        const participantData = await this.getParticipantData(participantId);
        console.log("participant data", participantData);

        const eventData = {
            auctionSlug: participantData?.tournament?.slug,
            participantId: participantData?.participant?.id,
            basePrice: participantData?.category?.basePrice,
            increment: participantData?.category?.increment,
            name: participantData?.user?.name,
            image: participantData?.user?.image,
            kd: participantData?.user?.kd,
            gamesPlayed: participantData?.user?.gamesPlayed,
        };

        console.log("Emitting client:startParticipantBidding with data:", eventData);
        this.socket.emit("client:startParticipantBidding", eventData);
        console.log("Event emitted successfully");
    }

    async makeBid(participantId: string, amount: number, teamId: string, userRole: UserRole) {
        console.log("userRole", userRole);

        // Allow bidding for both bidders and organizers (organizers can bid if they have a team)
        if (userRole !== "bidder" && userRole !== "organizer") {
            throw new Error("User does not have permission to bid");
        }

        this.socket?.emit("client:bid", { participantId, amount, teamId });
    }

    async endParticipantBidding(participantId: string, userRole: UserRole) {
        // Only organizers (users with auction permissions) can end bidding
        if (userRole !== "organizer") {
            throw new Error("User does not have permission to end bidding");
        }
        this.socket?.emit("client:endParticipantBidding", { participantId });
    }

    async cancelParticipantBidding(participantId: string, userRole: UserRole) {
        // Only organizers (users with auction permissions) can cancel bidding
        if (userRole !== "organizer") {
            throw new Error("User does not have permission to cancel bidding");
        }
        this.socket?.emit("client:cancelParticipantBidding", { participantId });
    }

    async getParticipantData(participantId: string) {
        const participantData = await participantDataAuction(participantId);
        return participantData;
    }
}

// Export a singleton instance
export const socketService = new SocketService();