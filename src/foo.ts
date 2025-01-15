type Unsubscribe = () => void;

export function init(): Unsubscribe {
  console.warn("foo.js init");
  const newChild = document.createElement("h2");
  newChild.textContent = "this is dynamically added";
  document.body.appendChild(newChild);
  console.warn("newChild added");

  const newChild2 = document.createElement("h2");
  newChild2.textContent = "only one of these should be shown";
  document.body.appendChild(newChild2);
  console.warn("newChild2 added");

  const h2s = document.querySelectorAll("h2");
  for (const el of h2s) {
    el.addEventListener("click", () => {
      console.log("clicked");
    });
  }

  return (): void => {
    console.warn("foo.js unsub");
    newChild2.remove();
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
