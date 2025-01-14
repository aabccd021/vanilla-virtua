console.log("foo");

const newChild = document.createElement("h2");
newChild.textContent = "this is dynamically added";

document.body.appendChild(newChild);

window.addEventListener(
  "freeze:page-loaded",
  () => {
    window.dispatchEvent(
      new CustomEvent("freeze:subscribe", { detail: import.meta.url }),
    );
  },
  { once: true },
);
