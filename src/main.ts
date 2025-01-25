import { appendChildren, init } from "./index.ts";

const heights = [20, 40, 80, 77];

const createRows = (num: number) => 
  Array.from({ length: num }).map((_, i) => {
    const item = document.createElement("div");
    const height = heights[i % 4];
    item.style.height = `${height}px`;
    item.style.borderBottom = "solid 1px #ccc";
    item.textContent = `Height: ${height}px`;
    return item;
  });

// Initialize list with 30 items
const vlist = init({ children: createRows(30) });

// Mount list root
document
  .getElementById("app")!
  .appendChild(vlist.root);

// Append 10 items when button is clicked
document
  .getElementById("append-button")!
  .addEventListener("click", () => {
    const newRows = createRows(10);
    appendChildren(vlist.context, newRows);
  })
