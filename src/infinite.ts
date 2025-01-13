import type { CacheSnapshot } from "virtua/core";
import type { InfiniteEvent } from "./event.ts";
import { type Context, appendChildren, init, render } from "./index.ts";

function infiniteScroll(
  listId: string,
  context: Context,
  next: HTMLAnchorElement,
  triggers: NodeListOf<Element>,
): void {
  const observer = new IntersectionObserver(async (entries) => {
    if (entries.every((entry) => !entry.isIntersecting)) {
      return;
    }

    observer.disconnect();

    const response = await fetch(next.href);
    const html = await response.text();
    const newDoc = new DOMParser().parseFromString(html, "text/html");

    const newRoot = newDoc.querySelector(`[data-infinite-root="${listId}"]`);
    if (newRoot === null) {
      return;
    }

    for (const trigger of triggers) {
      trigger.removeAttribute("data-infinite-trigger");
    }

    const newTriggers = newRoot.querySelectorAll(
      `[data-infinite-trigger="${listId}"]`,
    );

    const newChildren = Array.from(newRoot.children);

    window.dispatchEvent(
      new CustomEvent("infinite", {
        detail: { children: newChildren },
      }),
    );

    appendChildren(context, newChildren);

    const newNext = newDoc.querySelector<HTMLAnchorElement>(
      `a[data-infinite-next="${listId}"]`,
    );
    if (newNext === null) {
      next.remove();
      return;
    }
    next.replaceWith(newNext);

    infiniteScroll(listId, context, newNext, newTriggers);
  });

  for (const trigger of triggers) {
    observer.observe(trigger);
  }
}

function waitAnimationFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

type Storage = {
  cache: CacheSnapshot;
  scrollOffset: number;
  body: string;
  title: string;
  scripts: string[];
};

async function initInfinite(cache?: Storage): Promise<void> {
  const root = document.body.querySelector("[data-infinite-root]");
  if (!(root instanceof HTMLElement)) {
    return;
  }

  const listId = root.dataset["infiniteRoot"];
  if (listId === undefined) {
    throw new Error("List ID not found");
  }

  const next = document.body.querySelector<HTMLAnchorElement>(
    `a[data-infinite-next="${listId}"]`,
  );
  if (next === null) {
    throw new Error("Next not found");
  }

  const triggers = root.querySelectorAll(`[data-infinite-trigger="${listId}"]`);

  const subscribedScripts = new Set<string>(cache?.scripts);

  window.addEventListener("infsub", (e: CustomEventInit<string>) => {
    if (e.detail !== undefined) {
      subscribedScripts.add(e.detail);
    }
  });

  const vList = init({ root, cache: cache?.cache });
  await waitAnimationFrame();

  render(vList.context);

  for (const attr of root.attributes) {
    vList.root.setAttribute(attr.name, attr.value);
  }
  root.replaceWith(vList.root);

  await waitAnimationFrame();
  if (cache?.scrollOffset) {
    vList.context.scroller.$scrollTo(cache.scrollOffset);
  }

  infiniteScroll(listId, vList.context, next, triggers);

  window.dispatchEvent(
    new CustomEvent<InfiniteEvent>("infinite", {
      detail: {
        type: "newChildren",
        children: vList.context.state.children,
      },
    }),
  );

  window.addEventListener("beforeunload", () => {
    const cache = vList.context.store.$getCacheSnapshot();
    const scrollOffset = vList.context.store.$getScrollOffset();

    for (const child of vList.context.state.children) {
      vList.root.appendChild(child);
    }

    vList.container.remove();

    const body = document.body.outerHTML;
    const title = document.title;

    const scripts = Array.from(subscribedScripts);

    const storage: Storage = { cache, scrollOffset, body, title, scripts };

    sessionStorage.setItem(`cache-${listId}`, JSON.stringify(storage));
  });
}

const anchors = document.body.querySelectorAll<HTMLAnchorElement>(
  "a[data-infinite-link]",
);

for (const anchor of anchors) {
  const listId = anchor.dataset["infiniteLink"];
  if (listId === undefined) {
    continue;
  }

  anchor.addEventListener("click", async (e) => {
    const cacheStr = sessionStorage.getItem(`cache-${listId}`);
    if (cacheStr === null) {
      return;
    }

    e.preventDefault();

    const cache = JSON.parse(cacheStr) as Storage;

    document.body.outerHTML = cache.body;
    document.title = cache.title;

    window.dispatchEvent(
      new CustomEvent<InfiniteEvent>("infinite", {
        detail: {
          type: "unsubscribe",
        },
      }),
    );

    await Promise.all(cache.scripts.map((src) => import(src)));

    history.pushState({}, "", anchor.href);

    initInfinite(cache);
  });
}

initInfinite();
