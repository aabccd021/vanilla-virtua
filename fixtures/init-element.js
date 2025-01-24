/**
 * @typedef {Object} VilInitEvent
 * @property {Element} element
 * @property {string} listId
 */

/**
 * @param {VilInitEvent} e
 * @return {{function(): void | void}}
 */
export function vilInitChild(e) {
  if (e.listId !== "main-list") {
    return;
  }
  const abortController = new AbortController();
  e.element.addEventListener(
    "click",
    () => {
      console.warn(`Clicked on ${e.element.textContent}`);
    },
    { signal: abortController.signal },
  );

  return () => {
    // abortController.abort();
  };
}
