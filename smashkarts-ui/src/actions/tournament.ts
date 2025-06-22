'use server'
import { getServerSession } from "@/auth/auth-server";
import { ServerError } from "@/lib/safe-action";
import { db } from "@/server/db";
import { category, participant, team, tournament, user } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";

type Participant = typeof participant.$inferSelect;
type Category = typeof category.$inferSelect;
type User = typeof user.$inferSelect;

export async function assertTournamentOrganizer(tournamentId: string) {
    const session = await getServerSession();
    if (!session) {
        throw new ServerError("Unauthorized Only Tournament Organizer can perform this action");
    }
    const currentTournament = await db.query.tournament.findFirst({
        where: eq(tournament.id, tournamentId),
    });
    if (!currentTournament) {
        throw new ServerError("Tournament not found");
    }
    if (currentTournament.organizerId !== session.user.id) {
        throw new ServerError("Unauthorized Only Tournament Organizer can perform this action");
    }

    return { currentTournament, session };
}


interface CreateCategoryParams {
    tournamentId: string;
    name: string;
    basePrice: number;
}

export async function createCategory(params: CreateCategoryParams) {
    const { tournamentId, name, basePrice } = params;

    await assertTournamentOrganizer(tournamentId);

    const newCategory = await db.insert(category).values({
        tournamentId,
        name,
        basePrice,
    }).returning();

    return newCategory[0];


}


interface UpdateCategoryParams {
    categoryId: string;
    name: string;
    basePrice: number;
    tournamentId: string;
}

export async function updateCategory(params: UpdateCategoryParams) {
    const { categoryId, name, basePrice, tournamentId } = params;

    await assertTournamentOrganizer(tournamentId);

    const updatedCategory = await db.update(category).set({ name, basePrice }).where(eq(category.id, categoryId)).returning();

    return updatedCategory[0];
}


interface DeleteCategoryParams {
    categoryId: string;
    tournamentId: string;
}

export async function deleteCategory(params: DeleteCategoryParams) {
    const { categoryId, tournamentId } = params;

    await assertTournamentOrganizer(tournamentId);

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

    await assertTournamentOrganizer(tournamentId);

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

    await assertTournamentOrganizer(tournamentId);

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

    await assertTournamentOrganizer(tournamentId);

    const newTeam = await db.insert(team).values({ tournamentId, name, purse }).returning();

    return newTeam[0];
}


// interface AddTeamMemberParams {
//     teamId: string;
//     participantId: string;
//     role: "captain" | "member";
//     tournamentId: string;
// }

// export async function addUpdateTeamMember(params: AddTeamMemberParams) {
//     const { teamId, participantId, role, tournamentId } = params;

//     await assertTournamentOrganizer(tournamentId);

//     const newTeamMember = await db
//         .insert(participant)
//         .values({
//             teamId,
//             participantId,
//             role: role
//         })
//         .onConflictDoUpdate({
//             target: [teamMember.teamId, teamMember.participantId],
//             set: {
//                 role: role
//             }
//         })
//         .returning();

//     return newTeamMember[0];
// }


// interface DeleteTeamMemberParams {
//     teamMemberId: string;
//     tournamentId: string;
// }

// export async function deleteTeamMember(params: DeleteTeamMemberParams) {
//     const { teamMemberId, tournamentId } = params;

//     await assertTournamentOrganizer(tournamentId);

//     await db.delete(teamMember).where(eq(teamMember.id, teamMemberId));

//     return true;
// }




interface UpdateTournamentParams {
    tournamentId: string;
    name: string;
    description: string;
    bannerImage: string;
    prizePool: string;
}

export async function updateTournament(params: UpdateTournamentParams) {
    const { tournamentId, name, description, bannerImage, prizePool } = params;

    await assertTournamentOrganizer(tournamentId);

    const updatedTournament = await db.update(tournament).set({ name, description, bannerImage, prizePool }).where(eq(tournament.id, tournamentId)).returning();

    return updatedTournament[0];
}




interface UpdateParticipantStatusParams {
    participantId: string;
    status: "confirmed" | "pending" | "rejected";
    tournamentId: string;
}

export async function updateParticipantStatus(params: UpdateParticipantStatusParams) {
    const { participantId, status, tournamentId } = params;

    await assertTournamentOrganizer(tournamentId);

    const updatedParticipant = await db.update(participant).set({ status }).where(eq(participant.id, participantId)).returning();

    return updatedParticipant[0];
}



export async function participantDataAuction(participantId: string) {

    const participantData = await db.query.participant.findFirst({
        where: eq(participant.id, participantId),
        with: {
            category: true,
            user: true
        }
    });

    return {
        participant: participantData as Participant,
        category: participantData?.category as Category,
        user: participantData?.user as User,
    };

}