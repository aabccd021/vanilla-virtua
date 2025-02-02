import { type Page, expect, test } from "@playwright/test";

type Log = {
  consoleMessages: string[];
  pageerrors: Error[];
};

const initLog = (page: Page): Log => {
  const consoleMessages: string[] = [];
  const pageerrors: Error[] = [];

  page.on("console", (msg) => consoleMessages.push(msg.text()));
  page.on("pageerror", (msg) => pageerrors.push(msg));

  return { consoleMessages, pageerrors };
};

function itemText(i: number): string {
  return `Item ${String(i).padStart(2, "0")}`;
}

async function expectRange(
  page: Page,
  first: number,
  firstVisible: number,
  lastVisible: number,
  last: number,
): Promise<void> {
  await expect(page.locator(".item").first()).toHaveText(itemText(first));
  await expect(page.locator(".item").last()).toHaveText(itemText(last));

  for (let i = 0; i < firstVisible; i++) {
    await expect(page.getByText(itemText(i))).not.toBeInViewport();
  }
  for (let i = firstVisible; i <= lastVisible; i++) {
    await expect(page.getByText(itemText(i))).toBeInViewport();
  }
  for (let i = lastVisible + 1; i <= 29; i++) {
    await expect(page.getByText(itemText(i))).not.toBeInViewport();
  }
}

const scroll = async (page: Page, pixels: number): Promise<void> => {
  const scrollDeltaAbs = 100;
  const scrollDelta = pixels > 0 ? scrollDeltaAbs : -scrollDeltaAbs;
  const iteration = pixels / scrollDelta;
  if (!Number.isInteger(iteration)) {
    throw new Error(`pixels must be a multiple of ${scrollDelta}`);
  }
  for (let i = 0; i < iteration; i++) {
    await page.mouse.wheel(0, scrollDelta);
  }
};

const expectPageErrorsEmpty = (log: Log): void => {
  const pageErrors = log.pageerrors.filter(
    (err) => err.message !== "ResizeObserver loop completed with undelivered notifications.",
  );
  expect(pageErrors).toEqual([]);
};

test("full scroll", async ({ page }) => {
  await page.goto("/basic.html");
  const log = initLog(page);

  for (let i = 0; i < 3; i++) {
    await expectRange(page, 0, 0, 3, 7);
    await scroll(page, 5200);

    await expectRange(page, 21, 25, 29, 29);
    await scroll(page, -5200);
  }

  expect(log.consoleMessages).toEqual([]);
  expectPageErrorsEmpty(log);
});

test("scroll 200", async ({ page }) => {
  await page.goto("/basic.html");
  const log = initLog(page);

  await scroll(page, 200);
  await expectRange(page, 0, 0, 4, 8);

  await scroll(page, 5100);
  await expectRange(page, 22, 26, 29, 29);

  expect(log.consoleMessages).toEqual([]);
  expectPageErrorsEmpty(log);
});

test("scroll 1000", async ({ page }) => {
  await page.goto("/basic.html");
  const log = initLog(page);

  await scroll(page, 1000);
  await expectRange(page, 1, 5, 8, 12);

  await scroll(page, 5100);
  await expectRange(page, 22, 26, 29, 29);

  expect(log.consoleMessages).toEqual([]);
  expectPageErrorsEmpty(log);
});

test("reload resets", async ({ page }) => {
  await page.goto("/basic.html");
  const log = initLog(page);

  await scroll(page, 5100);
  await expectRange(page, 21, 25, 29, 29);

  await page.reload();
  await expectRange(page, 0, 0, 3, 7);

  expect(log.consoleMessages).toEqual([]);
  expectPageErrorsEmpty(log);
});
