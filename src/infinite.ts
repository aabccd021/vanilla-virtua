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
      const newRootEl = newDoc.querySelector(
        `[data-infinite-root="${listId}"]`,
      );
      if (newRootEl === null) {
        throw new Error(`Root element not found: ${listId}`);
      }
      triggerEl.removeAttribute("data-infinite-trigger");
      for (const newChild of newRootEl.children) {
        rootEl.appendChild(newChild);
      }
      const newNextEl = newDoc.querySelector<HTMLAnchorElement>(
        `a[data-infinite-next="${listId}"]`,
      );
      if (newNextEl === null) {
        nextEl.remove();
        return;
      }
      nextEl.replaceWith(newNextEl);
      infiniteScroll(rootEl, newNextEl, listId);
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
    throw new Error("Absurd");
  }
  const nextEl = document.body.querySelector<HTMLAnchorElement>(
    `a[data-infinite-next="${listId}"]`,
  );
  if (nextEl === null) {
    throw new Error(`Next element not found: ${rootEl}`);
  }
  infiniteScroll(rootEl, nextEl, listId);
}
