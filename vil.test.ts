import { expect, test } from "@playwright/test";

test("list one", async ({ page }) => {
  await page.goto("/page1.html");
  await expect(page).toHaveTitle("Page 1");
});
