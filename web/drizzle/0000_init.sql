CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
 CREATE TYPE "project_generate_status" AS ENUM('idle', 'generating', 'done');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "project_task_status" AS ENUM('done', 'in_progress', 'blocked', 'not_started');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "clerk_user_id" text NOT NULL,
  "email" text,
  "name" text,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "users_clerk_user_id_idx" ON "users" ("clerk_user_id");

CREATE TABLE IF NOT EXISTS "billing_accounts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "stripe_customer_id" text,
  "stripe_subscription_id" text,
  "stripe_status" text,
  "plan_key" text,
  "paid_access" boolean DEFAULT false NOT NULL,
  "current_period_end" timestamptz,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "billing_accounts_user_id_idx" ON "billing_accounts" ("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "billing_accounts_stripe_customer_id_idx" ON "billing_accounts" ("stripe_customer_id");
CREATE UNIQUE INDEX IF NOT EXISTS "billing_accounts_stripe_subscription_id_idx" ON "billing_accounts" ("stripe_subscription_id");

CREATE TABLE IF NOT EXISTS "projects" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "name" text NOT NULL,
  "description" text DEFAULT '' NOT NULL,
  "roadmap_id" text NOT NULL,
  "generate_status" "project_generate_status" DEFAULT 'idle' NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "projects_user_updated_idx" ON "projects" ("user_id", "updated_at");

CREATE TABLE IF NOT EXISTS "project_lanes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "project_id" uuid NOT NULL REFERENCES "projects"("id") ON DELETE cascade,
  "source_lane_id" text,
  "label" text NOT NULL,
  "path" text,
  "position" integer DEFAULT 0 NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "project_lanes_project_position_idx" ON "project_lanes" ("project_id", "position");

CREATE TABLE IF NOT EXISTS "project_tasks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "project_lane_id" uuid NOT NULL REFERENCES "project_lanes"("id") ON DELETE cascade,
  "source_task_id" text,
  "task" text NOT NULL,
  "status" "project_task_status" DEFAULT 'not_started' NOT NULL,
  "notes" text DEFAULT '' NOT NULL,
  "content_path" text,
  "ai_output" text,
  "position" integer DEFAULT 0 NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "project_tasks_lane_position_idx" ON "project_tasks" ("project_lane_id", "position");

CREATE TABLE IF NOT EXISTS "stripe_webhook_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "stripe_event_id" text NOT NULL,
  "event_type" text NOT NULL,
  "processed_at" timestamptz DEFAULT now() NOT NULL,
  "payload" jsonb DEFAULT '{}'::jsonb NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "stripe_webhook_events_stripe_event_id_idx" ON "stripe_webhook_events" ("stripe_event_id");

