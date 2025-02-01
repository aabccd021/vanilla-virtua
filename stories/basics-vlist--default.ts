import { init as vlistInit } from "../src/vlist.ts";

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

const vlist = vlistInit({
  style: { height: "100vh" },
  children: createRows(1000),
});

const storyBookRoot = document.getElementById("storybook-root");
if (storyBookRoot === null) {
  throw new Error("Root element not found");
}

storyBookRoot.appendChild(vlist.root);
