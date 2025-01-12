import * as vList from "./index.ts";

const app = document.createElement("div");
app.style.width = "100%";
app.style.height = "90dvh";

document.body.appendChild(app);

function createChild(): HTMLElement {
  const height = Math.floor(Math.random() * 100) + 20;
  const el = document.createElement("button");
  el.textContent = `Height: ${height}px`;
  el.style.border = "1px solid #ccc";
  el.style.height = `${height}px`;

  el.addEventListener("click", () => {});

  return el;
}

const children = Array.from({ length: 30 }, createChild);

const { context, root } = vList.init({ children });
app.appendChild(root);
vList.render(context);

let count = 0;
const interval = setInterval(() => {
  if (count > 10) {
    clearInterval(interval);
    return;
  }
  const newChildren = Array.from({ length: 10 }, createChild);
  vList.appendChild(context, newChildren);
  count++;
}, 1000);
