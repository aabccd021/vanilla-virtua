console.log("foo");

const newChild = document.createElement("h2");
newChild.textContent = "this is dynamically added";

document.body.appendChild(newChild);

const h2s = document.querySelectorAll("h2");
for (const el of h2s) {
  el.addEventListener("click", () => {
    console.log("clicked", el.textContent);
  });
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
