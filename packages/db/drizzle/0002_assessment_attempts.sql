CREATE TABLE "assessment_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lesson_id" uuid NOT NULL,
	"prompt" text NOT NULL,
	"kind" text DEFAULT 'multiple_choice' NOT NULL,
	"options" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"answer" text,
	"points" integer DEFAULT 1 NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessment_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"lesson_id" uuid NOT NULL,
	"answers" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"passed" boolean DEFAULT false NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "assessment_questions" ADD CONSTRAINT "assessment_questions_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
DO $$
DECLARE
  course_row record;
  assessment_module uuid;
  quiz_lesson uuid;
  practical_lesson uuid;
  exam_lesson uuid;
BEGIN
  FOR course_row IN SELECT id FROM courses WHERE published = true LOOP
    SELECT id INTO assessment_module FROM modules WHERE course_id = course_row.id AND title = 'Assessment & Capstone' LIMIT 1;
    IF assessment_module IS NULL THEN
      INSERT INTO modules (course_id, title, position) VALUES (course_row.id, 'Assessment & Capstone', 99) RETURNING id INTO assessment_module;
    END IF;
    SELECT id INTO quiz_lesson FROM lessons WHERE module_id = assessment_module AND type = 'quiz' LIMIT 1;
    IF quiz_lesson IS NULL THEN
      INSERT INTO lessons (module_id, title, type, content, position, duration_minutes) VALUES (assessment_module, 'Module quiz', 'quiz', 'Choose the best answer for each question.', 1, 15) RETURNING id INTO quiz_lesson;
      INSERT INTO assessment_questions (lesson_id, prompt, kind, options, answer, points, position) VALUES (quiz_lesson, 'Which practice best protects a web API?', 'multiple_choice', '["Input validation", "Hard-coded secrets", "Open database access", "Skipping authentication"]'::jsonb, 'Input validation', 1, 1);
    END IF;
    SELECT id INTO practical_lesson FROM lessons WHERE module_id = assessment_module AND type = 'practical' LIMIT 1;
    IF practical_lesson IS NULL THEN
      INSERT INTO lessons (module_id, title, type, content, position, duration_minutes) VALUES (assessment_module, 'Practical task', 'practical', 'Submit a short explanation or code solution demonstrating the skill from this course.', 2, 30) RETURNING id INTO practical_lesson;
      INSERT INTO assessment_questions (lesson_id, prompt, kind, options, answer, points, position) VALUES (practical_lesson, 'Describe or submit your practical solution.', 'practical', '[]'::jsonb, NULL, 1, 1);
    END IF;
    SELECT id INTO exam_lesson FROM lessons WHERE module_id = assessment_module AND type = 'exam' LIMIT 1;
    IF exam_lesson IS NULL THEN
      INSERT INTO lessons (module_id, title, type, content, position, duration_minutes) VALUES (assessment_module, 'Final exam', 'exam', 'Pass the final exam to complete this course.', 3, 20) RETURNING id INTO exam_lesson;
      INSERT INTO assessment_questions (lesson_id, prompt, kind, options, answer, points, position) VALUES (exam_lesson, 'What should a final project demonstrate?', 'multiple_choice', '["Only visual polish", "A working solution and clear reasoning", "Copied code without tests", "No documentation"]'::jsonb, 'A working solution and clear reasoning', 1, 1);
    END IF;
  END LOOP;
END $$;
