ALTER TABLE "schedule_entry" RENAME COLUMN "datetime" TO "date";--> statement-breakpoint
ALTER TABLE "anime_season" ALTER COLUMN "anilist_link" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "schedule_entry" ADD COLUMN "time" time;