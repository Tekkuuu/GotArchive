ALTER TABLE "anime" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "anime_episode" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "anime_genre" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "anime_link" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "anime_season" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "anime_season_status" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "changelog" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "episode_link" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "genre" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "platform" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "schedule" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "schedule_anime_detail" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "schedule_anime_episode" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "schedule_entry" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER VIEW "public"."anime_season_status_view" SET (security_invoker = true);--> statement-breakpoint
CREATE POLICY "Enable CRUD for admin user" ON "anime" AS PERMISSIVE FOR ALL TO "authenticated" USING ((
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
CREATE POLICY "Enable select for any user" ON "anime" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Enable CRUD for admin user" ON "anime_episode" AS PERMISSIVE FOR ALL TO "authenticated" USING ((
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
CREATE POLICY "Enable select for any user" ON "anime_episode" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Enable CRUD for admin user" ON "anime_genre" AS PERMISSIVE FOR ALL TO "authenticated" USING ((
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
CREATE POLICY "Enable select for any user" ON "anime_genre" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Enable CRUD for admin user" ON "anime_link" AS PERMISSIVE FOR ALL TO "authenticated" USING ((
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
CREATE POLICY "Enable select for any user" ON "anime_link" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Enable CRUD for admin user" ON "anime_season" AS PERMISSIVE FOR ALL TO "authenticated" USING ((
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
CREATE POLICY "Enable select for any user" ON "anime_season" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Enable CRUD for admin user" ON "anime_season_status" AS PERMISSIVE FOR ALL TO "authenticated" USING ((
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
CREATE POLICY "Enable select for any user" ON "anime_season_status" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Enable CRUD for admin user" ON "changelog" AS PERMISSIVE FOR ALL TO "authenticated" USING ((
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
CREATE POLICY "Enable select for any user" ON "changelog" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Enable CRUD for admin user" ON "episode_link" AS PERMISSIVE FOR ALL TO "authenticated" USING ((
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
CREATE POLICY "Enable select for any user" ON "episode_link" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Enable CRUD for admin user" ON "genre" AS PERMISSIVE FOR ALL TO "authenticated" USING ((
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
CREATE POLICY "Enable select for any user" ON "genre" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Enable CRUD for admin user" ON "platform" AS PERMISSIVE FOR ALL TO "authenticated" USING ((
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
CREATE POLICY "Enable select for any user" ON "platform" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Enable CRUD for admin user" ON "schedule" AS PERMISSIVE FOR ALL TO "authenticated" USING ((
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
CREATE POLICY "Enable select for any user" ON "schedule" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Enable CRUD for admin user" ON "schedule_anime_detail" AS PERMISSIVE FOR ALL TO "authenticated" USING ((
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
CREATE POLICY "Enable select for any user" ON "schedule_anime_detail" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Enable CRUD for admin user" ON "schedule_anime_episode" AS PERMISSIVE FOR ALL TO "authenticated" USING ((
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
CREATE POLICY "Enable select for any user" ON "schedule_anime_episode" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Enable CRUD for admin user" ON "schedule_entry" AS PERMISSIVE FOR ALL TO "authenticated" USING ((
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
CREATE POLICY "Enable select for any user" ON "schedule_entry" AS PERMISSIVE FOR SELECT TO public USING (true);