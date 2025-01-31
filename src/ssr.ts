import { appendChildren, init } from "./core.ts";

const container = document.getElementById("container");
if (container === null) {
  throw new Error("Container element not found");
}
const root = container.parentElement;
if (root === null) {
  throw new Error("Root element not found");
}
const vlist = init({
  container,
  root,
  totalSizeAttr: "height",
});

const heights = [20, 40, 80, 77];

document.getElementById("append-button")?.addEventListener("click", () => {
  const newRows = Array.from({ length: 30 }).map((_, i) => {
    const item = document.createElement("div");
    const height = heights[i % 4];
    item.style.height = `${height}px`;
    item.style.borderBottom = "solid 1px #ccc";
    item.textContent = `Height: ${height}px`;
    return item;
  });
  appendChildren(vlist.context, newRows);
});
