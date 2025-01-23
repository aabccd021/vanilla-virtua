/**
 * @param {Element} el
 * @return {function(): void}
 */
export function vilInitChild(el) {
  const abortController = new AbortController();
  el.addEventListener(
    "click",
    () => {
      const testId = el.dataset.testid;
      console.warn(`Clicked on ${testId}`);
    },
    { signal: abortController.signal },
  );

  return () => {
    abortController.abort();
  };
}
