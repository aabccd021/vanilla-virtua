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

const LENGTH = 1000;
let scrollIndex = 567;
let scrollIndexAlign = "start";
let smooth = false;
let scrollOffset = 1000;

const scrollIndexInput = document.createElement("input");
scrollIndexInput.type = "number";
scrollIndexInput.value = scrollIndex.toString();
scrollIndexInput.addEventListener("input", () => {
  scrollIndex = Number(scrollIndexInput.value);
  scrollIndexInput.value = scrollIndex.toString();
});

const scrollIndexButton = document.createElement("button");
scrollIndexButton.textContent = "scroll to index";
scrollIndexButton.addEventListener("click", () => {
  vlist.virtualizer.scroller.$scrollToIndex(scrollIndex, {
    align: scrollIndexAlign,
    smooth,
  });
});

const randomizeButton = document.createElement("button");
randomizeButton.textContent = "randomize";
randomizeButton.addEventListener("click", () => {
  scrollIndex = Math.round(LENGTH * Math.random());
  scrollIndexInput.value = scrollIndex.toString();
});

const startInput = document.createElement("input");
startInput.type = "radio";
startInput.style.marginLeft = "4px";
startInput.checked = scrollIndexAlign === "start";
startInput.addEventListener("change", () => {
  scrollIndexAlign = "start";
  centerInput.checked = false;
  endInput.checked = false;
});

const startLabel = document.createElement("label");
startLabel.style.marginLeft = "4px";
startLabel.appendChild(startInput);
startLabel.appendChild(document.createTextNode("start"));

const centerInput = document.createElement("input");
centerInput.type = "radio";
centerInput.style.marginLeft = "4px";
centerInput.checked = scrollIndexAlign === "center";
centerInput.addEventListener("change", () => {
  scrollIndexAlign = "center";
  startInput.checked = false;
  endInput.checked = false;
});

const centerLabel = document.createElement("label");
centerLabel.style.marginLeft = "4px";
centerLabel.appendChild(centerInput);
centerLabel.appendChild(document.createTextNode("center"));

const endInput = document.createElement("input");
endInput.type = "radio";
endInput.style.marginLeft = "4px";
endInput.checked = scrollIndexAlign === "end";
endInput.addEventListener("change", () => {
  scrollIndexAlign = "end";
  startInput.checked = false;
  centerInput.checked = false;
});

const endLabel = document.createElement("label");
endLabel.style.marginLeft = "4px";
endLabel.appendChild(endInput);
endLabel.appendChild(document.createTextNode("end"));

const smoothInput = document.createElement("input");
smoothInput.type = "checkbox";
smoothInput.style.marginLeft = "4px";
smoothInput.checked = smooth;
smoothInput.addEventListener("change", () => {
  smooth = !smooth;
  smoothInput.checked = smooth;
});

const smoothLabel = document.createElement("label");
smoothLabel.style.marginLeft = "4px";
smoothLabel.appendChild(smoothInput);
smoothLabel.appendChild(document.createTextNode("smooth"));

const inputsDiv = document.createElement("div");
inputsDiv.appendChild(scrollIndexInput);
inputsDiv.appendChild(scrollIndexButton);
inputsDiv.appendChild(randomizeButton);
inputsDiv.appendChild(startLabel);
inputsDiv.appendChild(centerLabel);
inputsDiv.appendChild(endLabel);
inputsDiv.appendChild(smoothLabel);

const scrollOffsetInput = document.createElement("input");
scrollOffsetInput.type = "number";
scrollOffsetInput.value = scrollOffset.toString();
scrollOffsetInput.addEventListener("input", () => {
  scrollOffset = Number(scrollOffsetInput.value);
  scrollOffsetInput.value = scrollOffset.toString();
});

const scrollOffsetButton = document.createElement("button");
scrollOffsetButton.textContent = "scroll to offset";
scrollOffsetButton.addEventListener("click", () => {
  vlist.virtualizer.scroller.$scrollTo(scrollOffset);
});

const scrollOffsetByButton = document.createElement("button");
scrollOffsetByButton.textContent = "scroll by offset";
scrollOffsetByButton.addEventListener("click", () => {
  vlist.virtualizer.scroller.$scrollBy(scrollOffset);
});

const buttonsDiv = document.createElement("div");
buttonsDiv.appendChild(scrollOffsetInput);
buttonsDiv.appendChild(scrollOffsetButton);
buttonsDiv.appendChild(scrollOffsetByButton);

const vlist = vlistInit({
  style: { flex: "1" },
  children: createRows(LENGTH),
});

const div = document.createElement("div");
div.style.height = "100vh";
div.style.display = "flex";
div.style.flexDirection = "column";
div.appendChild(inputsDiv);
div.appendChild(buttonsDiv);
div.appendChild(vlist.root);

const storyBookRoot = document.getElementById("storybook-root");
if (storyBookRoot === null) {
  throw new Error("Root element not found");
}

storyBookRoot.appendChild(div);
