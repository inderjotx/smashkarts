import "socket.io"

// Tournament roles (for action permissions)
type TournamentRole = "organizer" | "admin" | "maintainer" | "auctioneer"

// Team roles (for bidding permissions)
type TeamRole = "captain" | "member" | null

// Combined user role info
type UserRoleInfo = {
    tournamentRoles: TournamentRole[]
    teamRole: TeamRole
    canBid: boolean
    canManageAuction: boolean
    canManageTournament: boolean
}

declare module "socket.io" {
    interface Socket {
        userRoleInfo: UserRoleInfo;
    }
}