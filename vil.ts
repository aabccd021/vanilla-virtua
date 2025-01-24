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

async function triggerInitChild(listId: string, inits: InitChild[], children: Element[]): Promise<Unsub[]> {
  const vilInitPromises = inits.flatMap((init) => {
    return children.map((child) => {
      const event: VilInitEvent = {
        element: child,
        listId,
      };
      return init(event);
    });
  });

  const vilInitResult = await Promise.allSettled(vilInitPromises);

  for (const initResult of vilInitResult) {
    if (initResult.status === "rejected") {
      console.error(initResult.reason);
    }
  }

  const unsubs = vilInitResult
    .filter((init) => init.status === "fulfilled")
    .map((init) => init.value)
    .filter((init) => init !== undefined);

  return unsubs;
}

function infiniteScroll(
  listId: string,
  unsubs: Unsub[],
  childInits: InitChild[],
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

    const newUnsubs = await triggerInitChild(listId, childInits, newChildren);
    for (const unsub of newUnsubs) {
      unsubs.push(unsub);
    }

    appendChildren(context, newChildren);

    const newNext = newDoc.querySelector<HTMLAnchorElement>(`a[data-infinite-next="${listId}"]`);
    if (newNext === null) {
      next.remove();
      return;
    }
    next.replaceWith(newNext);

    infiniteScroll(listId, unsubs, childInits, context, newNext, newTriggers);
  });

  for (const trigger of Array.from(triggers)) {
    observer.observe(trigger);
  }
}

function waitAnimationFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

type Unsub = () => void;

type VilInitEvent = {
  element: Element;
  listId: string;
};

type InitChild = (event: VilInitEvent) => Promise<Unsub | undefined> | undefined;

type FreezeInitEvent = {
  fromCache: boolean;
};

let initialized = false;
async function init(event: FreezeInitEvent): Promise<Unsub | undefined> {
  // const localInitialized = initialized;
  if (!initialized) {
    initialized = true;
  }

  const root = document.body.querySelector("[data-infinite-root]");
  if (!(root instanceof HTMLElement)) {
    return;
  }

  const listId = root.dataset["infiniteRoot"];
  if (listId === undefined) {
    throw new Error("List ID not found");
  }

  const triggers = root.querySelectorAll(`[data-infinite-trigger="${listId}"]`);
  const next = document.body.querySelector<HTMLAnchorElement>(`a[data-infinite-next="${listId}"]`);

  const moduleInitPromises = Array.from(document.querySelectorAll("script"))
    .filter((script) => script.type === "module")
    .map(async (script): Promise<InitChild | undefined> => {
      const module = await import(script.src);
      if (
        typeof module === "object" &&
        module !== null &&
        "vilInitChild" in module &&
        typeof module.vilInitChild === "function"
      ) {
        return module.vilInitChild;
      }
      return undefined;
    });

  const moduleInitResults = await Promise.allSettled(moduleInitPromises);

  for (const moduleInitResult of moduleInitResults) {
    if (moduleInitResult.status === "rejected") {
      console.error(moduleInitResult.reason);
    }
  }

  const childInits = moduleInitResults
    .filter((init) => init.status === "fulfilled")
    .map((init) => init.value)
    .filter((init) => init !== undefined);

  const unsubs = await triggerInitChild(listId, childInits, Array.from(root.children));

  const cacheKey = listId + location.pathname + location.search;

  const cache = event.fromCache ? getListCache(cacheKey) : undefined;
  // const cache = localInitialized ? getListCache(cacheKey) : undefined;

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

  if (next !== null) {
    infiniteScroll(listId, unsubs, childInits, vList.context, next, triggers);
  }

  return (): void => {
    const cache = vList.context.store.$getCacheSnapshot();
    const scrollOffset = vList.context.store.$getScrollOffset();

    for (const child of vList.context.state.children) {
      root.appendChild(child);
    }

    vList.root.remove();

    for (const unsub of unsubs) {
      unsub();
    }

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

export const freezePageLoad = init;
