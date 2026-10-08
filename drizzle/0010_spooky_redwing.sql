ALTER TABLE "schedule_entry_platform" DROP CONSTRAINT "platform_fk";
--> statement-breakpoint
ALTER TABLE "schedule_slot_platform" DROP CONSTRAINT "platform_fk";
--> statement-breakpoint
ALTER TABLE "schedule_entry_platform" ADD CONSTRAINT "platform_fk" FOREIGN KEY ("platform_id") REFERENCES "public"."platform"("platform_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_slot_platform" ADD CONSTRAINT "platform_fk" FOREIGN KEY ("platform_id") REFERENCES "public"."platform"("platform_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anime_season_metadata" ADD CONSTRAINT "unique_metadata_season" UNIQUE("anime_season_id");