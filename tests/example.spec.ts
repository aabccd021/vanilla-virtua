import { chromium, expect } from "@playwright/test";
import * as fs from "node:fs/promises";

const srcDir = `${import.meta.dir}/../src`;

const srcFiles = await fs.readdir(srcDir);
const entrypoints = srcFiles.map((file) => `${srcDir}/${file}`);
const buildResult = await Bun.build({
  entrypoints,
  root: srcDir,
  minify: true,
});

if (!buildResult.success) {
  console.error(buildResult.logs);
  throw new Error("Build failed");
}

const jsMap = new Map<string, string>();
for (const output of buildResult.outputs) {
  const path = output.path.slice(1);
  jsMap.set(path, await output.text());
}

const browser = await chromium.launch();
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
  return route.fulfill({
    path: `${import.meta.dir}/fixtures${urlPath}`,
  });
});

await page.goto("ssr.html");
expect(page).toHaveTitle("SSR");
expect(await page.getByTestId("dyn").textContent()).toBe(
  "this is dynamically added",
);

await browser.close();
