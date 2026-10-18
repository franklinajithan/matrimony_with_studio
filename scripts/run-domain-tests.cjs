const fs = require("node:fs"),
  path = require("node:path"),
  { spawnSync } = require("node:child_process");
const directory = path.join(__dirname, "../src/lib/subscriptions");
// This one server-module test runs in Vitest, which supplies the server-only marker.
const files = fs
  .readdirSync(directory)
  .filter((f) => f.endsWith(".test.ts") && f !== "provider.test.ts")
  .map((f) => path.join(directory, f));
const result = spawnSync(
  process.execPath,
  ["--import", "tsx", "--test", ...files],
  { stdio: "inherit" },
);
process.exitCode = result.status ?? 1;
