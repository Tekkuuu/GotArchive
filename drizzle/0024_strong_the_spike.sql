ALTER TABLE "daily_users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "schedule_entry_platform" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "feedback" DROP COLUMN "anonymous_uuid";--> statement-breakpoint
CREATE POLICY "Enable CRUD for admin user" ON "daily_users" AS PERMISSIVE FOR ALL TO "authenticated" USING ((
    EXISTS (
      SELECT 1 FROM "users"
      WHERE "users"."supabase_id" = (select auth.uid()) AND "users"."role" = 'admin'
    )
  )) WITH CHECK ((
    EXISTS (
      SELECT 1 FROM "users"
      WHERE "users"."supabase_id" = (select auth.uid()) AND "users"."role" = 'admin'
    )
  ));--> statement-breakpoint
CREATE POLICY "Enable CRUD for admin user" ON "schedule_entry_platform" AS PERMISSIVE FOR ALL TO "authenticated" USING ((
    EXISTS (
      SELECT 1 FROM "users"
      WHERE "users"."supabase_id" = (select auth.uid()) AND "users"."role" = 'admin'
    )
  )) WITH CHECK ((
    EXISTS (
      SELECT 1 FROM "users"
      WHERE "users"."supabase_id" = (select auth.uid()) AND "users"."role" = 'admin'
    )
  ));