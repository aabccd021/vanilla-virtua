import { appendItems, init, prependItems, setReverse, shiftItems, spliceItems } from "../src/vlist.ts";

const heights = [20, 40, 80, 77];

const createRows = (num: number, offset: number) => {
  return Array.from({ length: num }).map((_, i) => {
    const index = i + offset;
    const row = document.createElement("div");
    const height = heights[Math.abs(index) % 4];
    row.style.height = `${height}px`;
    row.style.borderBottom = "solid 1px #ccc";
    row.style.background = "#fff";
    row.textContent = index.toString();
    return { element: row, index };
  });
};

let auto = false;
let amount = 4;
let prepend = false;
let increase = true;
let reverse = false;
let timer: ReturnType<typeof setInterval> | undefined;

let rows = createRows(amount, 0);

const myList = init({
  style: { flex: "1" },
  reverse,
  shift: prepend,
  children: rows.map((row) => row.element),
});

const update = () => {
  if (increase) {
    if (prepend) {
      const newRows = createRows(amount, (rows[0]?.index ?? 0) - amount);
      rows = newRows.concat(rows);
      prependItems(
        myList,
        newRows.map((row) => row.element),
      );
    } else {
      const newRows = createRows(amount, (rows.at(-1)?.index ?? 0) + 1);
      rows = rows.concat(newRows);
      appendItems(
        myList,
        newRows.map((row) => row.element),
      );
    }
  } else if (prepend) {
    shiftItems(myList, amount);
  } else {
    spliceItems(myList, amount);
  }
};

const prependInput = document.createElement("input");
prependInput.type = "checkbox";
prependInput.style.marginLeft = "4px";
prependInput.checked = prepend;
prependInput.addEventListener("change", () => {
  prepend = !prepend;
  prependInput.checked = prepend;
  myList.virtualizer.shift = prepend;
});

const prependLabel = document.createElement("label");
prependLabel.style.marginRight = "4px";
prependLabel.appendChild(prependInput);
prependLabel.appendChild(document.createTextNode("prepend"));

const increaseInput = document.createElement("input");
increaseInput.type = "radio";
increaseInput.style.marginLeft = "4px";
increaseInput.checked = increase;
increaseInput.addEventListener("change", () => {
  increase = true;
  increaseInput.checked = increase;
  decreaseInput.checked = !increase;
});

const increaseLabel = document.createElement("label");
increaseLabel.style.marginRight = "4px";
increaseLabel.appendChild(increaseInput);
increaseLabel.appendChild(document.createTextNode("increase"));

const decreaseInput = document.createElement("input");
decreaseInput.type = "radio";
decreaseInput.style.marginLeft = "4px";
decreaseInput.checked = !increase;
decreaseInput.addEventListener("change", () => {
  increase = false;
  decreaseInput.checked = !increase;
  increaseInput.checked = increase;
});

const decreaseLabel = document.createElement("label");
decreaseLabel.style.marginRight = "4px";
decreaseLabel.appendChild(decreaseInput);
decreaseLabel.appendChild(document.createTextNode("decrease"));

const amountInput = document.createElement("input");
amountInput.style.marginLeft = "4px";
amountInput.value = amount.toString();
amountInput.type = "number";
amountInput.min = "1";
amountInput.max = "10000";
amountInput.step = "1";
amountInput.addEventListener("change", () => {
  amount = Number(amountInput.value);
  amountInput.value = amount.toString();
});

const inputs = document.createElement("div");
inputs.appendChild(prependLabel);
inputs.appendChild(increaseLabel);
inputs.appendChild(decreaseLabel);
inputs.appendChild(amountInput);

const reverseInput = document.createElement("input");
reverseInput.type = "checkbox";
reverseInput.style.marginLeft = "4px";
reverseInput.checked = reverse;
reverseInput.addEventListener("change", () => {
  reverse = !reverse;
  reverseInput.checked = reverse;
  setReverse(myList, reverse);
});

const lreverseLabel = document.createElement("label");
lreverseLabel.style.marginRight = "4px";
lreverseLabel.appendChild(reverseInput);
lreverseLabel.appendChild(document.createTextNode("reverse"));

const reverseDiv = document.createElement("div");
reverseDiv.appendChild(lreverseLabel);

const autoInput = document.createElement("input");
autoInput.type = "checkbox";
autoInput.style.marginLeft = "4px";
autoInput.checked = auto;
autoInput.addEventListener("change", () => {
  auto = !auto;
  autoInput.checked = auto;
  if (auto) {
    timer = setInterval(update, 500);
  } else if (timer !== undefined) {
    clearInterval(timer);
  }
});

const autoLabel = document.createElement("label");
autoLabel.style.marginRight = "16px";
autoLabel.appendChild(autoInput);
autoLabel.appendChild(document.createTextNode("auto"));

const updateButton = document.createElement("button");
updateButton.textContent = "update";
updateButton.addEventListener("click", () => {
  update();
});

const div6 = document.createElement("div");
div6.appendChild(autoLabel);
div6.appendChild(updateButton);

const div = document.createElement("div");
div.style.height = "100vh";
div.style.display = "flex";
div.style.flexDirection = "column";
div.appendChild(inputs);
div.appendChild(reverseDiv);
div.appendChild(div6);
div.appendChild(myList.root);

const storyBookRoot = document.getElementById("storybook-root");
if (storyBookRoot === null) {
  throw new Error("Root element not found");
}

storyBookRoot.appendChild(div);
