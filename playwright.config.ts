import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  maxFailures: 1,
  timeout: 15000,
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
