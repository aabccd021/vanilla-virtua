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

    appendChildren(context, Array.from(newRoot.children));

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

  requestAnimationFrame(() => {
    const infinite = init({
      children: Array.from(root.children),
    });

    render(infinite.context);
    root.replaceWith(infinite.root);
    infiniteScroll(listId, infinite.context, next, triggers);
  });
}
