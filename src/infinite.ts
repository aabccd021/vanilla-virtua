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

type Storage = {
  cache: CacheSnapshot;
  scrollOffset: number;
  body: string;
  title: string;
};

function initInfinite(cache?: {
  cache: CacheSnapshot;
  scrollOffset: number;
}): void {
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

  requestAnimationFrame(() => {
    const vList = init({ root, cache: cache?.cache });

    render(vList.context);
    for (const attr of root.attributes) {
      vList.root.setAttribute(attr.name, attr.value);
    }
    root.replaceWith(vList.root);

    infiniteScroll(listId, vList.context, next, triggers);

    requestAnimationFrame(() => {
      if (cache?.scrollOffset) {
        console.log("scrolling to", cache.scrollOffset);
        vList.context.scroller.$scrollTo(cache.scrollOffset);
      }
    });

    requestIdleCallback(() => {
      window.dispatchEvent(
        new CustomEvent<InfiniteEvent>("infinite", {
          detail: {
            type: "newChildren",
            children: vList.context.state.children,
          },
        }),
      );
    });

    window.addEventListener("beforeunload", () => {
      const cache = vList.context.store.$getCacheSnapshot();
      const scrollOffset = vList.context.store.$getScrollOffset();

      for (const child of vList.context.state.children) {
        vList.root.appendChild(child);
      }

      vList.container.remove();

      const body = document.body.outerHTML;
      const title = document.title;

      const storage: Storage = { cache, scrollOffset, body, title };

      sessionStorage.setItem(`cache-${listId}`, JSON.stringify(storage));
    });
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

    console.log("dispatching unsubscribe");
    window.dispatchEvent(
      new CustomEvent<InfiniteEvent>("infinite", {
        detail: {
          type: "unsubscribe",
        },
      }),
    );
    console.log("dispatched unsubscribe");

    // const scripts = document.querySelectorAll("script:not([type='module'])");
    // for (const script of scripts) {
    //   console.log("replacing script", script);
    //   const newScript = document.createElement("script");
    //   for (const attr of script.attributes) {
    //     newScript.setAttribute(attr.name, attr.value);
    //   }
    //   script.replaceWith(newScript);
    // }

    console.log("replacing scripts");
    const fe = await import("/fe.js");
    fe.init();
    console.log("replaced scripts");

    history.pushState({}, "", anchor.href);

    initInfinite(cache);
  });
}

initInfinite();
