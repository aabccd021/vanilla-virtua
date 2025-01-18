import { defineConfig, devices } from "@playwright/test";

// const timeout = 1_000_000;
const timeout = 5_000;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  maxFailures: 1,
  // workers: 1,
  use: {
    baseURL: "http://localhost:8080",
  },
  timeout,
  expect: { timeout: timeout / 2 },
  projects: [
    {
      name: "chromium-bfcache",
      testMatch: ["bfcache.test.ts"],
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
      testMatch: ["no-bfcache.test.ts"],
      use: { ...devices["Desktop Chrome"] },
    },
    // {
    //   name: "firefox-no-bfcache",
    //   testMatch: ["no-bfcache.test.ts"],
    //   use: { ...devices["Desktop Firefox"] },
    // },
  ],
});
