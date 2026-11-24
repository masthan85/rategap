import { test, expect } from "@playwright/test";

// Seed for the Playwright test agents: each generated test starts from here.
test.describe("Test group", () => {
  test("seed", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Rategap/);
  });
});
