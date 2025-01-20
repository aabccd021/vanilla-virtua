import { expect, test } from "@playwright/test";

test("list one", async ({ page }) => {
  await page.goto("/list-one.html");
  await expect(page).toHaveTitle("List One");
});
