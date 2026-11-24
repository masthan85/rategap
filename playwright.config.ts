import { defineConfig, devices } from "@playwright/test";

// End-to-end tests. Unit tests run under Vitest (`bun run test`).
export default defineConfig({
  testDir: ".",
  testMatch: ["seed.spec.ts", "tests/**/*.spec.ts"],
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: "http://localhost:5173",
    trace: "off",
  },
  webServer: {
    command: "bun run dev",
    url: "http://localhost:5173",
    reuseExistingServer: true,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
