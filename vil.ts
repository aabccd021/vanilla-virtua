import type { CacheSnapshot } from "virtua/core";
import type { InfiniteEvent } from "./event.ts";
import { type Context, appendChildren, init as vListInit, render } from "./index.ts";

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

type Storage = {
  virtuaSnapshot: CacheSnapshot;
  scrollOffset: number;
};

type Unsub = () => void;

export async function freezePageLoad(cache?: Storage): Promise<Unsub | undefined> {
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
    throw new Error("Next not found");
  }

  const triggers = root.querySelectorAll(`[data-infinite-trigger="${listId}"]`);

  const vList = vListInit({ root, cache: cache?.virtuaSnapshot });
  await waitAnimationFrame();

  render(vList.context);

  for (const attr of Array.from(root.attributes)) {
    vList.root.setAttribute(attr.name, attr.value);
  }
  root.replaceWith(vList.root);

  if (cache?.scrollOffset) {
    await waitAnimationFrame();
    vList.context.scroller.$scrollTo(cache.scrollOffset);
  }

  // infiniteScroll(listId, vList.context, next, triggers);

  // window.dispatchEvent(
  //   new CustomEvent<InfiniteEvent>("infinite", {
  //     detail: {
  //       type: "newChildren",
  //       children: vList.context.state.children,
  //     },
  //   }),
  // );

  return (): void => {
    console.log("unsub");
    const cache = vList.context.store.$getCacheSnapshot();
    const scrollOffset = vList.context.store.$getScrollOffset();

    for (const child of vList.context.state.children) {
      vList.root.appendChild(child);
    }

    vList.container.remove();

    const storage: Storage = { virtuaSnapshot: cache, scrollOffset };

    sessionStorage.setItem(`cache-${listId}`, JSON.stringify(storage));
  };
}
