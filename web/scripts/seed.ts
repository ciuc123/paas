import "dotenv/config";

import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("Missing DATABASE_URL in environment");
}

const sql = postgres(databaseUrl, {
  max: 1,
  prepare: false,
  ssl: databaseUrl.includes("sslmode=disable") ? false : "require",
});

async function main() {
  const [user] = await sql/* sql */`
    insert into users (clerk_user_id, email, name)
    values ('user_seed_coach', 'coach@example.com', 'Sample Coach')
    on conflict (clerk_user_id)
    do update set
      email = excluded.email,
      name = excluded.name,
      updated_at = now()
    returning id;
  `;

  const userId = user.id as string;

  await sql/* sql */`
    insert into billing_accounts (
      user_id,
      stripe_customer_id,
      stripe_subscription_id,
      stripe_status,
      plan_key,
      paid_access,
      current_period_end,
      metadata
    )
    values (
      ${userId},
      'cus_seed_123',
      'sub_seed_123',
      'active',
      'pro',
      true,
      now() + interval '30 days',
      '{"source":"seed"}'::jsonb
    )
    on conflict (user_id)
    do update set
      stripe_customer_id = excluded.stripe_customer_id,
      stripe_subscription_id = excluded.stripe_subscription_id,
      stripe_status = excluded.stripe_status,
      plan_key = excluded.plan_key,
      paid_access = excluded.paid_access,
      current_period_end = excluded.current_period_end,
      metadata = excluded.metadata,
      updated_at = now();
  `;

  const [project] = await sql/* sql */`
    insert into projects (user_id, name, description, roadmap_id, generate_status)
    values (
      ${userId},
      'Coach Intake Funnel',
      'A sample MVP funnel project seeded for local testing.',
      'default-roadmap',
      'done'
    )
    returning id;
  `;

  const projectId = project.id as string;

  await sql/* sql */`delete from project_tasks where project_lane_id in (select id from project_lanes where project_id = ${projectId});`;
  await sql/* sql */`delete from project_lanes where project_id = ${projectId};`;

  const [laneOne] = await sql/* sql */`
    insert into project_lanes (project_id, source_lane_id, label, path, position)
    values (${projectId}, 'offer-design', 'Offer Design', '/roadmap/content', 0)
    returning id;
  `;

  const [laneTwo] = await sql/* sql */`
    insert into project_lanes (project_id, source_lane_id, label, path, position)
    values (${projectId}, 'launch-readiness', 'Launch Readiness', '/roadmap', 1)
    returning id;
  `;

  await sql/* sql */`
    insert into project_tasks (project_lane_id, source_task_id, task, status, notes, content_path, ai_output, position)
    values
      (${laneOne.id as string}, 'task-1', 'Clarify the intake questionnaire', 'done', 'Keep it simple for coaches.', '/roadmap/content', 'Start with 5 must-have questions and one success metric.', 0),
      (${laneOne.id as string}, 'task-2', 'Draft onboarding copy', 'in_progress', 'Focus on trust and clarity.', '/roadmap/content', 'Explain the first session, expected outcomes, and time commitment.', 1),
      (${laneTwo.id as string}, 'task-3', 'Prepare pilot launch checklist', 'not_started', 'Use this for local smoke tests.', '/roadmap', null, 0),
      (${laneTwo.id as string}, 'task-4', 'Review Stripe upgrade flow', 'blocked', 'Waiting on final pricing copy.', '/upgrade', 'Confirm the paid gate message matches the selected plan.', 1);
  `;

  const [{ project_count: projectCount }] = await sql/* sql */`
    select count(*)::int as project_count from projects where user_id = ${userId};
  `;

  console.log(
    JSON.stringify(
      {
        seeded: true,
        userId,
        projectId,
        projectCount,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sql.end();
  });

