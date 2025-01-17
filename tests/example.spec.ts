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

// const fixtureTs = fs
//   .readdirSync(fixtureDir)
//   .filter((file) => file.endsWith(".ts"))
//   .map((file) => `${fixtureDir}/${file}`);
//
// const jsBuildResult = await Bun.build({
//   entrypoints: fixtureTs,
//   format: "iife",
//   target: "browser"
// });
//
// if (!jsBuildResult.success) {
//   console.error(jsBuildResult.logs);
//   throw new Error("Build failed");
// }

// const buildResults = [...mjsBuildResult.outputs, ...jsBuildResult.outputs];

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
  return page;
}

test("static", async () => {
  const page = await getPage();
  await page.goto("static.html");
  expect(page).toHaveTitle("Static");
  expect(await page.getByTestId("static").textContent()).toBe("Static");
  await page.close();
});

test("dynamic", async () => {
  const page = await getPage();
  await page.goto("dynamic.html");
  expect(await page.title()).toBe("Dynamic");
  expect(await page.getByTestId("dynamic").textContent()).toBe("Dynamic");
  await page.close();
});

test("increment", async () => {
  const page = await getPage();
  await page.goto("increment.html");
  expect(await page.title()).toBe("Increment");
  expect(await page.getByTestId("increment").textContent()).toBe("1");
  await page.close();
});

// test("increment 2", async () => {
//   const page = await getPage();
//   await page.goto("increment.html");
//   await page.reload();
//   expect(await page.getByTestId("increment").textContent()).toBe("2");
//   await page.close();
// });

afterAll(async () => {
  await browser.close();
});
