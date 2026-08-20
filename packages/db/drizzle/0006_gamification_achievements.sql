CREATE TABLE "achievements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"badge" text NOT NULL,
	"xp" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_achievements" (
	"user_id" uuid NOT NULL,
	"achievement_id" uuid NOT NULL,
	"earned_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_achievements_user_id_achievement_id_pk" PRIMARY KEY("user_id","achievement_id")
);
--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievement_id_achievements_id_fk" FOREIGN KEY ("achievement_id") REFERENCES "public"."achievements"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "achievements_slug_idx" ON "achievements" USING btree ("slug");
--> statement-breakpoint
INSERT INTO achievements (slug, name, description, badge, xp) VALUES
  ('first-course', 'First Steps', 'Completed your first course.', '🎓', 100),
  ('assessment-master', 'Assessment Master', 'Passed a quiz, practical, and final exam.', '🏆', 50),
  ('streak-starter', 'Streak Starter', 'Started your learning journey.', '🔥', 10)
ON CONFLICT (slug) DO NOTHING;
