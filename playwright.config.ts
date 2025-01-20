import { defineConfig, devices } from "@playwright/test";

// const timeout = 1_000_000;
const timeout = 5_000;

const __dirname = new URL(".", import.meta.url).pathname;

export default defineConfig({
  fullyParallel: true,
  maxFailures: 1,
  // workers: 1,
  use: {
    baseURL: "http://127.0.0.1:8000",
  },
  webServer: {
    command: `httplz ${__dirname}/fixtures`,
    url: "http://127.0.0.1:8000",
    timeout: 5_000,
  },
  timeout,
  expect: { timeout: timeout / 2 },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
