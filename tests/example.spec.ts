import path from "node:path";
import { chromium, expect } from "@playwright/test";

const browser = await chromium.launch();

const page = await browser.newPage({ baseURL: "http://domain" });
await page.route("**/*", (route, request) =>
  route.fulfill({
    path: path.join(
      import.meta.dir,
      "fixtures",
      new URL(request.url()).pathname,
    ),
  }),
);

await page.goto("ssr.html");
expect(await page.title()).toBe("SSR");

await browser.close();
