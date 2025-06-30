'use server'
import { getServerSession } from "@/auth/auth-server";
import { ServerError } from "@/lib/safe-action";
import { db } from "@/server/db";
import { category, participant, team, tournament, type user, tournamentRoleAssignment } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";

type Participant = typeof participant.$inferSelect;
type Category = typeof category.$inferSelect;
type User = typeof user.$inferSelect;
type Tournament = typeof tournament.$inferSelect;
type TournamentRole = "organizer" | "admin" | "maintainer" | "auctioneer";
type Permission = "all" | "dashboard" | "auction";

// Role hierarchy and permissions
const ROLE_PERMISSIONS = {
    organizer: {
        level: 3,
        permissions: ["all"] as Permission[]
    },
    admin: {
        level: 2,
        permissions: ["dashboard", "auction"] as Permission[]
    },
    maintainer: {
        level: 1,
        permissions: ["dashboard"] as Permission[]
    },
    auctioneer: {
        level: 1,
        permissions: ["auction"] as Permission[]
    }
} as const;


export async function getParticipantTournamentRoles(tournamentId: string, participantId: string): Promise<TournamentRole[]> {

    const participantData = await db.query.participant.findFirst({
        where: and(
            eq(participant.tournamentId, tournamentId),
            eq(participant.id, participantId)
        ),
        with: {
            tournamentRoles: true,
        },
    });

    if (!participantData) return [];

    return participantData.tournamentRoles.map(role => role.role);
}

// Helper function to check if user has specific roles
export async function hasTournamentRoles(tournamentId: string, participantId: string, requiredRoles: TournamentRole[]): Promise<boolean> {
    const userRoles = await getParticipantTournamentRoles(tournamentId, participantId);
    return requiredRoles.some(role => userRoles.includes(role));
}

// Helper function to check if user has permission for specific action
export async function hasTournamentPermission(tournamentId: string, participantId: string, permission: Permission): Promise<boolean> {
    const userRoles = await getParticipantTournamentRoles(tournamentId, participantId);

    // Check if user has any role with the required permission
    for (const role of userRoles) {
        const roleConfig = ROLE_PERMISSIONS[role];
        if (roleConfig.permissions.includes("all") || roleConfig.permissions.includes(permission)) {
            return true;
        }
    }

    return false;
}

// Helper function to get user's highest role level
export async function getParticipantHighestRoleLevel(tournamentId: string, participantId: string): Promise<number> {
    const userRoles = await getParticipantTournamentRoles(tournamentId, participantId);

    if (userRoles.length === 0) return 0;

    return Math.max(...userRoles.map(role => ROLE_PERMISSIONS[role].level));
}

// Assertion function for server actions
export async function assertTournamentPermission(tournamentId: string, permission: Permission) {
    const session = await getServerSession();
    if (!session) {
        throw new ServerError("Unauthorized - Please sign in");
    }

    const participantData = await db.query.participant.findFirst({
        where: and(
            eq(participant.tournamentId, tournamentId),
            eq(participant.userId, session.user.id)
        ),
    });

    if (!participantData) {
        throw new ServerError("Unauthorized - Participant not found");
    }

    const hasPermission = await hasTournamentPermission(tournamentId, participantData.id, permission);
    if (!hasPermission) {
        throw new ServerError(`Unauthorized - Insufficient permissions for: ${permission}`);
    }

    return { session };
}

// Assertion function for specific roles
export async function assertTournamentRoles(tournamentId: string, requiredRoles: TournamentRole[]) {
    const session = await getServerSession();
    if (!session) {
        throw new ServerError("Unauthorized - Please sign in");
    }

    const participantData = await db.query.participant.findFirst({
        where: and(
            eq(participant.tournamentId, tournamentId),
            eq(participant.userId, session.user.id)
        ),
    });

    if (!participantData) {
        throw new ServerError("Unauthorized - Participant not found");
    }

    const hasRoles = await hasTournamentRoles(tournamentId, participantData.id, requiredRoles);
    if (!hasRoles) {
        throw new ServerError(`Unauthorized - Required roles: ${requiredRoles.join(', ')}`);
    }

    return { session };
}

// Role assignment functions
export async function assignTournamentRole(tournamentId: string, participantId: string, role: TournamentRole, assignedBy: string) {
    // Only organizers can assign roles
    await assertTournamentRoles(tournamentId, ["organizer"]);

    // Check if the role already exists for this participant
    const existingRole = await db.query.tournamentRoleAssignment.findFirst({
        where: and(
            eq(tournamentRoleAssignment.tournamentId, tournamentId),
            eq(tournamentRoleAssignment.participantId, participantId),
            eq(tournamentRoleAssignment.role, role)
        ),
    });

    if (existingRole) {
        throw new ServerError(`Role '${role}' is already assigned to this participant`);
    }

    await db.insert(tournamentRoleAssignment).values({
        tournamentId,
        participantId,
        role,
        assignedBy,
    });
}

export async function removeTournamentRole(tournamentId: string, participantId: string, role: TournamentRole) {
    // Only organizers can remove roles
    await assertTournamentRoles(tournamentId, ["organizer"]);

    // Check if the role exists before trying to remove it
    const existingRole = await db.query.tournamentRoleAssignment.findFirst({
        where: and(
            eq(tournamentRoleAssignment.tournamentId, tournamentId),
            eq(tournamentRoleAssignment.participantId, participantId),
            eq(tournamentRoleAssignment.role, role)
        ),
    });

    if (!existingRole) {
        throw new ServerError(`Role '${role}' is not assigned to this participant`);
    }

    await db.delete(tournamentRoleAssignment).where(
        and(
            eq(tournamentRoleAssignment.tournamentId, tournamentId),
            eq(tournamentRoleAssignment.participantId, participantId),
            eq(tournamentRoleAssignment.role, role)
        )
    );
}

// Get all participants with their roles for a tournament
export async function getTournamentParticipantsWithRoles(tournamentId: string) {
    const participants = await db.query.participant.findMany({
        where: eq(participant.tournamentId, tournamentId),
        with: {
            user: true,
            tournamentRoles: true,
            category: true,
            team: true,
        },
    });

    return participants.map(participant => ({
        ...participant,
        roles: participant.tournamentRoles.map(role => role.role),
    }));
}

// Legacy function for backward compatibility (will be removed after migration)
export async function assertTournamentOrganizer(tournamentId: string) {
    return await assertTournamentRoles(tournamentId, ["organizer"]);
}

interface CreateCategoryParams {
    tournamentId: string;
    name: string;
    basePrice: number;
    increment: number;
}

export async function createCategory(params: CreateCategoryParams) {
    const { tournamentId, name, basePrice, increment } = params;

    await assertTournamentPermission(tournamentId, "dashboard");

    const newCategory = await db.insert(category).values({
        tournamentId,
        name,
        basePrice,
        increment,
    }).returning();

    return newCategory[0];
}


interface UpdateCategoryParams {
    categoryId: string;
    name: string;
    basePrice: number;
    increment: number;
    tournamentId: string;
}

export async function updateCategory(params: UpdateCategoryParams) {
    const { categoryId, name, basePrice, increment, tournamentId } = params;

    await assertTournamentPermission(tournamentId, "dashboard");

    const updatedCategory = await db.update(category).set({ name, basePrice, increment }).where(eq(category.id, categoryId)).returning();

    return updatedCategory[0];
}


interface DeleteCategoryParams {
    categoryId: string;
    tournamentId: string;
}

export async function deleteCategory(params: DeleteCategoryParams) {
    const { categoryId, tournamentId } = params;

    await assertTournamentPermission(tournamentId, "dashboard");

    await db.delete(category).where(eq(category.id, categoryId));

    return true;
}


interface UpdateParticipantCategoryParams {
    participantId: string;
    categoryId: string;
    tournamentId: string
}

export async function updateParticipantCategory(params: UpdateParticipantCategoryParams) {
    const { categoryId, participantId, tournamentId } = params;

    await assertTournamentPermission(tournamentId, "dashboard");

    const participantCount = (await db.query.participant.findMany({
        where: and(
            eq(participant.tournamentId, tournamentId),
            eq(participant.categoryId, categoryId)
        ),
        columns: {
            id: true,
        }

    }).then(participants => participants.length)) + 1;



    const updatedParticipant = await db.update(participant).set({ categoryId, categoryRank: participantCount }).where(eq(participant.id, participantId)).returning();

    return updatedParticipant[0];
}



interface changeParticipantStatus {
    participantId: string;
    status: "confirmed" | "pending" | "rejected";
    tournamentId: string;
}

export async function changeParticipantStatus(params: changeParticipantStatus) {
    const { participantId, status, tournamentId } = params;

    await assertTournamentPermission(tournamentId, "dashboard");

    const updatedParticipant = await db.update(participant).set({ status }).where(eq(participant.id, participantId)).returning();

    return updatedParticipant[0];
}



interface CreateTeamParams {
    tournamentId: string;
    name: string;
    purse: number;
}

export async function createTeam(params: CreateTeamParams) {
    const { tournamentId, name, purse } = params;

    await assertTournamentPermission(tournamentId, "dashboard");

    const newTeam = await db.insert(team).values({ tournamentId, name, purse }).returning();

    return newTeam[0];
}

interface DeleteTeamParams {
    teamId: string;
    tournamentId: string;
}

export async function deleteTeam(params: DeleteTeamParams) {
    const { teamId, tournamentId } = params;

    await assertTournamentPermission(tournamentId, "dashboard");

    // First, remove all participants from this team
    await db.update(participant)
        .set({ teamId: null, teamRole: null })
        .where(eq(participant.teamId, teamId));

    // Then delete the team
    await db.delete(team).where(eq(team.id, teamId));

    return true;
}




interface UpdateTournamentParams {
    tournamentId: string;
    name: string;
    description: string;
    bannerImage: string;
    maxTeamParticipants: number;
}

export async function updateTournament(params: UpdateTournamentParams) {
    const { tournamentId, name, description, bannerImage, maxTeamParticipants } = params;

    await assertTournamentPermission(tournamentId, "dashboard");

    const updatedTournament = await db.update(tournament).set({ name, description, bannerImage, maxTeamParticipants }).where(eq(tournament.id, tournamentId)).returning();

    return updatedTournament[0];
}




interface UpdateParticipantStatusParams {
    participantId: string;
    status: "confirmed" | "pending" | "rejected";
    tournamentId: string;
}

export async function updateParticipantStatus(params: UpdateParticipantStatusParams) {
    const { participantId, status, tournamentId } = params;

    await assertTournamentPermission(tournamentId, "dashboard");

    const updatedParticipant = await db.update(participant).set({ status }).where(eq(participant.id, participantId)).returning();

    return updatedParticipant[0];
}



export async function participantDataAuction(participantId: string) {

    const participantData = await db.query.participant.findFirst({
        where: eq(participant.id, participantId),
        with: {
            category: true,
            user: true,
            tournament: {
                columns: {
                    slug: true
                }
            }
        }
    });

    return {
        participant: participantData as Participant,
        category: participantData?.category as Category,
        tournament: participantData?.tournament as Tournament,
        user: participantData?.user as User,
    };

}