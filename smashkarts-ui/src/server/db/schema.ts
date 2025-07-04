import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, boolean, pgEnum, integer, uuid, unique } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: boolean('email_verified').notNull(),
	image: text('image'),
	sId: text('s_id'),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow(),
	kd: integer('kd').default(0),
	gamesPlayed: integer('games_played').default(0),
	description: text('description'),
});

export const session = pgTable("session", {
	id: text("id").primaryKey(),
	expiresAt: timestamp('expires_at').notNull(), token: text('token').notNull().unique(),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow(),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' })
});

export const account = pgTable("account", {
	id: text("id").primaryKey(),
	accountId: text('account_id').notNull(),
	providerId: text('provider_id').notNull(),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	accessToken: text('access_token'),
	refreshToken: text('refresh_token'),
	idToken: text('id_token'),
	accessTokenExpiresAt: timestamp('access_token_expires_at'),
	refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
	scope: text('scope'),
	password: text('password'),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow()
});

export const verification = pgTable("verification", {
	id: text("id").primaryKey(),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: timestamp('expires_at').notNull(),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow()
});

// Define enums first
export const playerRole = pgEnum("player_role", ["assualt", "defence", "mid-defence"]);
export const teamRole = pgEnum("team_role", ["captain", "member"]);
export const tournamentStatus = pgEnum("tournament_status", ["registration", "auction", "matches", "completed"]);
export const tournamentRole = pgEnum("tournament_role", ["organizer", "admin", "maintainer", "auctioneer"]);

// Define tournament first since it's referenced by others
export const tournament = pgTable("tournament", {
	id: uuid("id").defaultRandom().primaryKey(),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow(),
	name: text('name').notNull(),
	slug: text('slug').notNull().unique(),
	bannerImage: text('banner_image'),
	description: text('description'),
	status: tournamentStatus('status').default('registration'),
	auctionUrl: text('auction_url'),
	maxTeamParticipants: integer('max_team_participants').default(4),
});

export const team = pgTable("team", {
	id: uuid("id").defaultRandom().primaryKey(),
	createdAt: timestamp('created_at').defaultNow(),
	name: text('name').notNull(),
	updatedAt: timestamp('updated_at').defaultNow(),
	tournamentId: uuid('tournament_id').references(() => tournament.id, { onDelete: 'cascade' }),
	purse: integer('purse').default(0),
});

export const participationStatus = pgEnum("participation_status", ["confirmed", "pending", "rejected"]);

export const participant = pgTable("participant", {
	id: uuid("id").defaultRandom().primaryKey(),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	tournamentId: uuid('tournament_id').notNull().references(() => tournament.id, { onDelete: 'cascade' }),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow(),
	sellingPrice: integer('selling_price'),
	teamId: uuid('team_id').references(() => team.id, { onDelete: 'cascade' }),
	role: playerRole('role'),
	teamRole: teamRole('team_role'),
	status: participationStatus('status').default('pending'),
	categoryRank: integer('category_rank'),
	categoryId: uuid('category_id').references(() => category.id, { onDelete: 'cascade' }),
}, (t) => ({
	uniqueTeamUser: unique().on(t.teamId, t.userId)
}));

export const category = pgTable("category", {
	id: uuid("id").defaultRandom().primaryKey(),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow(),
	tournamentId: uuid('tournament_id').references(() => tournament.id, { onDelete: 'cascade' }),
	increment: integer('increment'),
	name: text('name').notNull(),
	basePrice: integer('base_price'),
});

export const teamRelations = relations(team, ({ many, one }) => ({
	participants: many(participant),
	tournament: one(tournament, {
		fields: [team.tournamentId],
		references: [tournament.id],
	}),
}));

export const participantRelations = relations(participant, ({ one, many }) => ({
	user: one(user, {
		fields: [participant.userId],
		references: [user.id],
	}),
	tournament: one(tournament, {
		fields: [participant.tournamentId],
		references: [tournament.id],
	}),
	category: one(category, {
		fields: [participant.categoryId],
		references: [category.id],
	}),
	team: one(team, {
		fields: [participant.teamId],
		references: [team.id],
	}),
	tournamentRoles: many(tournamentRoleAssignment, { relationName: "participant_role_assignment" }),
	assignedRoles: many(tournamentRoleAssignment, { relationName: "assigned_by_participant" }),
}));

export const categoryRelations = relations(category, ({ many, one }) => ({
	participants: many(participant),
	tournament: one(tournament, {
		fields: [category.tournamentId],
		references: [tournament.id],
	}),
}));

export const tournamentRelations = relations(tournament, ({ many }) => ({
	participants: many(participant),
	teams: many(team),
	categories: many(category),
	roleAssignments: many(tournamentRoleAssignment),
}));

export const tournamentRoleAssignment = pgTable("tournament_role_assignment", {
	id: uuid("id").defaultRandom().primaryKey(),
	participantId: uuid('participant_id').notNull().references(() => participant.id, { onDelete: 'cascade' }),
	tournamentId: uuid('tournament_id').notNull().references(() => tournament.id, { onDelete: 'cascade' }),
	role: tournamentRole('role').notNull(),
	assignedBy: uuid('assigned_by').references(() => participant.id, { onDelete: 'set null' }),
	assignedAt: timestamp('assigned_at').defaultNow(),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow(),
}, (t) => ({
	uniqueParticipantRole: unique().on(t.participantId, t.role)
}));

export const tournamentRoleAssignmentRelations = relations(tournamentRoleAssignment, ({ one }) => ({
	participant: one(participant, {
		fields: [tournamentRoleAssignment.participantId],
		references: [participant.id],
		relationName: "participant_role_assignment",
	}),
	tournament: one(tournament, {
		fields: [tournamentRoleAssignment.tournamentId],
		references: [tournament.id],
	}),
	assignedByParticipant: one(participant, {
		fields: [tournamentRoleAssignment.assignedBy],
		references: [participant.id],
		relationName: "assigned_by_participant",
	}),
}));