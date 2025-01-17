import { type Page, chromium, expect, test } from "@playwright/test";

const __dirname = new URL(".", import.meta.url).pathname;
const fixtureDir = `${__dirname}/fixtures`;

const browser = await chromium.launch();

async function getPage(): Promise<Page> {
  const page = await browser.newPage({
    baseURL: "http://domain",
  });
  await page.route("**/*", (route, request) => {
    const urlPath = new URL(request.url()).pathname;
    return route.fulfill({ path: `${fixtureDir}${urlPath}` });
  });
  return page;
}

const params: string[][] = [
  [
    "gs",
    "cd",
    "cs",
    "cd",
    "cs",
    "cd",
    "cs",
    "cd",
    "bs",
    "bd",
    "bs",
    "bd",
    "bs",
    "bd",
    "bs",
  ],

  ["gi_1", "cs", "bi_2"],

  ["gi_1", "cs", "ci_2", "bs", "bi_1"],

  [
    "gi_1",
    "cs",
    "ci_2",
    "cs",
    // "bi_1"
  ],

  // [
  // "gi_1",
  // "cs",
  // "ci_2",
  // "bs",
  // "ci_3",
  // "bs",
  // "bi_1"
  // ],

  ["gi_1", "cs", "ci_2", "cs", "ci_3", "cs", "bi_2"],

  [
    "gs",
    "cd",
    "ci_1",
    "cd",
    "ci_2",
    "cd",
    "ci_3",
    "cd",
    "ci_4",
    "bd",
    "bd",
    "bd",
  ],

  [
    "gs",
    "ci_1",
    "cs",
    "ci_2",
    "cs",
    "ci_3",
    "cs",
    "ci_4",
    // "bs",
    // "bi_1",
    // "bs",
    // "bi_1",
  ],

  ["gi_1"],
  ["gs", "ci_1"],

  ["gs", "ci_1", "cs", "ci_2"],
  ["gs", "ci_1", "gs", "ci_2"],
  ["gs", "ci_1", "bs"],
  ["gs", "ci_1", "cd", "ci_2"],
  ["gs", "ci_1", "gd", "ci_2"],

  ["gd", "ci_1", "cs", "ci_2"],
  ["gd", "ci_1", "gs", "ci_2"],
  ["gd", "ci_1", "bd"],
  ["gd", "ci_1", "cd", "ci_2"],
  ["gd", "ci_1", "gd", "ci_2"],

  ["gi_1", "cs", "ci_2"],
  ["gi_1", "gs", "ci_2"],
  ["gi_1", "cd", "ci_2"],
  ["gi_1", "gd", "ci_2"],

  ["gs", "ci_1", "gi_1"],
  ["gi_1", "gi_1"],

  ["gs", "ci_1", "cs", "ci_2", "cs", "ci_3", "gi_1"],
  ["gs", "ci_1", "cs", "ci_2", "gs", "ci_3", "gi_1"],
  // ["gs", "ci_1", "cs", "ci_2", "bs", "ci_3", "gi_1"],
  ["gs", "ci_1", "cs", "ci_2", "cd", "ci_3", "gi_1"],
  ["gs", "ci_1", "cs", "ci_2", "gd", "ci_3", "gi_1"],

  ["gs", "ci_1", "gs", "ci_2", "cs", "ci_3", "gi_1"],
  ["gs", "ci_1", "gs", "ci_2", "gs", "ci_3", "gi_1"],
  // ["gs", "ci_1", "gs", "ci_2", "bs", "ci_3", "gi_1"],
  ["gs", "ci_1", "gs", "ci_2", "cd", "ci_3", "gi_1"],
  ["gs", "ci_1", "gs", "ci_2", "gd", "ci_3", "gi_1"],

  // ["gs", "ci_1", "bs", "ci_2", "cs", "ci_3", "gi_1"],
  // ["gs", "ci_1", "bs", "ci_2", "gs", "ci_3", "gi_1"],
  // ["gs", "ci_1", "bs", "ci_2", "bs", "ci_3", "gi_1"],
  // ["gs", "ci_1", "bs", "ci_2", "cd", "ci_3", "gi_1"],
  // ["gs", "ci_1", "bs", "ci_2", "gd", "ci_3", "gi_1"],

  ["gs", "ci_1", "cd", "ci_2", "cs", "ci_3", "gi_1"],
  ["gs", "ci_1", "cd", "ci_2", "gs", "ci_3", "gi_1"],
  // ["gs", "ci_1", "cd", "ci_2", "bd", "ci_3", "gi_1"],
  ["gs", "ci_1", "cd", "ci_2", "cd", "ci_3", "gi_1"],
  ["gs", "ci_1", "cd", "ci_2", "gd", "ci_3", "gi_1"],

  ["gs", "ci_1", "gd", "ci_2", "cs", "ci_3", "gi_1"],
  ["gs", "ci_1", "gd", "ci_2", "gs", "ci_3", "gi_1"],
  // ["gs", "ci_1", "gd", "ci_2", "bd", "ci_3", "gi_1"],
  ["gs", "ci_1", "gd", "ci_2", "cd", "ci_3", "gi_1"],
  ["gs", "ci_1", "gd", "ci_2", "gd", "ci_3", "gi_1"],
];

async function handleStep(page: Page, step: string): Promise<void> {
  if (step.at(0) === "g") {
    if (step.at(1) === "s") {
      await page.goto("static.html");
      await expect(page.getByTestId("main")).toHaveText("Static");
      return;
    }
    if (step.at(1) === "d") {
      await page.goto("dynamic.html");
      await expect(page.getByTestId("main")).toHaveText("Dynamic");
      return;
    }
    if (step.at(1) === "i") {
      await page.goto("increment.html");
      await expect(page.getByTestId("main")).toHaveText(step.slice(3));
      return;
    }
  }
  if (step.at(0) === "c") {
    if (step.at(1) === "s") {
      await page.getByText("Static").click();
      await expect(page.getByTestId("main")).toHaveText("Static");
      return;
    }
    if (step.at(1) === "d") {
      await page.getByText("Dynamic").click();
      await expect(page.getByTestId("main")).toHaveText("Dynamic");
      return;
    }
    if (step.at(1) === "i") {
      await page.getByText("Increment").click();
      await expect(page.getByTestId("main")).toHaveText(step.slice(3));
      return;
    }
  }
  if (step.at(0) === "b") {
    await page.goBack();

    // I don't know why but this is the behavior in my browser
    try {
      await page.evaluate(() =>
        window.dispatchEvent(new CustomEvent("beforeunload")),
      );
      await page.evaluate(() =>
        window.dispatchEvent(new CustomEvent("pageshow")),
      );
    } catch {}

    if (step.at(1) === "s") {
      await expect(page.getByTestId("main")).toHaveText("Static");
      return;
    }
    if (step.at(1) === "d") {
      await expect(page.getByTestId("main")).toHaveText("Dynamic");
      return;
    }
    if (step.at(1) === "i") {
      await expect(page.getByTestId("main")).toHaveText(step.slice(3));
      return;
    }
  }

  throw new Error(`Unknown step: ${step}`);
}

for (const steps of params) {
  test(steps.join(" "), async () => {
    const page = await getPage();
    const errors: Error[] = [];
    page.on("pageerror", (error) => errors.push(error));
    const consoleMessages: string[] = [];
    page.on("console", (msg) => consoleMessages.push(msg.text()));
    for (const step of steps) {
      await handleStep(page, step);
      // console.log(step);
      // const value = await page.evaluate(() =>
      //   sessionStorage.getItem("freeze-cache"),
      // );
      // console.log(JSON.parse(value));
    }
    expect(errors).toHaveLength(0);
    expect(consoleMessages).toHaveLength(0);
    await page.close();
  });
}

test.afterAll(async () => {
  await browser.close();
});
