import { CacheSnapshot } from "virtua/core";
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

    document.dispatchEvent(
      new CustomEvent("infinite-new-children", {
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

const roots = document.body.querySelectorAll("[data-infinite-root]");

for (const root of roots) {
  if (!(root instanceof HTMLElement)) {
    continue;
  }

  const listId = root.dataset["infiniteRoot"];
  if (listId === undefined) {
    throw new Error("Absurd");
  }

  const next = document.body.querySelector<HTMLAnchorElement>(
    `a[data-infinite-next="${listId}"]`,
  );
  if (next === null) {
    continue;
  }

  const triggers = root.querySelectorAll(`[data-infinite-trigger="${listId}"]`);

  const cacheStr = sessionStorage.getItem(`cache-${listId}`);
  const cache = cacheStr === null ? undefined : JSON.parse(cacheStr) as { cache: CacheSnapshot, scrollOffset: number };

  requestAnimationFrame(() => {
    const infinite = init({ 
      root,
      cache: cache?.cache,
    });

    render(infinite.context);
    for (const attr of root.attributes) {
      infinite.root.setAttribute(attr.name, attr.value);
    }
    root.replaceWith(infinite.root);

    if (cache?.scrollOffset) {
      infinite.context.scroller.$scrollTo(cache.scrollOffset);
    }

    window.addEventListener("beforeunload", () => {
      localStorage.setItem("hello", "world");
      const cache = infinite.context.store.$getCacheSnapshot();
      const scrollOffset = infinite.context.store.$getScrollOffset();
      sessionStorage.setItem(`cache-${listId}`, JSON.stringify({ cache, scrollOffset }));
    })

    infiniteScroll(listId, infinite.context, next, triggers);
  });
}
