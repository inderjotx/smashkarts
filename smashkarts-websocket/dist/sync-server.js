export class SyncServer {
    serverUrl;
    socketIdToUserRoleInfo = new Map();
    constructor(serverUrl) {
        this.serverUrl = serverUrl;
    }
    async getUserRoleInfo(cookies, socketId, auctionId) {
        // Check if we already have the role info for this socket
        if (this.socketIdToUserRoleInfo.has(socketId)) {
            return this.socketIdToUserRoleInfo.get(socketId);
        }
        // Default role info for unauthenticated users
        const defaultRoleInfo = {
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
            const userRoleInfo = {
                tournamentRoles: data.roles || [],
                teamRole: data.teamRole || null,
                canBid: data.canBid || false,
                canManageAuction: data.roles?.includes("organizer") || data.roles?.includes("admin") || data.roles?.includes("auctioneer") || false,
                canManageTournament: data.roles?.includes("organizer") || data.roles?.includes("admin") || data.roles?.includes("maintainer") || false
            };
            this.socketIdToUserRoleInfo.set(socketId, userRoleInfo);
            return userRoleInfo;
        }
        catch (error) {
            console.error("Error fetching user role info:", error);
            this.socketIdToUserRoleInfo.set(socketId, defaultRoleInfo);
            return defaultRoleInfo;
        }
    }
    // Helper function to check if user has specific tournament role
    hasTournamentRole(userRoleInfo, role) {
        return userRoleInfo.tournamentRoles.includes(role);
    }
    // Helper function to check if user can perform auction management actions
    canManageAuction(userRoleInfo) {
        return userRoleInfo.canManageAuction;
    }
    // Helper function to check if user can bid
    canBid(userRoleInfo) {
        return userRoleInfo.canBid;
    }
    // Helper function to check if user can manage tournament
    canManageTournament(userRoleInfo) {
        return userRoleInfo.canManageTournament;
    }
    async markParticipantSold(participant) {
        const response = await fetch(`${this.serverUrl}/api/tournament/${participant.auctionSlug}/mark-sold`, {
            method: "POST",
            body: JSON.stringify(participant)
        });
        const data = await response.json();
        console.log("data from sync server", data);
    }
    async markParticipantUnsold(participant) {
        const response = await fetch(`${this.serverUrl}/api/tournament/${participant.auctionSlug}/mark-unsold`, {
            method: "POST",
            body: JSON.stringify(participant)
        });
        const data = await response.json();
        console.log("data from sync server", data);
    }
    async getTeamPurse(teamId, auctionSlug) {
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
        }
        catch (error) {
            console.error("Error fetching team purse:", error);
            return null;
        }
    }
}
//# sourceMappingURL=sync-server.js.map