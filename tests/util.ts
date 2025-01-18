import { type Page, test, expect } from "@playwright/test";

const __dirname = new URL(".", import.meta.url).pathname;
const fixtureDir = `${__dirname}/fixtures`;

test.beforeEach(async ({ context }) => {
  await context.route("**/*", (route, request) => {
    const urlPath = new URL(request.url()).pathname;
    return route.fulfill({ path: `${fixtureDir}${urlPath}` });
  });
});

function expectClicked(consoleMessages: string[]) {
  expect(consoleMessages.filter((msg) => msg === "clicked")).toHaveLength(1);
}

async function handleStep(page: Page, step: string, consoleMessages: string[]) {
  if (step.at(0) === "g") {
    if (step.at(1) === "s") {
      await page.goto("static.html");
      await expect(page.getByTestId("main")).toHaveText("Static");
      return;
    }
    if (step.at(1) === "d") {
      await page.goto("dynamic.html");
      await expect(page.getByTestId("main")).toHaveText("Dynamic");
      await page.getByTestId("main").click();
      expectClicked(consoleMessages);
      return;
    }
    if (step.at(1) === "i") {
      await page.goto("increment.html");
      await expect(page.getByTestId("main")).toHaveText(step.slice(3));
      await page.getByTestId("main").click();
      expectClicked(consoleMessages);
      return;
    }
  }
  if (step.at(0) === "c") {
    if (step.at(1) === "s") {
      await page.getByText("Static").click();
      await expect(page.getByTestId("main")).toHaveText("Static");
      return;
    }
    if (step.at(1) === "d") {
      await page.getByText("Dynamic").click();
      await expect(page.getByTestId("main")).toHaveText("Dynamic");
      await page.getByTestId("main").click();
      expectClicked(consoleMessages);
      return;
    }
    if (step.at(1) === "i") {
      await page.getByText("Increment").click();
      await expect(page.getByTestId("main")).toHaveText(step.slice(3));
      await page.getByTestId("main").click();
      expectClicked(consoleMessages);
      return;
    }
  }
  if (step.at(0) === "b") {
    await page.goBack({ waitUntil: "load" });

    if (step.at(1) === "s") {
      await expect(page.getByTestId("main")).toHaveText("Static");
      return;
    }
    if (step.at(1) === "d") {
      await expect(page.getByTestId("main")).toHaveText("Dynamic");
      await page.getByTestId("main").click();
      expectClicked(consoleMessages);
      return;
    }
    if (step.at(1) === "i") {
      await expect(page.getByTestId("main")).toHaveText(step.slice(3));
      await page.getByTestId("main").click();
      expectClicked(consoleMessages);
      return;
    }
  }

  throw new Error(`Unknown step: ${step}`);
}

export function runTest(params: string[][]) {
  for (const steps of params) {
    test(steps.join(" "), async ({ page }) => {
      const errors: Error[] = [];
      page.on("pageerror", (error) => errors.push(error));

      let consoleMessages: string[] = [];
      page.on("console", (msg) => consoleMessages.push(msg.text()));

      for (const step of steps) {
        await handleStep(page, step, consoleMessages);
        consoleMessages = [];
        // const value = await page.evaluate(() =>
        //   sessionStorage.getItem("freeze-cache"),
        // );
        // console.log(JSON.parse(value));
      }
      expect(errors).toHaveLength(0);
      expect(consoleMessages).toHaveLength(0);
      await page.close();
    });
  }
}
