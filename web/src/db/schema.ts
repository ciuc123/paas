import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const projectGenerateStatusEnum = pgEnum("project_generate_status", [
  "idle",
  "generating",
  "done",
]);

export const projectTaskStatusEnum = pgEnum("project_task_status", [
  "done",
  "in_progress",
  "blocked",
  "not_started",
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clerkUserId: text("clerk_user_id").notNull(),
    email: text("email"),
    name: text("name"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    clerkUserIdIdx: uniqueIndex("users_clerk_user_id_idx").on(table.clerkUserId),
  }),
);

export const billingAccounts = pgTable(
  "billing_accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    stripeCustomerId: text("stripe_customer_id"),
    stripeSubscriptionId: text("stripe_subscription_id"),
    stripeStatus: text("stripe_status"),
    planKey: text("plan_key"),
    paidAccess: boolean("paid_access").default(false).notNull(),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: uniqueIndex("billing_accounts_user_id_idx").on(table.userId),
    stripeCustomerIdIdx: uniqueIndex("billing_accounts_stripe_customer_id_idx").on(
      table.stripeCustomerId,
    ),
    stripeSubscriptionIdIdx: uniqueIndex(
      "billing_accounts_stripe_subscription_id_idx",
    ).on(table.stripeSubscriptionId),
  }),
);

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    roadmapId: text("roadmap_id").notNull(),
    generateStatus: projectGenerateStatusEnum("generate_status")
      .default("idle")
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userUpdatedIdx: index("projects_user_updated_idx").on(table.userId, table.updatedAt),
  }),
);

export const projectLanes = pgTable(
  "project_lanes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    sourceLaneId: text("source_lane_id"),
    label: text("label").notNull(),
    path: text("path"),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    projectPositionIdx: uniqueIndex("project_lanes_project_position_idx").on(
      table.projectId,
      table.position,
    ),
  }),
);

export const projectTasks = pgTable(
  "project_tasks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectLaneId: uuid("project_lane_id")
      .notNull()
      .references(() => projectLanes.id, { onDelete: "cascade" }),
    sourceTaskId: text("source_task_id"),
    task: text("task").notNull(),
    status: projectTaskStatusEnum("status").default("not_started").notNull(),
    notes: text("notes").notNull().default(""),
    contentPath: text("content_path"),
    aiOutput: text("ai_output"),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    lanePositionIdx: uniqueIndex("project_tasks_lane_position_idx").on(
      table.projectLaneId,
      table.position,
    ),
  }),
);

export const stripeWebhookEvents = pgTable(
  "stripe_webhook_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    stripeEventId: text("stripe_event_id").notNull(),
    eventType: text("event_type").notNull(),
    processedAt: timestamp("processed_at", { withTimezone: true }).defaultNow().notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().default({}).notNull(),
  },
  (table) => ({
    stripeEventIdIdx: uniqueIndex("stripe_webhook_events_stripe_event_id_idx").on(
      table.stripeEventId,
    ),
  }),
);

