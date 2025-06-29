import type { UserRoleInfo } from "./socket-io.d.ts";
import type { Participant } from "./auction.ts";

export class SyncServer {

    private serverUrl: string
    private socketIdToUserRoleInfo: Map<string, UserRoleInfo> = new Map();

    constructor(serverUrl: string) {
        this.serverUrl = serverUrl;
    }

    async getUserRoleInfo(cookies: string | undefined, socketId: string, auctionId: string): Promise<UserRoleInfo> {
        // Check if we already have the role info for this socket
        if (this.socketIdToUserRoleInfo.has(socketId)) {
            return this.socketIdToUserRoleInfo.get(socketId) as UserRoleInfo;
        }

        // Default role info for unauthenticated users
        const defaultRoleInfo: UserRoleInfo = {
            tournamentRoles: [],
            teamRole: null,
            canBid: false,
            canManageAuction: false,
            canManageTournament: false
        };

        if (!cookies) {
            this.socketIdToUserRoleInfo.set(socketId, defaultRoleInfo);
            return defaultRoleInfo;
        }

        try {
            const response = await fetch(`${this.serverUrl}/api/tournament/${auctionId}/user-role`, {
                headers: {
                    Cookie: cookies
                }
            });

            if (!response.ok) {
                console.log("Failed to get user role info:", response.status);
                this.socketIdToUserRoleInfo.set(socketId, defaultRoleInfo);
                return defaultRoleInfo;
            }

            const data = await response.json();
            console.log("User role data from sync server:", data);

            // Parse the role data from the API response
            const userRoleInfo: UserRoleInfo = {
                tournamentRoles: data.roles || [],
                teamRole: data.teamRole || null,
                canBid: data.canBid || false,
                canManageAuction: data.roles?.includes("organizer") || data.roles?.includes("admin") || data.roles?.includes("auctioneer") || false,
                canManageTournament: data.roles?.includes("organizer") || data.roles?.includes("admin") || data.roles?.includes("maintainer") || false
            };

            this.socketIdToUserRoleInfo.set(socketId, userRoleInfo);
            return userRoleInfo;

        } catch (error) {
            console.error("Error fetching user role info:", error);
            this.socketIdToUserRoleInfo.set(socketId, defaultRoleInfo);
            return defaultRoleInfo;
        }
    }

    // Helper function to check if user has specific tournament role
    hasTournamentRole(userRoleInfo: UserRoleInfo, role: string): boolean {
        return userRoleInfo.tournamentRoles.includes(role as any);
    }

    // Helper function to check if user can perform auction management actions
    canManageAuction(userRoleInfo: UserRoleInfo): boolean {
        return userRoleInfo.canManageAuction;
    }

    // Helper function to check if user can bid
    canBid(userRoleInfo: UserRoleInfo): boolean {
        return userRoleInfo.canBid;
    }

    // Helper function to check if user can manage tournament
    canManageTournament(userRoleInfo: UserRoleInfo): boolean {
        return userRoleInfo.canManageTournament;
    }

    async markParticipantSold(participant: Participant) {
        const response = await fetch(`${this.serverUrl}/api/tournament/${participant.auctionSlug}/mark-sold`, {
            method: "POST",
            body: JSON.stringify(participant)
        });

        const data = await response.json();
        console.log("data from sync server", data);
    }

    async markParticipantUnsold(participant: Participant) {
        const response = await fetch(`${this.serverUrl}/api/tournament/${participant.auctionSlug}/mark-unsold`, {
            method: "POST",
            body: JSON.stringify(participant)
        });

        const data = await response.json();
        console.log("data from sync server", data);
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
