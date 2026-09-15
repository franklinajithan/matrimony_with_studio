import fs from "node:fs";
import { spawnSync } from "node:child_process";

const env = Object.fromEntries(
  fs
    .readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index), line.slice(index + 1).trim().replace(/^["']|["']$/g, "")];
    })
);

const vars = {
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SITE_URL: "https://matrimony-with-studio.vercel.app",
};

for (const [name, value] of Object.entries(vars)) {
  if (!value) throw new Error(`Missing ${name}`);
  const result = spawnSync(
    "npx",
    ["vercel", "env", "add", name, "production,preview", "--value", value, "--yes", "--no-sensitive"],
    { encoding: "utf8", shell: true }
  );
  const output = `${result.stdout || ""}${result.stderr || ""}`.replaceAll(value, "[redacted]");
  const tail = output.trim().split(/\r?\n/).slice(-5).join(" | ");
  console.log(`${name} exit=${result.status} ${tail}`);
  if (result.status !== 0) process.exit(result.status || 1);
}

console.log("Vercel public env vars added for production and preview.");
