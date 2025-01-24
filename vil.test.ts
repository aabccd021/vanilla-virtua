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

const scrollTo = (scrollable: Locator, offset: number): Promise<void> => {
  return scrollable.evaluate((e, offset) => {
    e.scrollTop = offset;
  }, offset);
};

type Logs = {
  consoleMessages: readonly string[];
  pageerrors: readonly Error[];
};

const initLogs = (page: Page): Logs => {
  const consoleMessages: string[] = [];
  const pageerrors: Error[] = [];

  page.on("console", (msg) => consoleMessages.push(msg.text()));
  page.on("pageerror", (msg) => pageerrors.push(msg));

  return {
    consoleMessages,
    pageerrors,
  };
};

test("bottom top", async ({ page }) => {
  await page.goto("/page1.html");
  const log1 = initLogs(page);

  const scrollable = await getScrollable(page);
  const items = scrollable.getByRole("listitem");

  // await expect(page).toHaveTitle("Page 1");
  // await expect(page.getByText("Item 0")).toBeInViewport();
  // await expect(items.first()).toHaveText("Item 0");
  // await expect(items.last()).toHaveText("Item 7");
  //
  await scrollToBottom(scrollable);

  await expect(page).toHaveTitle("Page 1");
  await expect(page.getByText("Item 29")).toBeInViewport();
  await expect(items.first()).toHaveText("Item 22");
  await expect(items.last()).toHaveText("Item 29");

  await scrollTo(scrollable, 0);

  await expect(page).toHaveTitle("Page 1");
  await expect(page.getByText("Item 0")).toBeInViewport();
  await expect(items.first()).toHaveText("Item 0");
  await expect(items.last()).toHaveText("Item 7");

  expect(log1.consoleMessages).toEqual([]);
  expect(log1.pageerrors).toEqual([]);
});

test("middle", async ({ page }) => {
  await page.goto("/page1.html");
  const log1 = initLogs(page);

  const scrollable = await getScrollable(page);
  const items = scrollable.getByRole("listitem");

  await scrollTo(scrollable, 900);

  await expect(page).toHaveTitle("Page 1");
  await expect(page.getByText("Item 5")).toBeInViewport();
  await expect(page.getByText("Item 6")).toBeInViewport();
  await expect(page.getByText("Item 7")).toBeInViewport();
  await expect(page.getByText("Item 8")).toBeInViewport();
  await expect(items.first()).toHaveText("Item 1");
  await expect(items.last()).toHaveText("Item 12");

  expect(log1.consoleMessages).toEqual([]);
  expect(log1.pageerrors).toEqual([]);

  await page.getByText("Go to lorem").click();
  const log2 = initLogs(page);
  await expect(page).toHaveTitle("Lorem");
  expect(log2.consoleMessages).toEqual([]);
  expect(log2.pageerrors).toEqual([]);

  await page.getByText("Go to page 1").click();
  const log3 = initLogs(page);

  await expect(page).toHaveTitle("Page 1");
  await expect(page.getByText("Item 5")).toBeInViewport();
  await expect(page.getByText("Item 6")).toBeInViewport();
  await expect(page.getByText("Item 7")).toBeInViewport();
  await expect(page.getByText("Item 8")).toBeInViewport();
  await expect(items.first()).toHaveText("Item 1");
  await expect(items.last()).toHaveText("Item 12");

  await scrollToBottom(scrollable);

  await expect(page).toHaveTitle("Page 1");
  await expect(page.getByText("Item 29")).toBeInViewport();
  await expect(items.first()).toHaveText("Item 22");
  await expect(items.last()).toHaveText("Item 29");

  expect(log3.consoleMessages).toEqual([]);
  expect(log3.pageerrors).toEqual([]);
});

test("btm", async ({ page }) => {
  await page.goto("/page1.html");
  const log1 = initLogs(page);

  const scrollable = await getScrollable(page);
  const items = scrollable.getByRole("listitem");
  await scrollToBottom(scrollable);

  await expect(page).toHaveTitle("Page 1");
  await expect(page.getByText("Item 29")).toBeInViewport();
  await expect(items.first()).toHaveText("Item 22");
  await expect(items.last()).toHaveText("Item 29");

  expect(log1.consoleMessages).toEqual([]);
  expect(log1.pageerrors).toEqual([]);

  await page.getByText("Go to lorem").click();
  const log2 = initLogs(page);
  await expect(page).toHaveTitle("Lorem");
  expect(log2.consoleMessages).toEqual([]);
  expect(log2.pageerrors).toEqual([]);

  await page.getByText("Go to page 1").click();
  const log3 = initLogs(page);

  await expect(page).toHaveTitle("Page 1");
  await expect(page.getByText("Item 29")).toBeInViewport();
  await expect(items.first()).toHaveText("Item 21");
  await expect(items.last()).toHaveText("Item 29");

  expect(log3.consoleMessages).toEqual([]);
  expect(log3.pageerrors).toEqual([]);
});
