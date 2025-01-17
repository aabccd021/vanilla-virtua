type Unsubscribe = () => void;

export function init(): Unsubscribe {
  const h1 = document.createElement("h1");
  h1.textContent = "Dynamic";
  h1.dataset.testid = "dynamic";
  document.body.appendChild(h1);

  return (): void => {
    h1.remove();
  };
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
