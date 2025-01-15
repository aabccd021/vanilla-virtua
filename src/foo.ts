type Unsubscribe = () => void;

console.warn("foo.js");

export function init(): Unsubscribe {
  console.warn("foo init");

  const newChild = document.createElement("h2");
  newChild.textContent = "this is dynamically added";
  document.body.appendChild(newChild);

  const newChild2 = document.createElement("h2");
  newChild2.textContent = "only one of these should be shown";
  document.body.appendChild(newChild2);

  const h2s = document.querySelectorAll("h2");
  for (const el of h2s) {
    el.addEventListener("click", () => {
      console.warn("clicked", el.textContent);
    });
  }

  return (): void => {
    newChild2.remove();
    console.warn("foo cleanup");
  };
}

window.addEventListener(
  "freeze:page-loaded",
  () => {
    console.warn("foo.js freeze:page-loaded");
    window.dispatchEvent(
      new CustomEvent("freeze:subscribe", { detail: import.meta.url }),
    );
    console.warn("foo.js freeze:subscribe");
  },
  { once: true },
);
