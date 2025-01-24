import { expect, test } from "@playwright/test";

test("Item 0 in viewport", async ({ page }) => {
  await page.goto("/page1.html");
  await expect(page.getByText("Item 0")).toBeInViewport();
});
