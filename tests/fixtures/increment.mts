type Unsubscribe = () => void;

export function init(): Unsubscribe {
  console.log("init");
  const incrementElt = document.querySelector("[data-testid=increment]");
  if (incrementElt === null) {
    throw new Error("Absurd");
  }
  console.log({ textContent: incrementElt.textContent });

  const count = Number(incrementElt.textContent) + 1;
  console.log({ count });
  incrementElt.textContent = String(count);
  return (): void => {};
}

window.addEventListener(
  "freeze:page-loaded",
  () => {
    window.dispatchEvent(
      new CustomEvent("freeze:subscribe", { detail: import.meta.url }),
    );
  },
  { once: true },
);
