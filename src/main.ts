import { appendChildren, init } from "./index.ts";

// Create a list item with a random height
function createListItem(): HTMLElement {
  const height = Math.floor(Math.random() * 100) + 20;
  const el = document.createElement("div");
  el.textContent = `Height: ${height}px`;
  el.style.border = "1px solid #ccc";
  el.style.height = `${height}px`;
  return el;
}

// Initialize vList with 30 children
const children = Array.from({ length: 30 }, createListItem);
const { context, root } = init({ children });
document.getElementById("app")!.appendChild(root);

// Add 10 children every second until we have 100 children
const interval = setInterval(() => {
  if (context.state.children.length > 100) {
    clearInterval(interval);
    return;
  }

  const newChildren = Array.from({ length: 10 }, createListItem);
  appendChildren(context, newChildren);
}, 1000);
