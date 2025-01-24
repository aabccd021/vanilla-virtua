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

  const textContent = element.textContent;

  element.textContent = `${textContent} ${element.dataset["itemId"]}`;

  return () => {
    element.textContent = "Item";
  };
}
