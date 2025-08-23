ALTER TYPE "public"."typeScheduleEntry" ADD VALUE 'misc';--> statement-breakpoint
CREATE TABLE "schedule_misc_detail" (
	"schedule_misc_detail_id" serial PRIMARY KEY NOT NULL,
	"schedule_entry_id" integer NOT NULL,
	"title" varchar NOT NULL,
	"description" text
);
