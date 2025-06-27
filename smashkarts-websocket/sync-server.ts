import type { UserRole } from "./socket-io.d.ts";
import type { Participant } from "./auction.ts";



export class SyncServer {

    private serverUrl: string
    private socketIdToUserId: Map<string, UserRole> = new Map();


    constructor(serverUrl: string) {
        this.serverUrl = serverUrl;
    }


    async getUserRole(cookies: string | undefined, socketId: string, auctionId: string): Promise<UserRole> {


        if (this.socketIdToUserId.has(socketId)) {
            return this.socketIdToUserId.get(socketId) as UserRole;
        }

        if (!cookies) {
            this.socketIdToUserId.set(socketId, "viewer");
            return "viewer";
        }


        const response = await fetch(`${this.serverUrl}/api/tournament/${auctionId}/user-role`, {
            headers: {
                Cookie: cookies
            }
        })

        const data = await response.json()
        console.log("data from sync server", data)
        let userRole: UserRole;

        // Determine the primary role for socket operations
        if (data.role === "organizer") {
            userRole = "organizer";
        } else if (data.role === "bidder") {
            userRole = "bidder";
        } else {
            userRole = "viewer";
        }

        this.socketIdToUserId.set(socketId, userRole);

        return userRole;
    }

    async markParticipantSold(participantId: string, participant: Participant) {





    }

    async markParticipantUnsold(participantId: string, participant: Participant) {

    }
}
