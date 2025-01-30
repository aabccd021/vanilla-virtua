import { defineConfig, devices } from "@playwright/test";

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

const _IOS_SPECS = "iOS";

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./e2e",
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          ignoreDefaultArgs: ["--headless=old"],
          args: ["--headless"],
        },
      },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
  ],

  webServer: {
    command: "esbuild stories/*.ts --bundle --outdir=stories --servedir=stories",
    url: "http://127.0.0.1:8000",
    reuseExistingServer: !process.env.CI,
    stderr: "ignore",
  },
});
