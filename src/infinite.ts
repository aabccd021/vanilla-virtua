function infiniteScroll(
  listId: string,
  root: HTMLElement,
  next: HTMLAnchorElement,
): void {
  const triggers = root.querySelectorAll(`[data-infinite-trigger="${listId}"]`);

  const observer = new IntersectionObserver(async (entries, observer) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) {
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

      for (const newChild of newRoot.children) {
        root.appendChild(newChild);
      }

      const newNext = newDoc.querySelector<HTMLAnchorElement>(
        `a[data-infinite-next="${listId}"]`,
      );

      if (newNext === null) {
        for (const trigger of triggers) {
          trigger.removeAttribute("data-infinite-trigger");
        }
        return;
      }

      next.replaceWith(newNext);
      infiniteScroll(listId, root, newNext);
    }
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
  infiniteScroll(listId, root, next);
}
