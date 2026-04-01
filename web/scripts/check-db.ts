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
  const [{ now, current_database }] = await sql/* sql */`
    select now() as now, current_database() as current_database;
  `;

  const [{ user_count }] = await sql/* sql */`
    select count(*)::int as user_count from users;
  `;

  const [{ project_count }] = await sql/* sql */`
    select count(*)::int as project_count from projects;
  `;

  console.log(
    JSON.stringify(
      {
        connected: true,
        database: current_database,
        now,
        userCount: user_count,
        projectCount: project_count,
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

