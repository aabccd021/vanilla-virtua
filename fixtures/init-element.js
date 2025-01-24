/**
 * @typedef {Object} VilInitEvent
 * @property {Element} element
 * @property {string} listId
 */

/**
 * @param {VilInitEvent} e
 * @return {{function(): void | void}}
 */
export function vilInitChild({ listId, element }) {
  if (listId !== "main-list") {
    return;
  }
  element.addEventListener("click", () => {
    console.warn(`Clicked on ${element.textContent}`);
  });

  element.textContent = `Item ${element.dataset["itemId"]}`;

  return () => {
    // abortController.abort();
  };
}
