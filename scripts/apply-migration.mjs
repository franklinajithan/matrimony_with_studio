import fs from "node:fs";
import path from "node:path";
import { Client } from "pg";

const root = path.resolve(import.meta.dirname, "..");
const file = process.argv[2] || "supabase/fixups/bootstrap-onboarding.sql";
const sql = fs.readFileSync(path.join(root, file), "utf8");

function readEnvFile(name) {
  const full = path.join(root, name);
  if (!fs.existsSync(full)) return "";
  return fs.readFileSync(full, "utf8");
}

const envFile = `${readEnvFile(".env.local")}\n${readEnvFile(".env")}`;
const databaseUrl = envFile
  .split(/\r?\n/)
  .map((line) => line.trim())
  .find((line) => line.startsWith("DATABASE_URL=") && !line.startsWith("DATABASE_URL=\n"))
  ?.slice("DATABASE_URL=".length)
  .trim()
  .replace(/^["']|["']$/g, "");

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is missing. Add it to .env (or .env.local), or paste supabase/fixups/bootstrap-onboarding.sql into the Supabase SQL Editor."
  );
}

const client = new Client({
  connectionString: databaseUrl.replace(/\?sslmode=[^&]+/, ""),
  ssl: { rejectUnauthorized: false },
});

await client.connect();
await client.query(sql);
await client.end();
console.log(`Applied ${file}`);
