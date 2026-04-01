import { config as loadEnv } from "dotenv";
import type { Config } from "drizzle-kit";

loadEnv({ path: ".env.local" });
loadEnv();

const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;

if (!url) {
  throw new Error("Missing DATABASE_URL (or POSTGRES_URL) for Drizzle config");
}

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url,
  },
  verbose: true,
  strict: true,
} satisfies Config;
