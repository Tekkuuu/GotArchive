ALTER TABLE "schedule_misc_detail" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "Enable CRUD for admin user" ON "schedule_misc_detail" AS PERMISSIVE FOR ALL TO "authenticated" USING ((
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
CREATE POLICY "Enable select for any user" ON "schedule_misc_detail" AS PERMISSIVE FOR SELECT TO public USING (true);