import "./style.css";
import { init, render, setChildren } from "./render.ts";

const app = document.querySelector<HTMLDivElement>("#app");

if (app === null) {
  throw new Error("No #app found");
}

function createChild(): HTMLElement {
  const height = Math.floor(Math.random() * 100) + 20;
  const el = document.createElement("p");
  el.textContent = `Height: ${height}px`;
  el.style.border = "1px solid #ccc";
  el.style.height = `${height}px`;
  return el;
}

const childrenEls = [createChild()];

const [context, _dispose] = init(childrenEls);
app.appendChild(context.root);
render(context)


const addChildren = () => {
  for (let i = 0; i < 100; i++) {
    childrenEls.push(createChild());
  }
  console.warn("Children length", childrenEls.length)
  setChildren(context, childrenEls);
  setTimeout(() => {
    addChildren();
  }, 1000);
}

addChildren();
