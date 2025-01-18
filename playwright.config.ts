import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  maxFailures: 1,
  use: {
    baseURL: "http://domain",
  },
  // timeout: 100_000,
  // expect: {
  //   timeout: 100_000,
  // },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        channel: "chromium",
        launchOptions: {
          ignoreDefaultArgs: ["--disable-back-forward-cache"],
        },
      },
    },
    // {
    //   name: "firefox",
    //   use: { ...devices["Desktop Firefox"] },
    // },
  ],
});
