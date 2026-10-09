CREATE SCHEMA "discord";
--> statement-breakpoint
CREATE TYPE "public"."typeDiscordMention" AS ENUM('none', 'everyone', 'role');--> statement-breakpoint
CREATE TABLE "discord"."schedule_message" (
	"schedule_message_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"schedule_id" uuid NOT NULL,
	"target_id" uuid NOT NULL,
	"message_id" text,
	"ping_message_id" text,
	"last_sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_schedule_target" UNIQUE("schedule_id","target_id")
);
--> statement-breakpoint
CREATE TABLE "discord"."target" (
	"target_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guild_id" text NOT NULL,
	"channel_id" text NOT NULL,
	"label" text NOT NULL,
	"time_zone" text DEFAULT 'Europe/London' NOT NULL,
	"mention_type" "typeDiscordMention" DEFAULT 'none' NOT NULL,
	"mention_role_id" text,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_discord_guild_channel" UNIQUE("guild_id","channel_id")
);
--> statement-breakpoint
ALTER TABLE "discord"."schedule_message" ADD CONSTRAINT "schedule_message_schedule_id_schedule_schedule_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."schedule"("schedule_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord"."schedule_message" ADD CONSTRAINT "schedule_message_target_id_target_target_id_fk" FOREIGN KEY ("target_id") REFERENCES "discord"."target"("target_id") ON DELETE cascade ON UPDATE no action;