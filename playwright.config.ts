import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/ui",
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  use: { baseURL: "http://localhost:3001", headless: true },
  webServer: [
    {
      command: "node tests/fixture-server.mjs",
      url: "http://127.0.0.1:54329/health",
      reuseExistingServer: false,
    },
    {
      command: "npm run dev -- --hostname 127.0.0.1 --port 3001",
      url: "http://127.0.0.1:3001",
      timeout: 120000,
      reuseExistingServer: false,
      env: {
        NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54329",
        SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
        ADMIN_MPIN: "1234",
        SESSION_SECRET: "ui-test-session-secret-at-least-32-characters",
      },
    },
  ],
});
