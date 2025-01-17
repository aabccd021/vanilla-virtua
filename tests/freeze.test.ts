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

type Step = "gs" | "gd" | "gi" | "cs" | "cd" | "ci" | "gb" | "re";

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
  { expected: "2", steps: ["gs", "ci", "cd", "ci"] },
  { expected: "2", steps: ["gs", "ci", "gd", "ci"] },

  { expected: "2", steps: ["gi", "cs", "ci"] },
  { expected: "2", steps: ["gi", "gs", "ci"] },
  { expected: "2", steps: ["gi", "cd", "ci"] },
  { expected: "2", steps: ["gi", "gd", "ci"] },

  // should be 2?
  { expected: "1", steps: ["gi", "gb", "gi"] },
  { expected: "1", steps: ["gs", "ci", "re"] },

  { expected: "3", steps: ["gs", "ci", "cs", "ci", "cs", "ci"] },
  // { expected: "3", steps: ["gs", "ci", "cs", "ci", "gs", "ci"] },
  { expected: "3", steps: ["gs", "ci", "cs", "ci", "gb", "ci"] },
  { expected: "3", steps: ["gs", "ci", "cs", "ci", "cd", "ci"] },
  { expected: "3", steps: ["gs", "ci", "cs", "ci", "gd", "ci"] },

  { expected: "3", steps: ["gs", "ci", "gs", "ci", "cs", "ci"] },
  // { expected: "3", steps: ["gs", "ci", "gs", "ci", "gs", "ci"] },
  { expected: "3", steps: ["gs", "ci", "gs", "ci", "gb", "ci"] },
  { expected: "3", steps: ["gs", "ci", "gs", "ci", "cd", "ci"] },
  // { expected: "3", steps: ["gs", "ci", "gs", "ci", "gd", "ci"] },

  // { expected: "3", steps: ["gs", "ci", "gb", "ci", "cs", "ci"] },
  // { expected: "3", steps: ["gs", "ci", "gb", "ci", "gs", "ci"] },
  // { expected: "3", steps: ["gs", "ci", "gb", "ci", "gb", "ci"] },
  { expected: "3", steps: ["gs", "ci", "gb", "ci", "cd", "ci"] },
  // { expected: "3", steps: ["gs", "ci", "gb", "ci", "gd", "ci"] },

  // { expected: "3", steps: ["gs", "ci", "cd", "ci", "cs", "ci"] },
  // { expected: "3", steps: ["gs", "ci", "cd", "ci", "gs", "ci"] },
  // { expected: "3", steps: ["gs", "ci", "cd", "ci", "gb", "ci"] },
  { expected: "3", steps: ["gs", "ci", "cd", "ci", "cd", "ci"] },
  // { expected: "3", steps: ["gs", "ci", "cd", "ci", "gd", "ci"] },

  // { expected: "3", steps: ["gs", "ci", "gd", "ci", "gs", "ci"] },
  // { expected: "3", steps: ["gs", "ci", "gd", "ci", "gs", "ci"] },
  { expected: "3", steps: ["gs", "ci", "gd", "ci", "gb", "ci"] },
  { expected: "3", steps: ["gs", "ci", "gd", "ci", "cd", "ci"] },
  // { expected: "3", steps: ["gs", "ci", "gd", "ci", "gd", "ci"] },
];

for (const param of params) {
  const testName = param.steps.join("-");
  test(testName, async () => {
    const page = await getPage();
    for (const step of param.steps) {
      let path = "";
      if (step === "gs") {
        await page.goto("static.html");
        path = "static.html";
      } else if (step === "gd") {
        await page.goto("dynamic.html");
        path = "dynamic.html";
      } else if (step === "gi") {
        await page.goto("increment.html");
        path = "increment.html";
      } else if (step === "cs") {
        await page.getByText("Static").click();
        path = "static.html";
      } else if (step === "cd") {
        await page.getByText("Dynamic").click();
        path = "dynamic.html";
      } else if (step === "ci") {
        await page.getByText("Increment").click();
        path = "increment.html";
      } else if (step === "gb") {
        await page.goBack();
      } else if (step === "re") {
        await page.reload();
      } else {
        throw new Error(`Absurd: ${step}`);
      }
      if (path !== "") {
        await page.waitForURL(`http://domain/${path}`);
      }
      await page.waitForLoadState("load");
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
