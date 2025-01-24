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

type Log = {
  consoleMessages: string[];
  pageerrors: Error[];
};

const click = async (page: Page, log: Log, text: string): Promise<void> => {
  expect(log.consoleMessages).toEqual([]);
  await expect(page.getByText(text)).toBeInViewport();
  await page.getByText(text).click();
  expect(log.consoleMessages).toEqual([`Clicked on ${text}`]);
  log.consoleMessages.length = 0;
};

const initLog = (page: Page): Log => {
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
  const log = initLog(page);

  const scrollable = await getScrollable(page);
  const items = scrollable.getByRole("listitem");

  await expect(page).toHaveTitle("Page 1");
  await click(page, log, "Item 0");
  await expect(items.first()).toHaveText("Item 0");
  await expect(items.last()).toHaveText("Item 7");

  await scrollToBottom(scrollable);

  await expect(page).toHaveTitle("Page 1");
  await click(page, log, "Item 29");
  // await expect(items.first()).toHaveText("Item 22");
  await expect(items.last()).toHaveText("Item 29");

  await scrollTo(scrollable, 0);

  await expect(page).toHaveTitle("Page 1");
  await click(page, log, "Item 0");
  await expect(items.first()).toHaveText("Item 0");
  await expect(items.last()).toHaveText("Item 7");

  await scrollToBottom(scrollable);

  await expect(page).toHaveTitle("Page 1");
  await click(page, log, "Item 29");
  // await expect(items.first()).toHaveText("Item 22");
  await expect(items.last()).toHaveText("Item 29");

  await scrollTo(scrollable, 0);

  await expect(page).toHaveTitle("Page 1");
  await click(page, log, "Item 0");
  await expect(items.first()).toHaveText("Item 0");
  await expect(items.last()).toHaveText("Item 7");

  await scrollToBottom(scrollable);

  await expect(page).toHaveTitle("Page 1");
  await click(page, log, "Item 29");
  // await expect(items.first()).toHaveText("Item 22");
  await expect(items.last()).toHaveText("Item 29");

  await scrollTo(scrollable, 0);

  await expect(page).toHaveTitle("Page 1");
  await click(page, log, "Item 0");
  await expect(items.first()).toHaveText("Item 0");
  await expect(items.last()).toHaveText("Item 7");

  expect(log.consoleMessages).toEqual([]);
  expect(log.pageerrors).toEqual([]);
});

test("middle", async ({ page }) => {
  await page.goto("/page1.html");
  const log = initLog(page);

  const scrollable = await getScrollable(page);
  const items = scrollable.getByRole("listitem");

  await scrollTo(scrollable, 900);

  await expect(page).toHaveTitle("Page 1");
  await click(page, log, "Item 5");
  await click(page, log, "Item 6");
  await click(page, log, "Item 7");
  // await click(page, log, "Item 8");
  await expect(items.first()).toHaveText("Item 1");
  await expect(items.last()).toHaveText("Item 12");

  await page.getByText("Go to dynamic").click();
  await expect(page).toHaveTitle("Dynamic");

  await page.getByText("Go to page 1").click();

  await expect(page).toHaveTitle("Page 1");
  await click(page, log, "Item 5");
  await click(page, log, "Item 6");
  await click(page, log, "Item 7");
  // await click(page, log, "Item 8");
  await expect(items.first()).toHaveText("Item 1");
  await expect(items.last()).toHaveText("Item 12");

  await scrollToBottom(scrollable);

  await expect(page).toHaveTitle("Page 1");
  await click(page, log, "Item 29");
  // await expect(items.first()).toHaveText("Item 22");
  await expect(items.last()).toHaveText("Item 29");

  expect(log.consoleMessages).toEqual([]);
  expect(log.pageerrors).toEqual([]);
});

test("btm", async ({ page }) => {
  await page.goto("/page1.html");
  const log = initLog(page);

  const scrollable = await getScrollable(page);
  const items = scrollable.getByRole("listitem");
  await scrollToBottom(scrollable);

  await expect(page).toHaveTitle("Page 1");
  await click(page, log, "Item 29");
  // await expect(items.first()).toHaveText("Item 22");
  await expect(items.last()).toHaveText("Item 29");

  await page.getByText("Go to dynamic").click();
  await expect(page).toHaveTitle("Dynamic");

  await page.getByText("Go to page 1").click();

  await expect(page).toHaveTitle("Page 1");
  await click(page, log, "Item 29");
  // await expect(items.first()).toHaveText("Item 21");
  await expect(items.last()).toHaveText("Item 29");

  expect(log.consoleMessages).toEqual([]);
  expect(log.pageerrors).toEqual([]);
});

test("back and forth", async ({ page }) => {
  await page.goto("/page1.html");
  const log = initLog(page);

  const scrollable = await getScrollable(page);
  const items = scrollable.getByRole("listitem");

  await expect(page).toHaveTitle("Page 1");
  await click(page, log, "Item 0");
  await expect(items.first()).toHaveText("Item 0");
  await expect(items.last()).toHaveText("Item 7");

  await page.getByText("Go to dynamic").click();
  await expect(page).toHaveTitle("Dynamic");

  await page.getByText("Go to page 1").click();
  await expect(page).toHaveTitle("Page 1");
  await click(page, log, "Item 0");
  await expect(items.first()).toHaveText("Item 0");
  await expect(items.last()).toHaveText("Item 7");

  await page.getByText("Go to dynamic").click();
  await expect(page).toHaveTitle("Dynamic");

  await page.getByText("Go to page 1").click();
  await expect(page).toHaveTitle("Page 1");
  await click(page, log, "Item 0");
  await expect(items.first()).toHaveText("Item 0");
  await expect(items.last()).toHaveText("Item 7");

  await page.getByText("Go to dynamic").click();
  await expect(page).toHaveTitle("Dynamic");

  await page.getByText("Go to page 1").click();
  await expect(page).toHaveTitle("Page 1");
  await click(page, log, "Item 0");
  await expect(items.first()).toHaveText("Item 0");
  await expect(items.last()).toHaveText("Item 7");

  await page.getByText("Go to dynamic").click();
  await expect(page).toHaveTitle("Dynamic");

  await page.getByText("Go to page 1").click();
  await expect(page).toHaveTitle("Page 1");
  await click(page, log, "Item 0");
  await expect(items.first()).toHaveText("Item 0");
  await expect(items.last()).toHaveText("Item 7");

  await page.getByText("Go to dynamic").click();
  await expect(page).toHaveTitle("Dynamic");

  await page.getByText("Go to page 1").click();
  await expect(page).toHaveTitle("Page 1");
  await click(page, log, "Item 0");
  await expect(items.first()).toHaveText("Item 0");
  await expect(items.last()).toHaveText("Item 7");

  await page.getByText("Go to dynamic").click();
  await expect(page).toHaveTitle("Dynamic");

  await page.getByText("Go to page 1").click();
  await expect(page).toHaveTitle("Page 1");
  await click(page, log, "Item 0");
  await expect(items.first()).toHaveText("Item 0");
  await expect(items.last()).toHaveText("Item 7");

  expect(log.consoleMessages).toEqual([]);
  expect(log.pageerrors).toEqual([]);
});
