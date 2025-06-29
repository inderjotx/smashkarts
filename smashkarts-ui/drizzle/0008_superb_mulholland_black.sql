DO $$ BEGIN
 CREATE TYPE "public"."tournament_role" AS ENUM('organizer', 'admin', 'maintainer', 'auctioneer');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tournament_role_assignment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"participant_id" uuid NOT NULL,
	"tournament_id" uuid NOT NULL,
	"role" "tournament_role" NOT NULL,
	"assigned_by" uuid,
	"assigned_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "tournament_role_assignment_participant_id_role_unique" UNIQUE("participant_id","role")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tournament_role_assignment" ADD CONSTRAINT "tournament_role_assignment_participant_id_participant_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participant"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tournament_role_assignment" ADD CONSTRAINT "tournament_role_assignment_tournament_id_tournament_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournament"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tournament_role_assignment" ADD CONSTRAINT "tournament_role_assignment_assigned_by_participant_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."participant"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "tournament" DROP COLUMN IF EXISTS "organizer_id";