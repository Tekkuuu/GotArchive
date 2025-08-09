CREATE TABLE "users" (
	"user_id" serial PRIMARY KEY NOT NULL,
	"email" varchar(320) NOT NULL,
	"supabase_id" uuid NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_supabase_id_unique" UNIQUE("supabase_id")
);
