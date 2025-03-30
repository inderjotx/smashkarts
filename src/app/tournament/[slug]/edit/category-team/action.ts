"use server"

import { createCategory, createTeam, updateCategory } from "@/actions/tournament";
import { actionClient, ServerError } from "@/lib/safe-action";
import { createCategorySchema, createTeamSchema, updateCategorySchema } from "./schema";
import { db } from "@/server/db";
import { teamMember } from "@/server/db/schema";


export const createCategoryAction = actionClient
    .schema(createCategorySchema)
    .action(async ({ parsedInput }) => {
        const { tournamentId, name, basePrice } = parsedInput;
        return await createCategory({
            tournamentId,
            name,
            basePrice,
        });
    });

export const updateCategoryAction = actionClient
    .schema(updateCategorySchema)
    .action(async ({ parsedInput }) => {
        const { tournamentId, categoryId, name, basePrice } = parsedInput;
        return await updateCategory({
            categoryId,
            tournamentId,
            name,
            basePrice,
        });
    });

export const createTeamActionAndAddCaptain = actionClient
    .schema(createTeamSchema)
    .action(async ({ parsedInput }) => {
        const { tournamentId, name, captainId } = parsedInput;
        console.log("parsedInput", parsedInput);

        const team = await createTeam({
            tournamentId,
            name,
        });

        console.log("team", team);
        if (!team) {
            throw new ServerError("Failed to create team");
        }


        const createCaptain = await db.insert(teamMember).values({
            teamId: team.id,
            participantId: captainId,
            role: "captain",
        });

        console.log("createCaptain", createCaptain);

        if (!createCaptain) {
            throw new ServerError("Failed to add captain to team");
        }

        return team;
    });

export type { CreateCategoryInput, CreateTeamInput } from "./schema";



