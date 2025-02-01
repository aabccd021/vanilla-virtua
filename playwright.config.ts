import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  // maxFailures: 1,
  fullyParallel: true,
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
  ],

  webServer: {
    command: "npm run serve",
    url: "http://127.0.0.1:8000",
    reuseExistingServer: true,
    stderr: "ignore",
  },
});
