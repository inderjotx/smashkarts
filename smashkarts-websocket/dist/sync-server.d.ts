import type { UserRoleInfo } from "./socket-io.d.ts";
import type { Participant } from "./auction.ts";
export declare class SyncServer {
    private serverUrl;
    private socketIdToUserRoleInfo;
    constructor(serverUrl: string);
    getUserRoleInfo(cookies: string | undefined, socketId: string, auctionId: string): Promise<UserRoleInfo>;
    hasTournamentRole(userRoleInfo: UserRoleInfo, role: string): boolean;
    canManageAuction(userRoleInfo: UserRoleInfo): boolean;
    canBid(userRoleInfo: UserRoleInfo): boolean;
    canManageTournament(userRoleInfo: UserRoleInfo): boolean;
    markParticipantSold(participant: Participant): Promise<void>;
    markParticipantUnsold(participant: Participant): Promise<void>;
    getTeamPurse(teamId: string, auctionSlug: string): Promise<{
        purse: number;
        currentTeamPlayers: number;
        maxTeamParticipants: number;
    } | null>;
}
//# sourceMappingURL=sync-server.d.ts.map