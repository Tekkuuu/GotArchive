CREATE TYPE "public"."typeFeedbackStatus" AS ENUM('open', 'inprogress', 'closed', 'wontfix');--> statement-breakpoint
CREATE TYPE "public"."typeFeedbackTags" AS ENUM('bug', 'feature request', 'question', 'other');--> statement-breakpoint
ALTER TABLE "feedback" ADD COLUMN "timestamp" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "feedback" ADD COLUMN "tags" "typeFeedbackTags" DEFAULT 'other' NOT NULL;--> statement-breakpoint
ALTER TABLE "feedback" ADD COLUMN "implemented" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "feedback" ADD COLUMN "status" "typeFeedbackStatus" DEFAULT 'open' NOT NULL;--> statement-breakpoint
ALTER TABLE "feedback" ADD COLUMN "contact_info" varchar(200);