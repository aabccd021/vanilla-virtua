type Unsubscribe = () => void;

console.warn("bar.js");

export function init(): Unsubscribe {
  console.warn("bar init");
  return (): void => {
    console.warn("bar cleanup");
  };
}

window.addEventListener(
  "freeze:page-loaded",
  () => {
    console.warn("bar.js freeze:page-loaded");
    window.dispatchEvent(
      new CustomEvent("freeze:subscribe", { detail: import.meta.url }),
    );
    console.warn("bar.js freeze:subscribe");
  },
  { once: true },
);
