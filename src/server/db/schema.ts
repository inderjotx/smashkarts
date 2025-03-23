import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, boolean, pgEnum, integer, uuid } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: boolean('email_verified').notNull(),
	image: text('image'),
	sId: text('s_id'),
	createdAt: timestamp('created_at').notNull(),
	updatedAt: timestamp('updated_at').notNull()
});

export const session = pgTable("session", {
	id: text("id").primaryKey(),
	expiresAt: timestamp('expires_at').notNull(),
	token: text('token').notNull().unique(),
	createdAt: timestamp('created_at').notNull(),
	updatedAt: timestamp('updated_at').notNull(),
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
	createdAt: timestamp('created_at').notNull(),
	updatedAt: timestamp('updated_at').notNull()
});

export const verification = pgTable("verification", {
	id: text("id").primaryKey(),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: timestamp('expires_at').notNull(),
	createdAt: timestamp('created_at'),
	updatedAt: timestamp('updated_at')
});

// Define enums first
export const playerRole = pgEnum("player_role", ["assualt", "defence", "mid-defence"]);
export const teamRole = pgEnum("team_role", ["captain", "member"]);

// Define tournament first since it's referenced by others
export const tournament = pgTable("tournament", {
	id: uuid("id").defaultRandom().primaryKey(),
	createdAt: timestamp('created_at').notNull(),
	updatedAt: timestamp('updated_at').notNull(),
	organizerId: text('organizer_id').notNull(),
	name: text('name').notNull(),
	slug: text('slug').notNull(),
	bannerImage: text('banner_image'),
	description: text('description'),
	prizePool: text('prize_pool'),
});

export const team = pgTable("team", {
	id: uuid("id").defaultRandom().primaryKey(),
	createdAt: timestamp('created_at').notNull(),
	name: text('name').notNull(),
	updatedAt: timestamp('updated_at').notNull(),
	tournamentId: uuid('tournament_id').references(() => tournament.id, { onDelete: 'cascade' })
});

export const participationStatus = pgEnum("participation_status", ["confirmed", "pending", "rejected"]);

export const participant = pgTable("participant", {
	id: uuid("id").defaultRandom().primaryKey(),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	tournamentId: uuid('tournament_id').notNull().references(() => tournament.id, { onDelete: 'cascade' }),
	createdAt: timestamp('created_at').notNull(),
	updatedAt: timestamp('updated_at').notNull(),
	category: integer('category'),
	categoryRank: integer('category_rank'),
	sellingPrice: integer('selling_price'),
	teamId: uuid('team_id').references(() => team.id, { onDelete: 'cascade' }),
	role: playerRole('role'),
	status: participationStatus('status').default('pending'),
});

export const teamMember = pgTable("team_member", {
	id: uuid("id").defaultRandom().primaryKey(),
	teamId: uuid('team_id').notNull().references(() => team.id, { onDelete: 'cascade' }),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	role: teamRole('role').notNull(),
});

// Define relations after all tables are defined
export const tournamentRelations = relations(tournament, ({ one, many }) => ({
	organizer: one(user, {
		fields: [tournament.organizerId],
		references: [user.id],
	}),
	participants: many(participant),
	teams: many(team),
}));

export const teamRelations = relations(team, ({ many, one }) => ({
	teamMembers: many(teamMember),
	tournament: one(tournament, {
		fields: [team.tournamentId],
		references: [tournament.id],
	}),
}));

export const participantRelations = relations(participant, ({ one }) => ({
	user: one(user, {
		fields: [participant.userId],
		references: [user.id],
	}),
	tournament: one(tournament, {
		fields: [participant.tournamentId],
		references: [tournament.id],
	}),
}));

export const teamMemberRelations = relations(teamMember, ({ one }) => ({
	team: one(team, {
		fields: [teamMember.teamId],
		references: [team.id],
	}),
	user: one(user, {
		fields: [teamMember.userId],
		references: [user.id],
	}),
}));

