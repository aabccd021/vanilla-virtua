import { appendChildren, init } from "./index.ts";

// Create a list item with a random height
function createListItem() {
  const height = Math.floor(Math.random() * 100) + 20;
  const el = document.createElement("div");
  el.textContent = `Height: ${height}px`;
  el.style.border = "1px solid #ccc";
  el.style.height = `${height}px`;
  return el;
}

// Initialize vlist with 30 list items
const children = Array.from({ length: 30 }, createListItem);
const { context, root } = init({ children });
document.getElementById("app")!.appendChild(root);

// Append 10 more list items every time the button is clicked
document.getElementById("append")!.addEventListener("click", () => {
  const newChildren = Array.from({ length: 10 }, createListItem);
  appendChildren(context, newChildren);
})
