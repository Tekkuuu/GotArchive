CREATE TABLE "schedule_entry_anime_season" (
	"schedule_entry_id" uuid NOT NULL,
	"anime_season_id" uuid NOT NULL,
	"episodes" text NOT NULL,
	CONSTRAINT "schedule_entry_anime_season_schedule_entry_id_anime_season_id_pk" PRIMARY KEY("schedule_entry_id","anime_season_id")
);
--> statement-breakpoint
ALTER TABLE "schedule_entry" DROP CONSTRAINT "anime_season_fk";
--> statement-breakpoint
ALTER TABLE "schedule_slot" DROP CONSTRAINT "anime_season_fk";
--> statement-breakpoint
ALTER TABLE "schedule_slot" ADD COLUMN "anime_id" uuid;--> statement-breakpoint
ALTER TABLE "schedule_slot" ADD COLUMN "starting_sequence" smallint;--> statement-breakpoint
ALTER TABLE "schedule_slot" ADD COLUMN "starting_episode" smallint;--> statement-breakpoint
ALTER TABLE "schedule_entry_anime_season" ADD CONSTRAINT "schedule_entry_fk" FOREIGN KEY ("schedule_entry_id") REFERENCES "public"."schedule_entry"("schedule_entry_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_entry_anime_season" ADD CONSTRAINT "anime_season_fk" FOREIGN KEY ("anime_season_id") REFERENCES "public"."anime_season"("anime_season_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_slot" ADD CONSTRAINT "anime_fk" FOREIGN KEY ("anime_id") REFERENCES "public"."anime"("anime_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_entry" DROP COLUMN "anime_season_id";--> statement-breakpoint
ALTER TABLE "schedule_slot" DROP COLUMN "anime_season_id";