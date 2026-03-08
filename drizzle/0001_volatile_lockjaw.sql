CREATE TABLE "schedule_entry_slot" (
	"schedule_entry_id" uuid NOT NULL,
	"schedule_slot_id" uuid NOT NULL,
	CONSTRAINT "schedule_entry_slot_schedule_entry_id_pk" PRIMARY KEY("schedule_entry_id")
);
--> statement-breakpoint
CREATE TABLE "schedule_slot" (
	"schedule_slot_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"day_of_week" smallint NOT NULL,
	"time" time,
	"type" "typeScheduleEntry",
	"anime_season_id" uuid,
	"title" varchar,
	"description" text,
	"logo_url" varchar,
	"episode_count" smallint,
	"cancelled_text" text,
	"note" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" date DEFAULT CURRENT_DATE NOT NULL,
	"updated_at" date DEFAULT CURRENT_DATE NOT NULL,
	CONSTRAINT "check_day_of_week_range" CHECK ("schedule_slot"."day_of_week" BETWEEN 0 AND 6)
);
--> statement-breakpoint
CREATE TABLE "schedule_slot_platform" (
	"schedule_slot_id" uuid NOT NULL,
	"platform_id" uuid NOT NULL,
	CONSTRAINT "schedule_slot_platform_schedule_slot_id_platform_id_pk" PRIMARY KEY("schedule_slot_id","platform_id")
);
--> statement-breakpoint
ALTER TABLE "schedule_entry" ADD COLUMN "cancelled_text" text;--> statement-breakpoint
ALTER TABLE "schedule_entry" ADD COLUMN "is_cancelled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "schedule_entry_slot" ADD CONSTRAINT "schedule_entry_fk" FOREIGN KEY ("schedule_entry_id") REFERENCES "public"."schedule_entry"("schedule_entry_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_entry_slot" ADD CONSTRAINT "schedule_slot_fk" FOREIGN KEY ("schedule_slot_id") REFERENCES "public"."schedule_slot"("schedule_slot_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_slot" ADD CONSTRAINT "anime_season_fk" FOREIGN KEY ("anime_season_id") REFERENCES "public"."anime_season"("anime_season_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_slot_platform" ADD CONSTRAINT "schedule_slot_fk" FOREIGN KEY ("schedule_slot_id") REFERENCES "public"."schedule_slot"("schedule_slot_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_slot_platform" ADD CONSTRAINT "platform_fk" FOREIGN KEY ("platform_id") REFERENCES "public"."platform"("platform_id") ON DELETE no action ON UPDATE no action;