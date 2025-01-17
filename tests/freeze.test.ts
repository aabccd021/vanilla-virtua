// import { afterAll, test } from "bun:test";
import { type Page, chromium, expect, test } from "@playwright/test";

const __dirname = new URL(".", import.meta.url).pathname;
const fixtureDir = `${__dirname}/fixtures`;

// const srcDir = `${import.meta.dir}/../src`;
// const fixtureDir = `${import.meta.dir}/fixtures`;
//
// const srcFiles = fs.readdirSync(srcDir).map((file) => `${srcDir}/${file}`);
//
// const fixtureMts = fs
//   .readdirSync(fixtureDir)
//   .filter((file) => file.endsWith(".mts"))
//   .map((file) => `${fixtureDir}/${file}`);
//
// const mjsBuildResult = await Bun.build({
//   entrypoints: [...srcFiles, ...fixtureMts],
//   target: "browser",
// });
//
// if (!mjsBuildResult.success) {
//   console.error(mjsBuildResult.logs);
//   throw new Error("Build failed");
// }
//
// const buildResults = mjsBuildResult.outputs;
//
// const jsMap = new Map<string, string>();
// for (const output of buildResults) {
//   const path = output.path.split("/").pop();
//   if (path === undefined) {
//     throw new Error(`Absurd: ${output.path}`);
//   }
//   jsMap.set(`/${path}`, await output.text());
// }
//
const browser = await chromium.launch({
  // headless: false,
});

async function getPage(): Promise<Page> {
  const page = await browser.newPage({ baseURL: "http://domain" });
  await page.route("**/*", (route, request) => {
    const urlPath = new URL(request.url()).pathname;
    // const js = jsMap.get(urlPath);
    // if (js) {
    //   return route.fulfill({
    //     body: js,
    //     contentType: "application/javascript",
    //   });
    // }
    return route.fulfill({ path: `${fixtureDir}${urlPath}` });
  });
  // page.on("console", (msg) => console.log(`PAGE LOG: ${msg.text()}`));
  // page.on("pageerror", (error) => console.error(`PAGE ERROR: ${error}`));
  return page;
}

const params: string[][] = [
  [
    "gs",
    "cd",
    "ci_1",
    "cd",
    "ci_2",
    "cd",
    "ci_3",
    "cd",
    "ci_4",
    "bd",
    "bd",
    "bd",
  ],
  [
    "gs",
    "ci_1",
    "cs",
    "ci_2",
    "cs",
    "ci_3",
    "cs",
    "ci_4",
    "bs",
    "bi_1",
    "bs",
    "bi_1",
  ],

  ["gi_1"],
  ["gs", "ci_1"],

  ["gs", "ci_1", "cs", "ci_2"],
  ["gs", "ci_1", "gs", "ci_2"],
  ["gs", "ci_1", "bs"],
  ["gs", "ci_1", "cd", "ci_2"],
  ["gs", "ci_1", "gd", "ci_2"],

  ["gi_1", "cs", "ci_2"],
  ["gi_1", "gs", "ci_2"],
  ["gi_1", "cd", "ci_2"],
  ["gi_1", "gd", "ci_2"],

  ["gs", "ci_1", "ri_1"],
  ["gi_1", "ri_1"],

  ["gs", "ci_1", "cs", "ci_2", "cs", "ci_3", "ri_1"],
  ["gs", "ci_1", "cs", "ci_2", "gs", "ci_3", "ri_1"],
  ["gs", "ci_1", "cs", "ci_2", "bs", "ci_3", "ri_1"],
  ["gs", "ci_1", "cs", "ci_2", "cd", "ci_3", "ri_1"],
  ["gs", "ci_1", "cs", "ci_2", "gd", "ci_3", "ri_1"],

  ["gs", "ci_1", "gs", "ci_2", "cs", "ci_3", "ri_1"],
  ["gs", "ci_1", "gs", "ci_2", "gs", "ci_3", "ri_1"],
  ["gs", "ci_1", "gs", "ci_2", "bs", "ci_3", "ri_1"],
  ["gs", "ci_1", "gs", "ci_2", "cd", "ci_3", "ri_1"],
  ["gs", "ci_1", "gs", "ci_2", "gd", "ci_3", "ri_1"],

  ["gs", "ci_1", "bs", "ci_2", "cs", "ci_3", "ri_1"],
  ["gs", "ci_1", "bs", "ci_2", "gs", "ci_3", "ri_1"],
  ["gs", "ci_1", "bs", "ci_2", "bs", "ci_3", "ri_1"],
  ["gs", "ci_1", "bs", "ci_2", "cd", "ci_3", "ri_1"],
  ["gs", "ci_1", "bs", "ci_2", "gd", "ci_3", "ri_1"],

  ["gs", "ci_1", "cd", "ci_2", "cs", "ci_3", "ri_1"],
  ["gs", "ci_1", "cd", "ci_2", "gs", "ci_3", "ri_1"],
  ["gs", "ci_1", "cd", "ci_2", "bd", "ci_3", "ri_1"],
  ["gs", "ci_1", "cd", "ci_2", "cd", "ci_3", "ri_1"],
  ["gs", "ci_1", "cd", "ci_2", "gd", "ci_3", "ri_1"],

  ["gs", "ci_1", "gd", "ci_2", "cs", "ci_3", "ri_1"],
  ["gs", "ci_1", "gd", "ci_2", "gs", "ci_3", "ri_1"],
  ["gs", "ci_1", "gd", "ci_2", "bd", "ci_3", "ri_1"],
  ["gs", "ci_1", "gd", "ci_2", "cd", "ci_3", "ri_1"],
  ["gs", "ci_1", "gd", "ci_2", "gd", "ci_3", "ri_1"],

  ["gs", "ci_1", "cs", "ci_2", "gi_1", "ri_1"],
];

async function handleStep(page: Page, step: string): Promise<void> {
  if (step.at(0) === "g") {
    if (step.at(1) === "s") {
      await page.goto("static.html");
      await expect(page.getByTestId("main")).toHaveText("Static");
      return;
    }
    if (step.at(1) === "d") {
      await page.goto("dynamic.html");
      await expect(page.getByTestId("main")).toHaveText("Dynamic");
      return;
    }
    if (step.at(1) === "i") {
      await page.goto("increment.html");
      await expect(page.getByTestId("main")).toHaveText(step.slice(3));
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
      return;
    }
    if (step.at(1) === "i") {
      await page.getByText("Increment").click();
      await expect(page.getByTestId("main")).toHaveText(step.slice(3));
      return;
    }
  }
  if (step.at(0) === "r") {
    await page.reload();
    if (step.at(1) === "s") {
      await expect(page.getByTestId("main")).toHaveText("Static");
      return;
    }
    if (step.at(1) === "d") {
      await expect(page.getByTestId("main")).toHaveText("Dynamic");
      return;
    }
    if (step.at(1) === "i") {
      await expect(page.getByTestId("main")).toHaveText(step.slice(3));
      return;
    }
  }
  if (step.at(0) === "b") {
    await page.goBack();
    if (step.at(1) === "s") {
      await expect(page.getByTestId("main")).toHaveText("Static");
      return;
    }
    if (step.at(1) === "d") {
      await expect(page.getByTestId("main")).toHaveText("Dynamic");
      return;
    }
    if (step.at(1) === "i") {
      await expect(page.getByTestId("main")).toHaveText(step.slice(3));
      return;
    }
  }

  throw new Error(`Unknown step: ${step}`);
}

for (const steps of params) {
  test(steps.join(" "), async () => {
    const page = await getPage();
    const errors: Error[] = [];
    page.on("pageerror", (error) => errors.push(error));
    for (const step of steps) {
      await handleStep(page, step);
      // console.log(step);
      // const value = await page.evaluate(() =>
      //   sessionStorage.getItem("freeze-cache"),
      // );
      // console.log(JSON.parse(value));
    }
    expect(errors).toHaveLength(0);
    await page.close();
  });
}

test.afterAll(async () => {
  await browser.close();
});
