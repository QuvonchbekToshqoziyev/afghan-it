ALTER TABLE "courses" ADD COLUMN "access_tier" text DEFAULT 'free' NOT NULL;
--> statement-breakpoint
UPDATE courses SET access_tier = CASE WHEN slug IN ('frontend-development', 'english-beginner') THEN 'free' ELSE 'professional' END;
