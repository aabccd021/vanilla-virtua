import "./style.css";
import { init, render, setChildren } from "./render.ts";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("No #app found");
}

const rand = [
  20, 70, 50, 130, 120, 130, 90, 90, 120, 130, 110, 120, 50, 130, 120, 50, 120,
  70, 80, 60, 80, 90, 130, 110, 90, 50, 120, 80, 120, 130, 80, 70, 90, 100, 70,
  70, 110, 50, 140, 130, 80, 100, 50, 90, 50, 80, 140, 120, 130, 70, 70, 110,
  90, 70, 80, 100, 50, 80, 90, 80, 130, 100, 50, 110, 70, 70, 130, 130, 50, 120,
  50, 50, 90, 70, 110, 110, 110, 140, 130, 100, 90, 130, 130, 90, 50, 60, 110,
  60, 50, 130, 90, 110, 80, 100, 60, 70, 60, 110, 140, 50,
];

function createChildren(height: number, index: number): HTMLElement {
  const el = document.createElement("p");
  el.textContent = `Item ${index + 1}`;
  el.style.border = "1px solid #ccc";
  el.style.height = `${height}px`;
  return el;
}

const childrenEls = createChildren(20, 0);

setChildren([childrenEls]);
init(app);
render()

let count = 1;

function addChildren() {
  count += 1;
  const newChildren = rand.slice(1, count + 1).map(createChildren);
  setChildren(newChildren);
  render();
  setTimeout(() => {
    addChildren();
  }, 1000);
}

addChildren();
