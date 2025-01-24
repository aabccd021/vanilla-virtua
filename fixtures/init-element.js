/**
 * @param {Element} el
 * @return {function(): void}
 */
export function vilInitChild(el) {
  const abortController = new AbortController();
  el.addEventListener(
    "click",
    () => {
      console.warn(`Clicked on ${el.textContent}`);
    },
    { signal: abortController.signal },
  );

  return () => {
    abortController.abort();
  };
}
