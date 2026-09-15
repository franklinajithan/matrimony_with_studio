import fs from "fs";
import pg from "pg";

const env = Object.fromEntries(
  fs
    .readFileSync(".env", "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    })
);

const sql = fs.readFileSync("supabase/fixups/create-biodata-studio.sql", "utf8");
const client = new pg.Client({
  connectionString: env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

await client.connect();
try {
  await client.query(sql);
  const r = await client.query(
    "select tablename from pg_tables where schemaname='public' and tablename like 'biodata%'"
  );
  console.log(
    "OK tables:",
    r.rows.map((x) => x.tablename).join(", ")
  );
} catch (e) {
  console.error("FAIL", e instanceof Error ? e.message : e);
  process.exitCode = 1;
} finally {
  await client.end();
}
