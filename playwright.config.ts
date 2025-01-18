import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  maxFailures: 1,
  use: {
    baseURL: "http://localhost:8080",
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
