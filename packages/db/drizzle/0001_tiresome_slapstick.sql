ALTER TABLE "courses" ALTER COLUMN "language" SET DEFAULT 'en';--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "preferred_locale" SET DEFAULT 'en';--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "translations" jsonb DEFAULT '{}'::jsonb NOT NULL;