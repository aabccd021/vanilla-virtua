/**
 * @typedef {Function} Unsub
 * @returns {void}
 */

/**
 * @typedef {Object} VilInitEvent
 * @property {Element} element
 * @property {string} listId
 */

/**
 * @typedef {Function} InitChild
 * @param {VilInitEvent} event
 * @returns {Promise<Unsub | undefined> | Unsub | undefined}
 */
export function vilInitChild({ listId, element }) {
  // assert element is HTMLElement
  if (listId !== "main-list" || !(element instanceof HTMLElement)) {
    return;
  }
  element.addEventListener("click", () => {
    console.warn(`Clicked on ${element.textContent}`);
  });

  const textContent = element.textContent;

  element.textContent = `${textContent} ${element.dataset["itemId"]}`;

  return () => {
    element.textContent = "Item";
  };
}
