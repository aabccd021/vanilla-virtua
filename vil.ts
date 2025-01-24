import type { CacheSnapshot } from "virtua/core";
import { type Context, appendChildren, render, init as vListInit } from "./index.ts";

type ListCache = {
  cacheKey: string;
  virtuaSnapshot: CacheSnapshot;
  scrollOffset: number;
};

function getCache(): ListCache[] {
  return JSON.parse(sessionStorage.getItem("vil-cache") ?? "[]") as ListCache[];
}

function getListCache(cacheKey: string): ListCache | undefined {
  const pageCache = getCache();

  for (const item of pageCache) {
    if (item.cacheKey === cacheKey) {
      return item;
    }
  }

  return undefined;
}

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

    for (const trigger of Array.from(triggers)) {
      trigger.removeAttribute("data-infinite-trigger");
    }

    const newTriggers = newRoot.querySelectorAll(`[data-infinite-trigger="${listId}"]`);

    const newChildren = Array.from(newRoot.children);

    window.dispatchEvent(
      new CustomEvent("infinite", {
        detail: { children: newChildren },
      }),
    );

    appendChildren(context, newChildren);

    const newNext = newDoc.querySelector<HTMLAnchorElement>(`a[data-infinite-next="${listId}"]`);
    if (newNext === null) {
      next.remove();
      return;
    }
    next.replaceWith(newNext);

    infiniteScroll(listId, context, newNext, newTriggers);
  });

  for (const trigger of Array.from(triggers)) {
    observer.observe(trigger);
  }
}

function waitAnimationFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

type Unsub = () => void;

export async function freezePageLoad(): Promise<Unsub | undefined> {
  const root = document.body.querySelector("[data-infinite-root]");
  if (!(root instanceof HTMLElement)) {
    return;
  }

  const listId = root.dataset["infiniteRoot"];
  if (listId === undefined) {
    throw new Error("List ID not found");
  }

  const next = document.body.querySelector<HTMLAnchorElement>(`a[data-infinite-next="${listId}"]`);
  if (next === null) {
    return;
  }

  const triggers = root.querySelectorAll(`[data-infinite-trigger="${listId}"]`);

  const cacheKey = listId + location.pathname + location.search;

  const cache = getListCache(cacheKey);

  const vList = vListInit({
    children: Array.from(root.children),
    cache: cache?.virtuaSnapshot,
  });

  await waitAnimationFrame();

  root.appendChild(vList.root);

  render(vList.context);

  if (cache?.scrollOffset) {
    await waitAnimationFrame();
    vList.context.scroller.$scrollTo(cache.scrollOffset);
  }

  infiniteScroll(listId, vList.context, next, triggers);

  // window.dispatchEvent(
  //   new CustomEvent<InfiniteEvent>("infinite", {
  //     detail: {
  //       type: "newChildren",
  //       children: vList.context.state.children,
  //     },
  //   }),
  // );

  return (): void => {
    const cache = vList.context.store.$getCacheSnapshot();
    const scrollOffset = vList.context.store.$getScrollOffset();

    for (const child of vList.context.state.children) {
      root.appendChild(child);
    }

    vList.root.remove();

    const listsCache = getCache();
    for (let i = 0; i < listsCache.length; i++) {
      if (listsCache[i]?.cacheKey === cacheKey) {
        listsCache.splice(i, 1);
        break;
      }
    }

    const newListCache: ListCache = {
      cacheKey,
      virtuaSnapshot: cache,
      scrollOffset,
    };

    listsCache.push(newListCache);

    // keep trying to save the cache until it succeeds or is empty
    while (listsCache.length > 0) {
      try {
        sessionStorage.setItem("vil-cache", JSON.stringify(listsCache));
        break;
      } catch {
        listsCache.shift(); // shrink the cache and retry
      }
    }
  };
}
