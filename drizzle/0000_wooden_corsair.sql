CREATE TYPE "public"."typeSeasonStatus" AS ENUM('On hold', 'Dropped');--> statement-breakpoint
CREATE TYPE "public"."typeFormat" AS ENUM('TV', 'TV_SHORT', 'MOVIE', 'SPECIAL', 'OVA', 'ONA', 'MUSIC');--> statement-breakpoint
CREATE TYPE "public"."typeScheduleEntry" AS ENUM('anime', 'hololive', 'game', 'event', 'sponsored');--> statement-breakpoint
CREATE TYPE "public"."typeSeason" AS ENUM('WINTER', 'SPRING', 'SUMMER', 'FALL');--> statement-breakpoint
CREATE TABLE "anime" (
	"anime_id" serial PRIMARY KEY NOT NULL,
	"title_native" varchar NOT NULL,
	"title_romaji" varchar NOT NULL,
	"title_english" varchar NOT NULL,
	CONSTRAINT "anime_titles_unique" UNIQUE("title_native","title_romaji","title_english")
);
--> statement-breakpoint
CREATE TABLE "anime_episode" (
	"anime_episode_id" serial PRIMARY KEY NOT NULL,
	"anime_id" integer NOT NULL,
	"sequence" smallint NOT NULL,
	"episode_number" smallint NOT NULL,
	"watched" boolean DEFAULT false NOT NULL,
	CONSTRAINT "unique_anime_season_episode" UNIQUE("anime_id","sequence","episode_number")
);
--> statement-breakpoint
CREATE TABLE "anime_genre" (
	"anime_id" integer NOT NULL,
	"genre_id" integer NOT NULL,
	CONSTRAINT "anime_genre_anime_id_genre_id_pk" PRIMARY KEY("anime_id","genre_id")
);
--> statement-breakpoint
CREATE TABLE "anime_link" (
	"anime_id" integer NOT NULL,
	"url" varchar NOT NULL,
	"platform_id" integer NOT NULL,
	"note" text,
	CONSTRAINT "anime_link_anime_id_url_pk" PRIMARY KEY("anime_id","url")
);
--> statement-breakpoint
CREATE TABLE "anime_season" (
	"anime_id" integer NOT NULL,
	"sequence" smallint NOT NULL,
	"format" "typeFormat" NOT NULL,
	"title_native" varchar NOT NULL,
	"title_romaji" varchar NOT NULL,
	"title_english" varchar NOT NULL,
	"season" "typeSeason",
	"year" smallint,
	"episodes" integer,
	"anilist_link" varchar,
	CONSTRAINT "anime_season_anime_id_sequence_pk" PRIMARY KEY("anime_id","sequence")
);
--> statement-breakpoint
CREATE TABLE "anime_season_status" (
	"anime_id" integer NOT NULL,
	"sequence" integer NOT NULL,
	"status" "typeSeasonStatus" NOT NULL,
	CONSTRAINT "anime_season_status_anime_id_sequence_pk" PRIMARY KEY("anime_id","sequence")
);
--> statement-breakpoint
CREATE TABLE "episode_link" (
	"anime_episode_id" integer NOT NULL,
	"url" varchar NOT NULL,
	"platform_id" integer NOT NULL,
	"note" text,
	CONSTRAINT "episode_link_anime_episode_id_url_pk" PRIMARY KEY("anime_episode_id","url")
);
--> statement-breakpoint
CREATE TABLE "genre" (
	"genre_id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	CONSTRAINT "genre_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "platform" (
	"platform_id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"url" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "schedule" (
	"schedule_id" serial PRIMARY KEY NOT NULL,
	"year" smallint NOT NULL,
	"week" smallint NOT NULL,
	"note" text,
	CONSTRAINT "unique_year_week" UNIQUE("year","week"),
	CONSTRAINT "check_week_range" CHECK ("schedule"."week" BETWEEN 1 AND 53)
);
--> statement-breakpoint
CREATE TABLE "schedule_anime_detail" (
	"schedule_anime_detail_id" serial PRIMARY KEY NOT NULL,
	"schedule_entry_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "schedule_anime_episode" (
	"schedule_anime_detail_id" integer NOT NULL,
	"anime_episode_id" integer NOT NULL,
	CONSTRAINT "schedule_anime_episode_schedule_anime_detail_id_anime_episode_id_pk" PRIMARY KEY("schedule_anime_detail_id","anime_episode_id")
);
--> statement-breakpoint
CREATE TABLE "schedule_entry" (
	"schedule_entry_id" serial PRIMARY KEY NOT NULL,
	"schedule_id" integer NOT NULL,
	"type" "typeScheduleEntry" NOT NULL,
	"datetime" timestamp NOT NULL,
	"platform_id" integer,
	"note" text
);
--> statement-breakpoint
ALTER TABLE "anime_episode" ADD CONSTRAINT "anime_season_fk" FOREIGN KEY ("anime_id","sequence") REFERENCES "public"."anime_season"("anime_id","sequence") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anime_genre" ADD CONSTRAINT "anime_fk" FOREIGN KEY ("anime_id") REFERENCES "public"."anime"("anime_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anime_genre" ADD CONSTRAINT "genre_fk" FOREIGN KEY ("genre_id") REFERENCES "public"."genre"("genre_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anime_link" ADD CONSTRAINT "anime_fk" FOREIGN KEY ("anime_id") REFERENCES "public"."anime"("anime_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anime_link" ADD CONSTRAINT "platform_fk" FOREIGN KEY ("platform_id") REFERENCES "public"."platform"("platform_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anime_season" ADD CONSTRAINT "anime_fk" FOREIGN KEY ("anime_id") REFERENCES "public"."anime"("anime_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anime_season_status" ADD CONSTRAINT "anime_season_fk" FOREIGN KEY ("anime_id","sequence") REFERENCES "public"."anime_season"("anime_id","sequence") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "episode_link" ADD CONSTRAINT "anime_episode_fk" FOREIGN KEY ("anime_episode_id") REFERENCES "public"."anime_episode"("anime_episode_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "episode_link" ADD CONSTRAINT "platform_fk" FOREIGN KEY ("platform_id") REFERENCES "public"."platform"("platform_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_anime_detail" ADD CONSTRAINT "schedule_entry_fk" FOREIGN KEY ("schedule_entry_id") REFERENCES "public"."schedule_entry"("schedule_entry_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_anime_episode" ADD CONSTRAINT "schedule_anime_detail_fk" FOREIGN KEY ("schedule_anime_detail_id") REFERENCES "public"."schedule_anime_detail"("schedule_anime_detail_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_anime_episode" ADD CONSTRAINT "anime_episode_fk" FOREIGN KEY ("anime_episode_id") REFERENCES "public"."anime_episode"("anime_episode_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_entry" ADD CONSTRAINT "schedule_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."schedule"("schedule_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_entry" ADD CONSTRAINT "platform_fk" FOREIGN KEY ("platform_id") REFERENCES "public"."platform"("platform_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE VIEW "public"."anime_season_status_view" AS (
  SELECT
  s.anime_id,
  s.sequence,
  COALESCE(
    m.status::text,
    CASE
      WHEN COUNT(e.*) FILTER (WHERE e.watched) = 0
        THEN 'Planned'
      WHEN COUNT(e.*) FILTER (WHERE e.watched) = COUNT(e.*)
        THEN 'Completed'
      ELSE 'Watching'
    END
  ) AS status
  FROM anime_season AS s
  LEFT JOIN anime_season_status AS m
    ON m.anime_id = s.anime_id
  AND m.sequence = s.sequence
  LEFT JOIN anime_episode AS e
    ON e.anime_id        = s.anime_id
  AND e.sequence = s.sequence
  GROUP BY s.anime_id, s.sequence, m.status
);