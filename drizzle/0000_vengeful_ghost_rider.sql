CREATE TYPE "public"."typeFormat" AS ENUM('TV', 'TV_SHORT', 'MOVIE', 'SPECIAL', 'OVA', 'ONA', 'MUSIC');--> statement-breakpoint
CREATE TYPE "public"."typeScheduleEntry" AS ENUM('anime', 'hololive', 'game', 'event', 'sponsored', 'misc');--> statement-breakpoint
CREATE TYPE "public"."typeSeason" AS ENUM('WINTER', 'SPRING', 'SUMMER', 'FALL');--> statement-breakpoint
CREATE TABLE "anime" (
	"anime_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title_native" varchar NOT NULL,
	"title_romaji" varchar,
	"title_english" varchar,
	"logo_url" varchar,
	"short_title" varchar,
	CONSTRAINT "anime_titles_unique" UNIQUE("title_native","title_romaji","title_english")
);
--> statement-breakpoint
CREATE TABLE "anime_genre" (
	"anime_id" uuid NOT NULL,
	"genre_id" uuid NOT NULL,
	CONSTRAINT "anime_genre_anime_id_genre_id_pk" PRIMARY KEY("anime_id","genre_id")
);
--> statement-breakpoint
CREATE TABLE "anime_link" (
	"anime_id" uuid NOT NULL,
	"url" varchar NOT NULL,
	"platform_id" uuid NOT NULL,
	"note" text,
	CONSTRAINT "anime_link_anime_id_url_pk" PRIMARY KEY("anime_id","url")
);
--> statement-breakpoint
CREATE TABLE "anime_season" (
	"anime_season_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"anime_id" uuid NOT NULL,
	"sequence" smallint NOT NULL,
	"format" "typeFormat" NOT NULL,
	"title_native" varchar NOT NULL,
	"title_romaji" varchar,
	"title_english" varchar,
	"short_title" varchar,
	"season" "typeSeason",
	"year" smallint,
	"episodes" integer,
	"episode_progress" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "unique_anime_season" UNIQUE("anime_id","sequence")
);
--> statement-breakpoint
CREATE TABLE "genre" (
	"genre_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	CONSTRAINT "genre_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "platform" (
	"platform_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"url" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "schedule" (
	"schedule_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"year" smallint NOT NULL,
	"week" smallint NOT NULL,
	"note" text,
	"preview" boolean DEFAULT false NOT NULL,
	CONSTRAINT "unique_year_week" UNIQUE("year","week"),
	CONSTRAINT "check_week_range" CHECK ("schedule"."week" BETWEEN 1 AND 53)
);
--> statement-breakpoint
CREATE TABLE "schedule_entry" (
	"schedule_entry_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"schedule_id" uuid NOT NULL,
	"type" "typeScheduleEntry" NOT NULL,
	"date" date NOT NULL,
	"time" time,
	"note" text,
	"logo_url" varchar,
	"anime_season_id" uuid,
	"title" varchar,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "schedule_entry_platform" (
	"schedule_entry_id" uuid NOT NULL,
	"platform_id" uuid NOT NULL,
	CONSTRAINT "schedule_entry_platform_schedule_entry_id_platform_id_pk" PRIMARY KEY("schedule_entry_id","platform_id")
);
--> statement-breakpoint
ALTER TABLE "anime_genre" ADD CONSTRAINT "anime_fk" FOREIGN KEY ("anime_id") REFERENCES "public"."anime"("anime_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anime_genre" ADD CONSTRAINT "genre_fk" FOREIGN KEY ("genre_id") REFERENCES "public"."genre"("genre_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anime_link" ADD CONSTRAINT "anime_fk" FOREIGN KEY ("anime_id") REFERENCES "public"."anime"("anime_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anime_link" ADD CONSTRAINT "platform_fk" FOREIGN KEY ("platform_id") REFERENCES "public"."platform"("platform_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anime_season" ADD CONSTRAINT "anime_fk" FOREIGN KEY ("anime_id") REFERENCES "public"."anime"("anime_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_entry" ADD CONSTRAINT "schedule_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."schedule"("schedule_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_entry" ADD CONSTRAINT "anime_season_fk" FOREIGN KEY ("anime_season_id") REFERENCES "public"."anime_season"("anime_season_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_entry_platform" ADD CONSTRAINT "schedule_entry_fk" FOREIGN KEY ("schedule_entry_id") REFERENCES "public"."schedule_entry"("schedule_entry_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_entry_platform" ADD CONSTRAINT "platform_fk" FOREIGN KEY ("platform_id") REFERENCES "public"."platform"("platform_id") ON DELETE no action ON UPDATE no action;