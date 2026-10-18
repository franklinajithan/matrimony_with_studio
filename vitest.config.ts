import { defineConfig } from "vitest/config";
import path from "node:path";
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "server-only": path.resolve(__dirname, "scripts/test-server-only.ts"),
    },
  },
  test: {
    environment: "node",
    include: [
      "src/lib/auth/*.test.ts",
      "src/lib/onboarding/*.test.ts",
      "src/lib/supabase/*.test.ts",
      "src/lib/subscriptions/provider.test.ts",
    ],
    maxWorkers: 1,
  },
});
