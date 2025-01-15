type Unsubscribe = () => void;

export function init(): Unsubscribe {
  return (): void => {
    console.log("unsubscribing");
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
