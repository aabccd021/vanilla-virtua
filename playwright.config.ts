import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  // workers: 1,
  // maxFailures: 1,
  retries: 2,
  use: {
    baseURL: "http://domain",
  },
  timeout: 5_000,
  // expect: {
  //   timeout: 100_000,
  // },
  projects: [
    {
      name: "chromium-bfcache",
      testMatch: ["common.test.ts", "bfcache.test.ts"],
      use: {
        ...devices["Desktop Chrome"],
        channel: "chromium",
        headless: false,
        launchOptions: {
          ignoreDefaultArgs: ["--disable-back-forward-cache"],
        },
      },
    },
    {
      name: "chromium-no-bfcache",
      testMatch: ["common.test.ts", "no-bfcache.test.ts"],
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox-no-bfcache",
      testMatch: ["common.test.ts", "no-bfcache.test.ts"],
      use: { ...devices["Desktop Firefox"] },
    },
  ],
});
