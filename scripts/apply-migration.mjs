import fs from "node:fs";
import path from "node:path";
import { Client } from "pg";

const root = path.resolve(import.meta.dirname, "..");
const file = process.argv[2] || "supabase/migrations/20260915_phase2a_auth_onboarding.sql";
const sql = fs.readFileSync(path.join(root, file), "utf8");
const envFile = fs.readFileSync(path.join(root, ".env.local"), "utf8");
const databaseUrl = envFile
  .split(/\r?\n/)
  .find((line) => line.startsWith("DATABASE_URL="))
  ?.slice("DATABASE_URL=".length)
  .trim();

if (!databaseUrl) {
  throw new Error("DATABASE_URL is missing from .env.local");
}

const client = new Client({
  connectionString: databaseUrl.replace(/\?sslmode=[^&]+/, ""),
  ssl: { rejectUnauthorized: false },
});

await client.connect();
await client.query(sql);
await client.end();
console.log(`Applied ${file}`);
