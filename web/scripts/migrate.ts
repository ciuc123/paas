import "dotenv/config";

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

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

async function ensureMigrationsTable() {
  await sql/* sql */`
    create table if not exists schema_migrations (
      id text primary key,
      run_at timestamptz not null default now()
    );
  `;
}

async function getMigrationFiles() {
  const migrationsDir = path.join(process.cwd(), "drizzle");
  const files = await readdir(migrationsDir);
  return files.filter((file) => file.endsWith(".sql")).sort();
}

async function runMigration(fileName: string) {
  const [alreadyRun] = await sql/* sql */`
    select id from schema_migrations where id = ${fileName} limit 1;
  `;

  if (alreadyRun) {
    return { fileName, status: "skipped" as const };
  }

  const filePath = path.join(process.cwd(), "drizzle", fileName);
  const migrationSql = await readFile(filePath, "utf8");

  await sql.begin(async (tx) => {
    await tx.unsafe(migrationSql);
    await tx/* sql */`
      insert into schema_migrations (id) values (${fileName});
    `;
  });

  return { fileName, status: "applied" as const };
}

async function main() {
  await ensureMigrationsTable();

  const files = await getMigrationFiles();
  const results = [] as Array<{ fileName: string; status: "applied" | "skipped" }>;

  for (const fileName of files) {
    results.push(await runMigration(fileName));
  }

  console.log(JSON.stringify({ migrated: true, results }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sql.end();
  });

