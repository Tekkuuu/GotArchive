ALTER TABLE "feedback" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "Enable insert for any user" ON "feedback" AS PERMISSIVE FOR INSERT TO public;