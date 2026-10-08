ALTER TABLE "platform" ADD COLUMN "icon_svg" text;--> statement-breakpoint
ALTER TABLE "platform" ADD COLUMN "icon_color" varchar(7);--> statement-breakpoint
ALTER TABLE "platform" ADD CONSTRAINT "check_icon_color_format" CHECK ("platform"."icon_color" IS NULL OR "platform"."icon_color" ~ '^#[0-9a-fA-F]{6}$');