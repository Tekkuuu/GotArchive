ALTER TABLE "anime_season_metadata" DROP CONSTRAINT "anime_season_metadata_anilist_id_unique";--> statement-breakpoint
ALTER TABLE "anime_season_metadata" DROP CONSTRAINT "anime_season_metadata_mal_id_unique";--> statement-breakpoint
ALTER TABLE "anime_season_metadata" ADD CONSTRAINT "unique_anilist_mal_combo" UNIQUE("anilist_id","mal_id");