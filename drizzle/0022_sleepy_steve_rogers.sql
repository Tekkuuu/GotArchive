ALTER TABLE "schedule_entry_platform" DROP CONSTRAINT "schedule_entry_fk";
--> statement-breakpoint
ALTER TABLE "schedule_entry_platform" ADD CONSTRAINT "schedule_entry_fk" FOREIGN KEY ("schedule_entry_id") REFERENCES "public"."schedule_entry"("schedule_entry_id") ON DELETE cascade ON UPDATE no action;