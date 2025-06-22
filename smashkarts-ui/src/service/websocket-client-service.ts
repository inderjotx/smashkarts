import { env } from "@/env";

const WEBSOCKET_SERVER_URL = env.NEXT_PUBLIC_SOCKET_URL;

type AuctionState = {
    isActive: boolean;
    currentParticipantId: string | null;
    auctionStartTime: Date | null;
    soldParticipants: number;
}

type ActiveAuction = {
    auctionSlug: string;
    state: AuctionState;
}

export class WebSocketClientService {
    private baseUrl: string;

    constructor(baseUrl: string = WEBSOCKET_SERVER_URL) {
        this.baseUrl = baseUrl;
    }

    // Check if auction exists in WebSocket server
    async checkAuctionExists(auctionSlug: string): Promise<{
        exists: boolean;
        auctionState: AuctionState | null;
        message: string;
    }> {
        try {
            const response = await fetch(`${this.baseUrl}/check-auction/${auctionSlug}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data as {
                exists: boolean;
                auctionState: AuctionState | null;
                message: string;
            };
        } catch (error) {
            console.error('Error checking auction existence:', error);
            throw error;
        }
    }

    // Restart auction if it doesn't exist
    async restartAuction(auctionSlug: string): Promise<{
        success: boolean;
        auctionSlug: string;
        message: string;
    }> {
        try {
            const response = await fetch(`${this.baseUrl}/restart-auction/${auctionSlug}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data as {
                success: boolean;
                auctionSlug: string;
                message: string;
            };
        } catch (error) {
            console.error('Error restarting auction:', error);
            throw error;
        }
    }

    // Create new auction
    async createAuction(auctionSlug: string): Promise<{
        auctionSlug: string;
    }> {
        try {
            const response = await fetch(`${this.baseUrl}/create-auction/${auctionSlug}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data as {
                auctionSlug: string;
            };
        } catch (error) {
            console.error('Error creating auction:', error);
            throw error;
        }
    }

    // Get all active auctions
    async getActiveAuctions(): Promise<{
        activeAuctions: ActiveAuction[];
        count: number;
    }> {
        try {
            const response = await fetch(`${this.baseUrl}/active-auctions`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data as {
                activeAuctions: ActiveAuction[];
                count: number;
            };
        } catch (error) {
            console.error('Error getting active auctions:', error);
            throw error;
        }
    }

    // Utility method to ensure auction exists (check and restart if needed)
    async ensureAuctionExists(auctionSlug: string): Promise<{
        existed: boolean;
        restarted: boolean;
        auctionSlug: string;
    }> {
        try {
            // First check if auction exists
            const checkResult = await this.checkAuctionExists(auctionSlug);

            if (checkResult.exists) {
                return {
                    existed: true,
                    restarted: false,
                    auctionSlug
                };
            }

            // If it doesn't exist, restart it
            const restartResult = await this.restartAuction(auctionSlug);

            return {
                existed: false,
                restarted: restartResult.success,
                auctionSlug
            };
        } catch (error) {
            console.error('Error ensuring auction exists:', error);
            throw error;
        }
    }
}

// Export singleton instance
export const webSocketClientService = new WebSocketClientService(); 