CREATE TABLE "anime_season_metadata" (
	"anime_season_metadata_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"anilist_id" integer,
	"mal_id" integer,
	"note" text,
	CONSTRAINT "anime_season_metadata_anilist_id_unique" UNIQUE("anilist_id"),
	CONSTRAINT "anime_season_metadata_mal_id_unique" UNIQUE("mal_id")
);
