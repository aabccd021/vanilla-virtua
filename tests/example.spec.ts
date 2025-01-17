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

type Step = "gs" | "gd" | "gi" | "cs" | "cd" | "ci" | "gb";

type Param = {
  steps: Step[];
  expected: string;
};

const params: Param[] = [
  { expected: "Static", steps: ["gs"] },
  { expected: "Dynamic", steps: ["gd"] },
  { expected: "1", steps: ["gi"] },
  { expected: "1", steps: ["gs", "ci"] },
  { expected: "2", steps: ["gs", "ci", "cs", "ci"] },
  { expected: "2", steps: ["gs", "ci", "gs", "ci"] },
  { expected: "2", steps: ["gs", "ci", "gb", "ci"] },
];

for (const param of params) {
  const testName = param.steps.join("-");
  test(testName, async () => {
    const page = await getPage();
    for (const step of param.steps) {
      if (step === "gs") {
        await page.goto("static.html");
      } else if (step === "gd") {
        await page.goto("dynamic.html");
      } else if (step === "gi") {
        await page.goto("increment.html");
      } else if (step === "cs") {
        await page.getByText("Static").click();
      } else if (step === "cd") {
        await page.getByText("Dynamic").click();
      } else if (step === "ci") {
        await page.getByText("Increment").click();
      } else if (step === "gb") {
        await page.goBack();
      } else {
        throw new Error(`Absurd: ${step}`);
      }
      await page.waitForLoadState("networkidle");
      // console.log(step);
      // const value = await page.evaluate(() =>
      //   sessionStorage.getItem("freeze-cache"),
      // );
      // console.log(JSON.parse(value));
    }
    expect(await page.getByTestId("main").textContent()).toBe(param.expected);
    await page.close();
  });
}

afterAll(async () => {
  await browser.close();
});
