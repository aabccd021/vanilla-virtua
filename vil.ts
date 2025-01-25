import type { CacheSnapshot } from "virtua/core";
import { type Context, type InitResult, appendChildren, render, init as vListInit } from "./index.ts";

type ListCache = {
  virtuaSnapshot: CacheSnapshot;
  scrollOffset: number;
};

type Cache = Record<string, ListCache>;

type Unsub = () => void;

type VilInitEvent = {
  element: Element;
  listId: string;
};

type InitChild = (event: VilInitEvent) => Promise<Unsub | undefined> | undefined;

type FreezeInitEvent = {
  cache?: Cache;
};

async function triggerInitChild(listId: string, inits: InitChild[], children: Element[]): Promise<Unsub[]> {
  const vilInitPromises = inits.flatMap((init) => children.map((child) => init({ element: child, listId })));

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

async function initRoot(
  root: Element,
  cache: Cache | undefined,
): Promise<{
  unsubs: Unsub[];
  vList: InitResult;
  root: HTMLElement;
  listId: string;
}> {
  if (!(root instanceof HTMLElement)) {
    throw new Error("Root is not an HTMLElement");
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

  const listCache = cache?.[listId];

  const vList = vListInit({
    children: Array.from(root.children),
    cache: listCache?.virtuaSnapshot,
  });

  await waitAnimationFrame();

  root.appendChild(vList.root);

  render(vList.context);

  if (listCache?.scrollOffset) {
    await waitAnimationFrame();
    vList.context.scroller.$scrollTo(listCache.scrollOffset);
  }

  if (next !== null) {
    infiniteScroll(listId, unsubs, childInits, vList.context, next, triggers);
  }

  return { unsubs, vList, root, listId };
}

async function init({ cache }: FreezeInitEvent): Promise<Unsub | undefined> {
  const roots = document.body.querySelectorAll("[data-infinite-root]");

  const rootInitPromises = Array.from(roots).map((root) => initRoot(root, cache));
  const rootInitResults = await Promise.allSettled(rootInitPromises);
  const lists = rootInitResults.filter((result) => result.status === "fulfilled").map((result) => result.value);

  return (): Cache => {
    const cache: Cache = {};
    for (const { unsubs, vList, root, listId } of lists) {
      const virtuaSnapshot = vList.context.store.$getCacheSnapshot();
      const scrollOffset = vList.context.store.$getScrollOffset();

      for (const child of vList.context.state.children) {
        root.appendChild(child);
      }

      vList.root.remove();

      for (const unsub of unsubs) {
        unsub();
      }

      const newListCache: ListCache = {
        virtuaSnapshot,
        scrollOffset,
      };

      cache[listId] = newListCache;
    }
    return cache;
  };
}

export const freezePageLoad = init;
