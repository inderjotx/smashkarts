# Role System Synchronization

## Overview

This document explains how the role system is synchronized between the Next.js backend and the WebSocket server, ensuring consistent permissions across both systems.

## Role Types

### 1. Tournament Roles (Action Permissions)

These roles determine what actions a user can perform in the tournament:

- **organizer**: Full access to everything
- **admin**: Dashboard + auction + tournament management
- **maintainer**: Dashboard + tournament management only
- **auctioneer**: Auction management only

### 2. Team Roles (Bidding Permissions)

These roles determine if a user can bid in auctions:

- **captain**: Can bid for their team
- **member**: Cannot bid (viewer only)
- **null**: No team role assigned

## Data Flow

### 1. User Connects to WebSocket

```
User connects → WebSocket middleware → Fetch role info from Next.js API → Store in socket
```

### 2. Role Information Structure

```typescript
type UserRoleInfo = {
  tournamentRoles: TournamentRole[]; // ["organizer", "admin"]
  teamRole: TeamRole; // "captain" | "member" | null
  canBid: boolean; // true/false
  canManageAuction: boolean; // true/false
  canManageTournament: boolean; // true/false
};
```

### 3. API Response Format

The Next.js API (`/api/tournament/[slug]/user-role`) returns:

```json
{
  "role": "organizer", // Primary role for backward compatibility
  "roles": ["organizer"], // All tournament roles
  "teamRole": "captain", // Team role
  "canBid": true, // Can user bid?
  "isOrganizer": true // Is user organizer?
}
```

## Permission Checks

### Auction Management Actions

Actions that require auction management permissions:

- `startParticipantBidding`
- `endParticipantBidding`
- `cancelParticipantBidding`

**Required**: `canManageAuction` = true

- organizer, admin, or auctioneer roles

### Bidding Actions

Actions that require bidding permissions:

- `bid`

**Required**: `canBid` = true

- team captain OR organizer/admin/auctioneer roles

## Implementation Details

### WebSocket Server Changes

#### 1. Type Definitions (`socket-io.d.ts`)

```typescript
type TournamentRole = "organizer" | "admin" | "maintainer" | "auctioneer";
type TeamRole = "captain" | "member" | null;

type UserRoleInfo = {
  tournamentRoles: TournamentRole[];
  teamRole: TeamRole;
  canBid: boolean;
  canManageAuction: boolean;
  canManageTournament: boolean;
};
```

#### 2. Sync Server (`sync-server.ts`)

- `getUserRoleInfo()`: Fetches role info from Next.js API
- `canManageAuction()`: Checks auction management permissions
- `canBid()`: Checks bidding permissions
- `hasTournamentRole()`: Checks specific tournament role

#### 3. Auction Manager (`auction.ts`)

- Updated all permission checks to use new role system
- Replaced `socket.userRole` with `socket.userRoleInfo`
- Uses helper functions from SyncServer for permission checks

### Next.js Backend Changes

#### 1. API Response (`/api/tournament/[slug]/user-role`)

- Returns structured role information
- Includes both tournament roles and team roles
- Provides computed permission flags

#### 2. Role System (`actions/tournament.ts`)

- `getParticipantTournamentRoles()`: Get participant's tournament roles
- `hasTournamentPermission()`: Check specific permissions
- `assertTournamentPermission()`: Assert permissions for server actions

## Permission Matrix

| Action         | Organizer | Admin | Maintainer | Auctioneer | Team Captain |
| -------------- | --------- | ----- | ---------- | ---------- | ------------ |
| Start Bidding  | ✅        | ✅    | ❌         | ✅         | ❌           |
| End Bidding    | ✅        | ✅    | ❌         | ✅         | ❌           |
| Cancel Bidding | ✅        | ✅    | ❌         | ✅         | ❌           |
| Place Bid      | ✅        | ✅    | ❌         | ✅         | ✅           |
| View Auction   | ✅        | ✅    | ✅         | ✅         | ✅           |

## Migration Notes

### From Old System

- **Old**: `socket.userRole` (string: "organizer" | "bidder" | "viewer")
- **New**: `socket.userRoleInfo` (object with detailed role information)

### Backward Compatibility

- API still returns `role` field for backward compatibility
- WebSocket server can handle both old and new role formats
- Gradual migration possible

## Testing

### Test Cases

1. **Organizer**: Should be able to perform all actions
2. **Admin**: Should be able to manage auction and bid
3. **Maintainer**: Should only be able to view auction
4. **Auctioneer**: Should be able to manage auction and bid
5. **Team Captain**: Should only be able to bid
6. **Team Member**: Should only be able to view
7. **No Role**: Should only be able to view

### Test Scenarios

```typescript
// Test auction management permissions
if (!this.syncServer.canManageAuction(socket.userRoleInfo)) {
  throw new Error("User does not have permission to manage auction");
}

// Test bidding permissions
if (!this.syncServer.canBid(socket.userRoleInfo)) {
  throw new Error("User does not have permission to bid");
}

// Test specific role
if (!this.syncServer.hasTournamentRole(socket.userRoleInfo, "organizer")) {
  throw new Error("User is not an organizer");
}
```

## Benefits

1. **Consistency**: Same role system across Next.js and WebSocket
2. **Flexibility**: Multiple roles per user
3. **Granular Control**: Fine-grained permissions
4. **Scalability**: Easy to add new roles and permissions
5. **Maintainability**: Centralized role logic

## Future Enhancements

1. **Role Expiration**: Time-based role assignments
2. **Role History**: Track role changes over time
3. **Custom Permissions**: User-defined permission sets
4. **Role Inheritance**: Hierarchical role system
5. **Audit Logging**: Track all role-based actions
