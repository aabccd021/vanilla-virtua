function infiniteScroll(
  rootEl: HTMLElement,
  nextEl: HTMLAnchorElement,
  listId: string,
): void {
  const [triggerEl, secondTrigger] = rootEl.querySelectorAll(
    `[data-infinite-trigger="${listId}"]`,
  );
  if (secondTrigger !== undefined) {
    throw new Error(`Only one trigger element is allowed: ${listId}`);
  }
  const nextPageUrl = nextEl.getAttribute("href");
  if (triggerEl === undefined || nextPageUrl === null) {
    return;
  }

  new IntersectionObserver(async (entries, observer) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) {
        return;
      }
      observer.disconnect();
      const response = await fetch(nextPageUrl);
      const html = await response.text();
      const newDoc = new DOMParser().parseFromString(html, "text/html");
      const newRoot = newDoc.querySelector(`[data-infinite-root="${listId}"]`);
      if (newRoot === null) {
        throw new Error(`Root element not found: ${listId}`);
      }
      triggerEl.removeAttribute("data-infinite-trigger");
      for (const newChild of newRoot.children) {
        rootEl.appendChild(newChild);
      }
      const newNext = newDoc.querySelector<HTMLAnchorElement>(
        `a[data-infinite-next="${listId}"]`,
      );
      if (newNext === null) {
        for (const trigger of rootEl.querySelectorAll(
          `[data-infinite-trigger="${listId}"]`,
        )) {
          trigger.removeAttribute("data-infinite-trigger");
        }
        return;
      }
      nextEl.replaceWith(newNext);
      infiniteScroll(rootEl, newNext, listId);
    }
  }).observe(triggerEl);
}

const rootEls = document.body.querySelectorAll("[data-infinite-root]");

for (const rootEl of rootEls) {
  if (!(rootEl instanceof HTMLElement)) {
    throw new Error(`Not an HTMLElement: ${rootEl}`);
  }
  const listId = rootEl.dataset["infiniteRoot"];
  if (listId === undefined) {
    throw new Error(`Root ID is undefined${rootEl}`);
  }
  const nextEl = rootEl.querySelector<HTMLAnchorElement>(
    `a[data-infinite-next="${listId}"]`,
  );
  if (nextEl === null) {
    throw new Error(`Next element not found: ${rootEl}`);
  }
  infiniteScroll(rootEl, nextEl, listId);
}
