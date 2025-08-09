CREATE TYPE "public"."typeUserRole" AS ENUM('user', 'admin');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" "typeUserRole" DEFAULT 'user' NOT NULL;