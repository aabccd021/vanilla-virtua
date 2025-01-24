import { type Locator, type Page, expect, test } from "@playwright/test";

const getScrollable = async (page: Page): Promise<Locator> => {
  const locator = page.locator(
    '*[style*="overflow-y: auto"],*[style*="overflow-y:auto"],*[style*="overflow-x: auto"],*[style*="overflow-x:auto"],*[style*="overflow: auto"],*[style*="overflow:auto"]',
  );
  await locator.waitFor();
  return locator;
};

const scrollToBottom = (scrollable: Locator): Promise<void> => {
  return scrollable.evaluate((e) => {
    return new Promise<void>((resolve) => {
      let timer: ReturnType<typeof setTimeout> | null = null;

      const onScroll = (): void => {
        e.scrollTop = e.scrollHeight;

        if (timer !== null) {
          clearTimeout(timer);
        }
        timer = setTimeout(() => {
          if (e.scrollTop + (e as HTMLElement).offsetHeight >= e.scrollHeight) {
            e.removeEventListener("scroll", onScroll);
            resolve();
          } else {
            onScroll();
          }
        }, 50);
      };
      e.addEventListener("scroll", onScroll);

      onScroll();
    });
  });
};

test("Item 0 shown", async ({ page }) => {
  await page.goto("/page1.html");
  await expect(page.getByText("Item 0")).toBeInViewport();
});

test("Item 29 shown after scroll", async ({ page }) => {
  await page.goto("/page1.html");
  const scrollable = await getScrollable(page);
  await scrollToBottom(scrollable);
  await expect(page.getByText("Item 29")).toBeInViewport();
});
