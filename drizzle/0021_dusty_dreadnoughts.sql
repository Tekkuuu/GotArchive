CREATE TABLE "schedule_entry_platform" (
	"schedule_entry_id" integer NOT NULL,
	"platform_id" integer NOT NULL,
	CONSTRAINT "schedule_entry_platform_schedule_entry_id_platform_id_pk" PRIMARY KEY("schedule_entry_id","platform_id")
);
--> statement-breakpoint
ALTER TABLE "schedule_entry" DROP CONSTRAINT "platform_fk";
--> statement-breakpoint
ALTER TABLE "schedule_anime_detail" ALTER COLUMN "watched_after" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "schedule_entry_platform" ADD CONSTRAINT "schedule_entry_fk" FOREIGN KEY ("schedule_entry_id") REFERENCES "public"."schedule_entry"("schedule_entry_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_entry_platform" ADD CONSTRAINT "platform_fk" FOREIGN KEY ("platform_id") REFERENCES "public"."platform"("platform_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_entry" DROP COLUMN "platform_id";