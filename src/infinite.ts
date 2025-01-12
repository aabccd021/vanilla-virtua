function infiniteScroll(
  listId: string,
  rootEl: HTMLElement,
  nextEl: HTMLAnchorElement,
  triggerEl: Element,
): void {
  const observer = new IntersectionObserver(async (entries, observer) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) {
        return;
      }
      observer.disconnect();
      const response = await fetch(nextEl.href);
      const html = await response.text();
      const newDoc = new DOMParser().parseFromString(html, "text/html");
      const newRootEl = newDoc.querySelector(
        `[data-infinite-root="${listId}"]`,
      );
      if (newRootEl === null) {
        return;
      }
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
      const newTriggerEl = newRootEl.querySelector(
        `[data-infinite-trigger="${listId}"]`,
      );
      if (newTriggerEl === null) {
        return;
      }
      infiniteScroll(listId, rootEl, newNextEl, newTriggerEl);
    }
  });

  observer.observe(triggerEl);
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
    continue;
  }
  const triggerEl = rootEl.querySelector(`[data-infinite-trigger="${listId}"]`);
  if (triggerEl === null) {
    continue;
  }
  infiniteScroll(listId, rootEl, nextEl, triggerEl);
}
