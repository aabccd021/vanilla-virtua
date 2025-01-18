console.log("increment.js");

function onClick() {
  console.log("click increment");
}

export function init() {
  console.log("increment init");
  const incrementElt = document.querySelector("[data-testid=main]");
  if (incrementElt === null) {
    throw new Error("Absurd");
  }

  const count = Number(incrementElt.textContent) + 1;
  incrementElt.textContent = String(count);

  incrementElt.addEventListener("click", onClick);

  return () => {
    incrementElt.removeEventListener("click", onClick);
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
