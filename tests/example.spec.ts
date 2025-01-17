import { afterAll, test } from "bun:test";
import * as fs from "node:fs";
import { type Page, chromium, expect } from "@playwright/test";

const srcDir = `${import.meta.dir}/../src`;
const fixtureDir = `${import.meta.dir}/fixtures`;

const srcFiles = fs.readdirSync(srcDir).map((file) => `${srcDir}/${file}`);

const fixtureMts = fs
  .readdirSync(fixtureDir)
  .filter((file) => file.endsWith(".mts"))
  .map((file) => `${fixtureDir}/${file}`);

const mjsBuildResult = await Bun.build({
  entrypoints: [...srcFiles, ...fixtureMts],
  target: "browser",
});

if (!mjsBuildResult.success) {
  console.error(mjsBuildResult.logs);
  throw new Error("Build failed");
}

const buildResults = mjsBuildResult.outputs;

const jsMap = new Map<string, string>();
for (const output of buildResults) {
  const path = output.path.split("/").pop();
  if (path === undefined) {
    throw new Error(`Absurd: ${output.path}`);
  }
  jsMap.set(`/${path}`, await output.text());
}

const browser = await chromium.launch({
  // headless: false,
});

async function getPage(): Promise<Page> {
  const page = await browser.newPage({ baseURL: "http://domain" });
  await page.route("**/*", (route, request) => {
    const urlPath = new URL(request.url()).pathname;
    const js = jsMap.get(urlPath);
    if (js) {
      return route.fulfill({
        body: js,
        contentType: "application/javascript",
      });
    }
    return route.fulfill({ path: `${fixtureDir}${urlPath}` });
  });
  // page.on("console", (msg) => console.log(`PAGE LOG: ${msg.text()}`));
  // page.on("pageerror", (error) => console.error(`PAGE ERROR: ${error}`));
  return page;
}

// async function logCache(page: Page): Promise<void> {
//   const value = await page.evaluate(() =>
//     sessionStorage.getItem("freeze-cache"),
//   );
//   const v = JSON.parse(value);
//   console.log(v);
// }

type Step = "gs" | "gd" | "gi" | "cs" | "cd" | "ci" | "back";

type Param = {
  steps: Step[];
  expected: string;
};

const params: Param[] = [
  { steps: ["gs"], expected: "Static" },
  { steps: ["gd"], expected: "Dynamic" },
  { steps: ["gi"], expected: "1" },
  { steps: ["gs", "gi"], expected: "1" },
  { steps: ["gs", "gi", "back", "gi"], expected: "1" },
];

for (const param of params) {
  const testName = param.steps.join("-");
  test(testName, async () => {
    const page = await getPage();
    await page.goto("increment.html");
    for (const step of param.steps) {
      if (step === "gs") {
        await page.goto("static.html");
      }
      if (step === "gd") {
        await page.goto("dynamic.html");
      }
      if (step === "gi") {
        await page.goto("increment.html");
      }
      if (step === "cs") {
        await page.getByText("Static").click();
      }
      if (step === "cd") {
        await page.getByText("Dynamic").click();
      }
      if (step === "ci") {
        await page.getByText("Increment").click();
      }
      if (step === "back") {
        await page.goBack();
      }
    }
    expect(await page.getByTestId("main").textContent()).toBe(param.expected);
  });
}

afterAll(async () => {
  await browser.close();
});
