import { init as vListInit } from "../src/vList.ts";

const createColumns = (num: number) => {
  return Array.from({ length: num }).map((_, i) => {
    const div = document.createElement("div");
    div.style.width = i % 3 === 0 ? "100px" : "60px";
    div.style.borderRight = "solid 1px #ccc";
    div.style.background = "#fff";
    div.textContent = `Column ${i}`;
    return div;
  });
};

const vList = vListInit({
  style: { width: "100%", height: "200px" },
  horizontal: true,
  children: createColumns(1000),
});

const div = document.createElement("div");
div.style.padding = "10px";
div.appendChild(vList.root);

const storyBookRoot = document.getElementById("storybook-root");
if (storyBookRoot === null) {
  throw new Error("Root element not found");
}

storyBookRoot.appendChild(div);
