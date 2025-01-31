import { expect, test } from "@playwright/test";
import {
  approxymate,
  clearInput,
  expectInRange,
  getFirstItem,
  getFirstItemRtl,
  getLastItem,
  getScrollBottom,
  getScrollLeft,
  getScrollRight,
  getScrollTop,
  getScrollable,
  getVirtualizer,
  listenScrollCount,
  scrollBy,
  scrollTo,
  scrollToBottom,
  scrollToLeft,
  scrollToRight,
  storyUrl,
} from "./utils.ts";

test.describe("smoke", () => {
  test("vertically scrollable", async ({ page }) => {
    await page.goto(storyUrl("basics-vlist--default"));

    const component = await getScrollable(page);

    // check if start is displayed
    const first = await getFirstItem(component);
    expect(first.text).toEqual("0");
    expect(first.top).toEqual(0);

    // scroll to the end
    await scrollToBottom(component);

    // check if the end is displayed
    expect(await component.innerText()).toContain("999");
  });

  test("horizontally scrollable", async ({ page }) => {
    await page.goto(storyUrl("basics-vlist--horizontal"));

    const component = await getScrollable(page);

    // check if start is displayed
    const first = await getFirstItem(component);
    expect(first.text).toEqual("Column 0");
    expect(first.left).toEqual(0);

    // scroll to the end
    await scrollToRight(component);

    // check if the end is displayed
    expect(await component.innerText()).toContain("999");
  });

  test.skip("reverse", async ({ page }) => {
    await page.goto(storyUrl("basics-vlist--reverse"));

    const component = await getScrollable(page);

    // check if last is displayed
    const last = await getLastItem(component);
    expect(last.text).toEqual("999");
    expect(last.bottom).toEqual(0);
  });

  test("display: none", async ({ page }) => {
    await page.goto(storyUrl("basics-vlist--default"));

    const component = await getScrollable(page);

    const initialTotalHeight = await component.evaluate((s) => getComputedStyle(s.childNodes[0] as HTMLElement).height);

    await component.evaluate((s) => {
      s.style.display = "none";
    });

    const changedTotalHeight = await component.evaluate((s) => getComputedStyle(s.childNodes[0] as HTMLElement).height);

    expect(initialTotalHeight).toBeTruthy();
    expect(initialTotalHeight).toEqual(changedTotalHeight);
  });

  test("scroll restoration", async ({ page }) => {
    await page.goto(storyUrl("basics-vlist--scroll-restoration"));

    const component = await getScrollable(page);

    // check if start is displayed
    const initialItem = await getFirstItem(component);
    expect(initialItem.text).toEqual("0");

    // scroll to mid
    await scrollTo(component, 5000);
    await page.waitForTimeout(250);
    const mountedItem = await getFirstItem(component);
    expect(mountedItem.text).not.toEqual(initialItem.text);

    // check if items are unmounted
    await page.getByRole("button", { name: "hide" }).click();

    expect(component).not.toBeAttached();

    // check if scroll position is restored
    await page.getByRole("button", { name: "show" }).click();
    await page.waitForTimeout(250);
    const remountedComponent = await getScrollable(page);
    const remountedItem = await getFirstItem(remountedComponent);
    expect(remountedItem.text).toEqual(mountedItem.text);
    expect(remountedItem.top).toEqual(mountedItem.top);
  });
});

test.describe("check if it works when children change", () => {
  test("recovering from 0", async ({ page }) => {
    await page.goto(storyUrl("basics-vlist--increasing-items"));
    const component = await getScrollable(page);

    const updateButton = page.getByRole("button", { name: "update" });

    // delete all
    await page.getByRole("radio", { name: "decrease" }).click();
    for (let i = 0; i < 10; i++) {
      await updateButton.click();
    }
    const topItem = await getFirstItem(component);
    expect(topItem.text).not.toEqual("0");

    // add
    await page.getByRole("radio", { name: "increase" }).click();
    await updateButton.click();
    // check if an error didn't occur
    expect((await page.innerText("body")).toLowerCase().includes("localhost")).toBeFalsy();
  });

  test("recovering when changed a lot after scrolling", async ({ page }) => {
    await page.goto(storyUrl("basics-vlist--increasing-items"));
    const component = await getScrollable(page);

    const input = page.getByRole("spinbutton");
    const updateButton = page.getByRole("button", { name: "update" });

    // add many
    input.fill("1000");
    await updateButton.click();

    // scroll a lot
    await scrollToBottom(component);
    const topItem = await getFirstItem(component);
    expect(topItem.text).not.toEqual("0");

    // delete many
    await page.getByRole("radio", { name: "decrease" }).click();
    await updateButton.click();

    // add many
    await page.getByRole("radio", { name: "increase" }).click();
    await updateButton.click();
    // check if an error didn't occur
    expect((await page.innerText("body")).toLowerCase().includes("localhost")).toBeFalsy();
  });
});

test.describe("check if scroll jump compensation works", () => {
  test("vertical start -> end", async ({ page }) => {
    await page.goto(storyUrl("basics-vlist--default"));
    const component = await getScrollable(page);

    // check if start is displayed
    expect((await getFirstItem(component)).text).toEqual("0");

    // check if offset from start is always keeped
    await component.click();
    const min = 200;
    const initial = await getScrollTop(component);
    let prev = initial;
    for (let i = 0; i < 500; i++) {
      await page.keyboard.press("ArrowDown", { delay: 10 });
      const offset = await getScrollTop(component);
      expect(offset).toBeGreaterThanOrEqual(prev);
      prev = offset;
    }
    expect(prev).toBeGreaterThan(initial + min);
  });

  test("vertical end -> start", async ({ page }) => {
    await page.goto(storyUrl("basics-vlist--default"));
    const component = await getScrollable(page);

    // check if start is displayed
    expect((await getFirstItem(component)).text).toEqual("0");

    // scroll to the end
    await scrollToBottom(component);

    // check if offset from end is always keeped
    await component.click();
    const min = 200;
    const initial = await getScrollBottom(component);
    let prev = initial;
    for (let i = 0; i < 500; i++) {
      await page.keyboard.press("ArrowUp", { delay: 10 });
      const offset = await getScrollBottom(component);
      expect(offset).toBeGreaterThanOrEqual(prev);
      prev = offset;
    }
    expect(prev).toBeGreaterThan(initial + min);
  });

  test("horizontal start -> end", async ({ page }) => {
    await page.goto(storyUrl("basics-vlist--horizontal"));
    const component = await getScrollable(page);

    // check if start is displayed
    expect((await getFirstItem(component)).text).toEqual("Column 0");

    // check if offset from start is always keeped
    await component.click();
    const min = 200;
    const initial = await getScrollLeft(component);
    let prev = initial;
    for (let i = 0; i < 500; i++) {
      await page.keyboard.press("ArrowRight", { delay: 10 });
      const offset = await getScrollLeft(component);
      expect(offset).toBeGreaterThanOrEqual(prev);
      prev = offset;
    }
    expect(prev).toBeGreaterThan(initial + min);
  });

  test("horizontal end -> start", async ({ page }) => {
    await page.goto(storyUrl("basics-vlist--horizontal"));
    const component = await getScrollable(page);

    // check if start is displayed
    expect((await getFirstItem(component)).text).toEqual("Column 0");

    // scroll to the end
    await scrollToRight(component);

    // check if offset from end is always keeped
    await component.click();
    const min = 200;
    const initial = await getScrollRight(component);
    let prev = initial;
    for (let i = 0; i < 500; i++) {
      await page.keyboard.press("ArrowLeft", { delay: 10 });
      const offset = await getScrollRight(component);
      expect(offset).toBeGreaterThanOrEqual(prev);
      prev = offset;
    }
    expect(prev).toBeGreaterThan(initial + min);
  });
});

test.describe("check if scrollToIndex works", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(storyUrl("basics-vlist--scroll-to"));
  });

  test.describe("align start", () => {
    test.skip("mid", async ({ page }) => {
      const component = await getScrollable(page);

      // check if start is displayed
      expect((await getFirstItem(component)).text).toEqual("0");

      const button = page.getByRole("button", { name: "scroll to index" });
      const input = await button.evaluateHandle((el) => el.previousSibling as HTMLInputElement);

      await clearInput(input);
      await input.fill("700");
      await button.click();

      await (await component.elementHandle())?.waitForElementState("stable");

      // Check if scrolled precisely
      const firstItem = await getFirstItem(component);
      expect(firstItem.text).toEqual("700");
      expect(firstItem.top).toEqual(0);

      // Check if unnecessary items are not rendered
      expect(await component.innerText()).not.toContain("650");
      expect(await component.innerText()).not.toContain("750");
    });

    test.skip("start", async ({ page }) => {
      const component = await getScrollable(page);

      // check if start is displayed
      expect((await getFirstItem(component)).text).toEqual("0");

      const button = page.getByRole("button", { name: "scroll to index" });
      const input = await button.evaluateHandle((el) => el.previousSibling as HTMLInputElement);

      await clearInput(input);
      await input.fill("500");
      await button.click();

      await (await component.elementHandle())?.waitForElementState("stable");

      expect(await component.innerText()).toContain("500");

      await clearInput(input);
      await input.fill("0");
      await button.click();

      await (await component.elementHandle())?.waitForElementState("stable");

      // Check if scrolled precisely
      const firstItem = await getFirstItem(component);
      expect(firstItem.text).toEqual("0");
      expect(firstItem.top).toEqual(0);

      // Check if unnecessary items are not rendered
      expect(await component.innerText()).not.toContain("50\n");
    });

    test.skip("end", async ({ page }) => {
      const component = await getScrollable(page);

      // check if start is displayed
      expect((await getFirstItem(component)).text).toEqual("0");

      const button = page.getByRole("button", { name: "scroll to index" });
      const input = await button.evaluateHandle((el) => el.previousSibling as HTMLInputElement);

      await clearInput(input);
      await input.fill("999");
      await button.click();

      await (await component.elementHandle())?.waitForElementState("stable");

      // Check if scrolled precisely
      const lastItem = await getLastItem(component);
      expect(lastItem.text).toEqual("999");
      expectInRange(lastItem.bottom, { min: -0.9, max: 1 });

      // Check if unnecessary items are not rendered
      expect(await component.innerText()).not.toContain("949");
    });

    test.skip("mid smooth", async ({ page, browserName }) => {
      const component = await getScrollable(page);

      // check if start is displayed
      expect((await getFirstItem(component)).text).toEqual("0");

      await page.getByRole("checkbox", { name: "smooth" }).click();

      const button = page.getByRole("button", { name: "scroll to index" });
      const input = await button.evaluateHandle((el) => el.previousSibling as HTMLInputElement);

      const scrollListener = listenScrollCount(component);

      await clearInput(input);
      await input.fill("700");
      await button.click();

      await page.waitForTimeout(500);

      const called = await scrollListener;

      // Check if this is smooth scrolling
      expect(called).toBeGreaterThanOrEqual(
        // TODO find better way to check in webkit
        browserName === "webkit" ? 2 : 10,
      );

      // Check if scrolled precisely
      const firstItem = await getFirstItem(component);
      expect(firstItem.text).toEqual("700");
      expectInRange(firstItem.top, { min: 0, max: 1 });

      // Check if unnecessary items are not rendered
      expect(await component.innerText()).not.toContain("650");
      expect(await component.innerText()).not.toContain("750");
    });
  });

  test.describe("align end", () => {
    test.beforeEach(async ({ page }) => {
      await page.getByRole("radio", { name: "end" }).click();
    });

    test.skip("mid", async ({ page }) => {
      const component = await getScrollable(page);

      // check if start is displayed
      expect((await getFirstItem(component)).text).toEqual("0");

      const button = page.getByRole("button", { name: "scroll to index" });
      const input = await button.evaluateHandle((el) => el.previousSibling as HTMLInputElement);

      await clearInput(input);
      await input.fill("700");
      await button.click();

      await (await component.elementHandle())?.waitForElementState("stable");

      // Check if scrolled precisely
      const lastItem = await getLastItem(component);
      expect(lastItem.text).toEqual("700");
      expectInRange(lastItem.bottom, { min: 0, max: 1 });

      // Check if unnecessary items are not rendered
      expect(await component.innerText()).not.toContain("650");
      expect(await component.innerText()).not.toContain("750");
    });

    test.skip("start", async ({ page }) => {
      const component = await getScrollable(page);

      // check if start is displayed
      expect((await getFirstItem(component)).text).toEqual("0");

      const button = page.getByRole("button", { name: "scroll to index" });
      const input = await button.evaluateHandle((el) => el.previousSibling as HTMLInputElement);

      await clearInput(input);
      await input.fill("500");
      await button.click();

      await (await component.elementHandle())?.waitForElementState("stable");

      expect(await component.innerText()).toContain("500");

      await clearInput(input);
      await input.fill("0");
      await button.click();

      await (await component.elementHandle())?.waitForElementState("stable");

      // Check if scrolled precisely
      const firstItem = await getFirstItem(component);
      expect(firstItem.text).toEqual("0");
      expect(firstItem.top).toEqual(0);

      // Check if unnecessary items are not rendered
      expect(await component.innerText()).not.toContain("50\n");
    });

    test.skip("end", async ({ page }) => {
      const component = await getScrollable(page);

      // check if start is displayed
      expect((await getFirstItem(component)).text).toEqual("0");

      const button = page.getByRole("button", { name: "scroll to index" });
      const input = await button.evaluateHandle((el) => el.previousSibling as HTMLInputElement);

      await clearInput(input);
      await input.fill("999");
      await button.click();

      await (await component.elementHandle())?.waitForElementState("stable");

      // Check if scrolled precisely
      const lastItem = await getLastItem(component);
      expect(lastItem.text).toEqual("999");
      expectInRange(lastItem.bottom, { min: 0, max: 1 });

      // Check if unnecessary items are not rendered
      expect(await component.innerText()).not.toContain("949");
    });

    test.skip("mid smooth", async ({ page, browserName }) => {
      const component = await getScrollable(page);

      // check if start is displayed
      expect((await getFirstItem(component)).text).toEqual("0");

      await page.getByRole("checkbox", { name: "smooth" }).click();

      const button = page.getByRole("button", { name: "scroll to index" });
      const input = await button.evaluateHandle((el) => el.previousSibling as HTMLInputElement);

      const scrollListener = listenScrollCount(component);

      await clearInput(input);
      await input.fill("700");
      await button.click();

      await page.waitForTimeout(500);

      const called = await scrollListener;

      // Check if this is smooth scrolling
      expect(called).toBeGreaterThanOrEqual(
        // TODO find better way to check in webkit
        browserName === "webkit" ? 2 : 10,
      );

      // Check if scrolled precisely
      const lastItem = await getLastItem(component);
      expect(lastItem.text).toEqual("700");
      expectInRange(lastItem.bottom, { min: 0, max: 1 });

      // Check if unnecessary items are not rendered
      expect(await component.innerText()).not.toContain("650");
      expect(await component.innerText()).not.toContain("750");
    });
  });
});

test.describe("check if scrollTo works", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(storyUrl("basics-vlist--scroll-to"));
  });

  test.skip("down and up", async ({ page }) => {
    const component = await getScrollable(page);

    // check if start is displayed
    expect((await getFirstItem(component)).text).toEqual("0");

    const button = page.getByRole("button", { name: "scroll to offset" });
    const input = await button.evaluateHandle((el) => el.previousSibling as HTMLInputElement);

    // scroll down
    await clearInput(input);
    await input.fill("5000");
    await button.click();

    await (await component.elementHandle())?.waitForElementState("stable");

    expect(
      // scrollTo may not scroll to exact position with dynamic sized items
      approxymate(await getScrollTop(component)),
    ).toEqual(5000);

    // scroll up
    await clearInput(input);
    await input.fill("1000");
    await button.click();

    expect(
      // scrollTo may not scroll to exact position with dynamic sized items
      approxymate(await getScrollTop(component)),
    ).toEqual(1000);
  });
});

test.describe("check if scrollBy works", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(storyUrl("basics-vlist--scroll-to"));
  });

  test.skip("down and up", async ({ page }) => {
    const component = await getScrollable(page);

    // check if start is displayed
    expect((await getFirstItem(component)).text).toEqual("0");

    const button = page.getByRole("button", {
      name: "scroll by offset",
    });
    const input = await button.evaluateHandle((el) => el.previousSibling?.previousSibling as HTMLInputElement);

    // scroll down
    await clearInput(input);
    await input.fill("1234");
    await button.click();

    expect(await getScrollTop(component)).toEqual(1234);

    // scroll up
    await clearInput(input);
    await input.fill("-234");
    await button.click();

    expect(await getScrollTop(component)).toEqual(1000);
  });
});

test.describe("check if item shift compensation works", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(storyUrl("basics-vlist--increasing-items"));
  });

  test.skip("keep end at mid when add to/remove from end", async ({ page }) => {
    const component = await getScrollable(page);

    const updateButton = page.getByRole("button", { name: "update" });

    // fill list and move to mid
    for (let i = 0; i < 20; i++) {
      await updateButton.click();
    }
    await scrollBy(component, 400);
    await page.waitForTimeout(500);

    const topItem = await getFirstItem(component);
    expect(topItem.text).not.toEqual("0");
    expect(topItem.text?.length).toBeLessThanOrEqual(2);

    // add
    await page.getByRole("radio", { name: "increase" }).click();
    await updateButton.click();
    await page.waitForTimeout(100);
    // check if visible item is keeped
    expect(topItem).toEqual(await getFirstItem(component));

    // remove
    await page.getByRole("radio", { name: "decrease" }).click();
    await updateButton.click();
    await page.waitForTimeout(100);
    // check if visible item is keeped
    expect(topItem).toEqual(await getFirstItem(component));
  });

  test.skip("keep start at mid when add to/remove from start", async ({ page }) => {
    const component = await getScrollable(page);

    const updateButton = page.getByRole("button", { name: "update" });

    // fill list and move to mid
    for (let i = 0; i < 20; i++) {
      await updateButton.click();
    }
    await scrollBy(component, 800);
    await page.waitForTimeout(500);

    const topItem = await getFirstItem(component);
    expect(topItem.text).not.toEqual("0");
    expect(topItem.text?.length).toBeLessThanOrEqual(2);

    // add
    await page.getByRole("checkbox", { name: "prepend" }).click();
    await page.getByRole("radio", { name: "increase" }).click();
    await updateButton.click();
    await page.waitForTimeout(100);
    // check if visible item is keeped
    expect(topItem).toEqual(await getFirstItem(component));

    // remove
    await page.getByRole("radio", { name: "decrease" }).click();
    await updateButton.click();
    await page.waitForTimeout(100);
    // check if visible item is keeped
    expect(topItem).toEqual(await getFirstItem(component));
  });

  test.skip("prepending when total height is lower than viewport height", async ({ page, browserName }) => {
    const [component, container] = await Promise.all([getScrollable(page), getVirtualizer(page)]);

    await page.getByRole("checkbox", { name: "prepend" }).click();
    const decreaseRadio = page.getByRole("radio", { name: "decrease" });
    const increaseRadio = page.getByRole("radio", { name: "increase" });
    const valueInput = page.getByRole("spinbutton");
    const updateButton = page.getByRole("button", { name: "update" });

    const initialLength = await container.evaluate((e) => e.childNodes.length);
    expect(initialLength).toBeGreaterThan(1);

    let i = 0;
    while (true) {
      i++;
      await valueInput.clear();
      await valueInput.fill(String(i));

      // preprend
      await increaseRadio.click();
      await updateButton.click();
      await (await component.elementHandle())?.waitForElementState("stable");

      const [childrenCount, firstItemRectTop] = await container.evaluate((e) => {
        const children = e.childNodes;
        return [children.length, (children[0] as HTMLElement).getBoundingClientRect().top];
      });
      const [isScrollBarVisible, scrollableRectTop] = await component.evaluate((e) => {
        return [e.scrollHeight > (e as HTMLElement).offsetHeight, e.getBoundingClientRect().top];
      });
      const itemTop = firstItemRectTop - scrollableRectTop;

      // Check if all items are visible
      expect(childrenCount).toBe(i + initialLength);

      if (isScrollBarVisible) {
        // Check if sticked to bottom
        expectInRange((await getLastItem(component)).bottom, {
          min: browserName === "firefox" ? -0.45 : -0.1,
          max: 0.1,
        });
        break;
      }
      // Check if top is always visible and on top
      expect(itemTop).toBe(0);

      // remove
      await decreaseRadio.click();
      await updateButton.click();
    }

    expect(i).toBeGreaterThanOrEqual(8);
  });

  test.skip("prepending when total height is lower than viewport height and reverse:true", async ({
    page,
    browserName,
  }) => {
    const [component, container] = await Promise.all([getScrollable(page), getVirtualizer(page)]);

    await page.getByRole("checkbox", { name: "reverse" }).click();

    await page.getByRole("checkbox", { name: "prepend" }).click();
    const decreaseRadio = page.getByRole("radio", { name: "decrease" });
    const increaseRadio = page.getByRole("radio", { name: "increase" });
    const valueInput = page.getByRole("spinbutton");
    const updateButton = page.getByRole("button", { name: "update" });

    const initialLength = await container.evaluate((e) => e.childNodes.length);
    expect(initialLength).toBeGreaterThan(1);

    let i = 0;
    while (true) {
      i++;
      await valueInput.clear();
      await valueInput.fill(String(i));

      // preprend
      await increaseRadio.click();
      await updateButton.click();
      await (await component.elementHandle())?.waitForElementState("stable");

      const [childrenCount, lastItemRectBottom] = await container.evaluate((e) => {
        const children = e.childNodes;
        return [children.length, (Array.from(children).at(-1) as HTMLElement).getBoundingClientRect().bottom];
      });
      const [isScrollBarVisible, scrollableRectBottom] = await component.evaluate((e) => {
        return [e.scrollHeight > (e as HTMLElement).offsetHeight, e.getBoundingClientRect().bottom];
      });
      const itemBottom = lastItemRectBottom - scrollableRectBottom;

      // Check if all items are visible
      expect(childrenCount).toBe(i + initialLength);

      if (isScrollBarVisible) {
        // Check if sticked to bottom
        expectInRange(itemBottom, {
          min: browserName === "firefox" ? -0.45 : -0.1,
          max: 0.1,
        });
        break;
      }
      // Check if bottom is always visible and on bottom
      expectInRange(itemBottom, { min: -0.1, max: 0.1 });

      // remove
      await decreaseRadio.click();
      await updateButton.click();
    }

    expect(i).toBeGreaterThanOrEqual(8);
  });

  test.skip("stick to bottom even if many items are removed from top", async ({ page, browserName }) => {
    await page.goto(storyUrl("basics-vlist--increasing-items"));
    const [component, container] = await Promise.all([getScrollable(page), getVirtualizer(page)]);

    await page.getByRole("checkbox", { name: "reverse" }).click();

    await page.getByRole("checkbox", { name: "prepend" }).click();
    const decreaseRadio = page.getByRole("radio", { name: "decrease" });
    const increaseRadio = page.getByRole("radio", { name: "increase" });
    const valueInput = page.getByRole("spinbutton");
    const updateButton = page.getByRole("button", { name: "update" });

    // preprend many
    await valueInput.clear();
    await valueInput.fill("50");
    await increaseRadio.click();
    await updateButton.click();

    // scroll to bottom
    await scrollToBottom(component);

    // remove many
    await valueInput.clear();
    await valueInput.fill("1");
    await decreaseRadio.click();
    let i = 0;
    while (true) {
      i++;
      await updateButton.click();

      const lastItemRectBottom = await container.evaluate((e) => {
        const children = e.childNodes;
        return (Array.from(children).at(-1) as HTMLElement).getBoundingClientRect().bottom;
      });
      const [isScrollBarVisible, scrollableRectBottom] = await component.evaluate((e) => {
        return [e.scrollHeight > (e as HTMLElement).offsetHeight, e.getBoundingClientRect().bottom];
      });
      const itemBottom = lastItemRectBottom - scrollableRectBottom;

      // Check if bottom is always visible and on bottom
      expectInRange(itemBottom, {
        min: -0.5,
        max: browserName === "firefox" ? 0.6 : 0.50001,
      });

      if (!isScrollBarVisible) {
        break;
      }
      // may have subpixel error so scroll to bottom again
      await component.evaluate((e) => {
        e.scrollTop += e.scrollHeight;
      });
    }

    expect(i).toBeGreaterThanOrEqual(30);
  });
});

test.describe("RTL", () => {
  test("vertically scrollable", async ({ page }) => {
    await page.goto(storyUrl("basics-vlist--default-rtl"), {
      waitUntil: "domcontentloaded",
    });

    const component = await getScrollable(page);

    // check if start is displayed
    const first = await getFirstItem(component);
    expect(first.text).toEqual("0");
    expect(first.top).toEqual(0);

    // scroll to the end
    await scrollToBottom(component);

    // check if the end is displayed
    expect(await component.innerText()).toContain("999");
  });

  test("horizontally scrollable", async ({ page }) => {
    await page.goto(storyUrl("basics-vlist--horizontal-rtl"), {
      waitUntil: "domcontentloaded",
    });

    const component = await getScrollable(page);

    // check if start is displayed
    const first = await getFirstItemRtl(component);
    expect(first.text).toEqual("Column 0");
    expect(first.right).toEqual(0);

    // scroll to the end
    await scrollToLeft(component);

    // check if the end is displayed
    expect(await component.innerText()).toContain("999");
  });
});
