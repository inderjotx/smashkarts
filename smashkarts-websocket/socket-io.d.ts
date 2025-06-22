
import "socket.io"
type UserRole = "organizer" | "bidder" | "viewer"

declare module "socket.io" {
    interface Socket {
        userRole: UserRole;
    }
}