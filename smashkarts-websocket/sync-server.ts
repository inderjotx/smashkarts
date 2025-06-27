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

    async markParticipantSold(participant: Participant) {

        const response = await fetch(`${this.serverUrl}/api/tournament/${participant.auctionSlug}/mark-sold`, {
            method: "POST",
            body: JSON.stringify(participant)
        })

        const data = await response.json()
        console.log("data from sync server", data)
    }

    async markParticipantUnsold(participant: Participant) {

        const response = await fetch(`${this.serverUrl}/api/tournament/${participant.auctionSlug}/mark-unsold`, {
            method: "POST",
            body: JSON.stringify(participant)
        })

        const data = await response.json()
        console.log("data from sync server", data)
    }

    async getTeamPurse(teamId: string, auctionSlug: string): Promise<{ purse: number; currentTeamPlayers: number; maxTeamParticipants: number } | null> {
        try {
            const response = await fetch(`${this.serverUrl}/api/tournament/${auctionSlug}/team-purse/${teamId}`, {
                method: "GET"
            });

            if (!response.ok) {
                console.log("Failed to get team purse:", response.status);
                return null;
            }

            const data = await response.json();
            console.log("Team purse data:", data);
            return {
                purse: data.purse,
                currentTeamPlayers: data.currentTeamPlayers,
                maxTeamParticipants: data.maxTeamParticipants,
            };
        } catch (error) {
            console.error("Error fetching team purse:", error);
            return null;
        }
    }
}
