export function init() {
  const h1 = document.createElement("h1");
  h1.textContent = "Dynamic";
  h1.dataset.testid = "main";
  document.body.appendChild(h1);

  h1.addEventListener("click", () => {
    console.log("clicked");
  });

  return () => {
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
