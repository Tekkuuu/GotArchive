ALTER TABLE "users" DROP CONSTRAINT "users_supabase_id_unique";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "supabase_id" DROP NOT NULL;