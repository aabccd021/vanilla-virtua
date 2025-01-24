/**
 * Type representing an unsubscribe function.
 * @typedef {Function} Unsub
 * @returns {void}
 */

/**
 * Type representing the initialization event for a virtualized list.
 * @typedef {Object} VilInitEvent
 * @property {Element} element - The DOM element associated with the event.
 * @property {string} listId - The ID of the list being initialized.
 */

/**
 * Type representing a function that initializes a child component.
 * @typedef {Function} InitChild
 * @param {VilInitEvent} event - The initialization event.
 * @returns {Promise<Unsub | undefined> | Unsub | undefined} - A promise that resolves to an unsubscribe function or undefined.
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
