import { afterAll, test } from "bun:test";
import * as fs from "node:fs";
import { type Page, chromium, expect } from "@playwright/test";

const srcDir = `${import.meta.dir}/../src`;
const fixtureDir = `${import.meta.dir}/fixtures`;

const srcFiles = fs.readdirSync(srcDir).map((file) => `${srcDir}/${file}`);

const fixtureJsFiles = fs
  .readdirSync(fixtureDir)
  .filter((file) => file.endsWith(".js"))
  .map((file) => `${fixtureDir}/${file}`);

const buildResult = await Bun.build({
  entrypoints: [...srcFiles, ...fixtureJsFiles],
});

if (!buildResult.success) {
  console.error(buildResult.logs);
  throw new Error("Build failed");
}

const jsMap = new Map<string, string>();
for (const output of buildResult.outputs) {
  const path = output.path.split("/").pop();
  if (path === undefined) {
    throw new Error(`Absurd: ${output.path}`);
  }
  jsMap.set(`/${path}`, await output.text());
}

const browser = await chromium.launch();

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

afterAll(async () => {
  await browser.close();
});
