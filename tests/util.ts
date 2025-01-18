import { type Page, expect, test } from "@playwright/test";

function expectClicked(consoleMessages: string[], message: string) {
  expect(consoleMessages.filter((msg) => msg === message)).toEqual([message]);
}

async function handleStep(page: Page, step: string, consoleMessages: string[]) {
  if (step.at(0) === "g") {
    if (step.at(1) === "s") {
      await page.goto("static.html");
      await expect(page.getByTestId("main")).toHaveText("Static");
      await page.getByTestId("main").click();
      expectClicked(consoleMessages, "click static");
      return;
    }
    if (step.at(1) === "d") {
      await page.goto("dynamic.html");
      await expect(page.getByTestId("main")).toHaveText("Dynamic");
      await page.getByTestId("main").click();
      expectClicked(consoleMessages, "click dynamic");
      return;
    }
    if (step.at(1) === "i") {
      await page.goto("increment.html");
      await expect(page.getByTestId("main")).toHaveText(step.slice(3));
      await page.getByTestId("main").click();
      expectClicked(consoleMessages, "click increment");
      return;
    }
  }
  if (step.at(0) === "c") {
    if (step.at(1) === "s") {
      await page.getByText("Static").click();
      await expect(page.getByTestId("main")).toHaveText("Static");
      await page.getByTestId("main").click();
      expectClicked(consoleMessages, "click static");
      return;
    }
    if (step.at(1) === "d") {
      await page.getByText("Dynamic").click();
      await expect(page.getByTestId("main")).toHaveText("Dynamic");
      await page.getByTestId("main").click();
      expectClicked(consoleMessages, "click dynamic");
      return;
    }
    if (step.at(1) === "i") {
      await page.getByText("Increment").click();
      await expect(page.getByTestId("main")).toHaveText(step.slice(3));
      await page.getByTestId("main").click();
      expectClicked(consoleMessages, "click increment");
      return;
    }
  }
  if (step.at(0) === "b") {
    // await page.goBack();
    await page.goBack({ waitUntil: "commit" });

    if (step.at(1) === "s") {
      await expect(page.getByTestId("main")).toHaveText("Static");
      await page.getByTestId("main").click();
      expectClicked(consoleMessages, "click static");
      return;
    }
    if (step.at(1) === "d") {
      await expect(page.getByTestId("main")).toHaveText("Dynamic");
      await page.getByTestId("main").click();
      expectClicked(consoleMessages, "click dynamic");
      return;
    }
    if (step.at(1) === "i") {
      await expect(page.getByTestId("main")).toHaveText(step.slice(3));
      await page.getByTestId("main").click();
      expectClicked(consoleMessages, "click increment");
      return;
    }
  }

  throw new Error(`Unknown step: ${step}`);
}

export function runTest(params: string[][], attribute?: "fail") {
  for (const steps of params) {
    const tester = attribute === "fail" ? test.fail : test;
    tester(steps.join(" "), async ({ page }) => {
      const errors: Error[] = [];
      page.on("pageerror", (error) => errors.push(error));

      let consoleMessages: string[] = [];
      page.on("console", (msg) => consoleMessages.push(msg.text()));

      // page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));

      for (const step of steps) {
        // console.log(step);
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
