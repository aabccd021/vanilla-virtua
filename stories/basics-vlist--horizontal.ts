import { init as vListInit } from "../src/vList.ts";

const createRows = (num: number) => {
  const heights = [20, 40, 80, 77];
  return Array.from({ length: num }).map((_, i) => {
    const div = document.createElement("div");
    div.style.height = `${heights[i % 4]}px`;
    div.style.borderBottom = "solid 1px #ccc";
    div.style.background = "#fff";
    div.textContent = `${i}`;
    return div;
  });
};

const vList = vListInit({
  style: { width: "100%", height: "200" },
  horizontal: true,
  children: createRows(1000),
});

const div = document.createElement("div");
div.style.padding = "10px";
div.appendChild(vList.root);

const storyBookRoot = document.getElementById("storybook-root");
if (storyBookRoot === null) {
  throw new Error("Root element not found");
}

storyBookRoot.appendChild(div);
