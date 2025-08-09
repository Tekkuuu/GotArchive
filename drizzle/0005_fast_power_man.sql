CREATE TABLE "feedback" (
	"feedback_id" serial PRIMARY KEY NOT NULL,
	"email" varchar(128),
	"text" varchar(1000) NOT NULL
);
