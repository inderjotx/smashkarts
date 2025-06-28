ALTER TABLE "user" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "participant" DROP COLUMN IF EXISTS "description";