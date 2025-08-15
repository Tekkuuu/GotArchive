ALTER TABLE "schedule_anime_detail" ADD COLUMN "watched_after" timestamp with time zone;
UPDATE "schedule_anime_detail" sad
SET "watched_after" =
  CASE
    -- If scheduled date is before today, set watchedAfter to start of today
    WHEN "se"."date" < '2025-08-13' THEN '2025-08-13 00:00:00+00'
    -- If scheduled date is today or later, set to next day midnight
    ELSE ("se"."date" + INTERVAL '1 day')::timestamp
  END
FROM "schedule_entry" "se"
WHERE "sad"."schedule_entry_id" = "se"."schedule_entry_id" AND "sad"."watched_after" IS NULL;
ALTER TABLE "schedule_anime_detail" ALTER COLUMN "watched_after" SET NOT NULL;
