import { appendChildren, prependChildren, shiftChildren, spliceChildren, init as vListInit } from "../src/vList.ts";

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
    return row;
  });
};
let auto = false;
let amount = 4;
let prepend = false;
let increase = true;
let reverse = false;

const update = () => {
  if (increase) {
    if (prepend) {
      prependChildren();
    } else {
      appendChildren();
    }
  } else if (prepend) {
    shiftChildren();
  } else {
    spliceChildren();
  }
};

const input1 = document.createElement("input");
input1.type = "checkbox";
input1.style.marginLeft = "4px";
input1.checked = prepend;
input1.addEventListener("change", () => {
  prepend = !prepend;
  input1.checked = prepend;
  // TODO: vlist.setPrepend
});

const label1 = document.createElement("label");
label1.style.marginRight = "4px";
label1.appendChild(input1);
label1.appendChild(document.createTextNode("prepend"));

const input2 = document.createElement("input");
input2.type = "radio";
input2.style.marginLeft = "4px";
input2.checked = increase;
input2.addEventListener("change", () => {
  increase = true;
  // TODO
});

const label2 = document.createElement("label");
label2.style.marginRight = "4px";
label2.appendChild(input2);
label2.appendChild(document.createTextNode("increase"));

const input3 = document.createElement("input");
input3.type = "radio";
input3.style.marginLeft = "4px";
input3.checked = !increase;
input3.addEventListener("change", () => {
  increase = false;
  // TODO
});

const label3 = document.createElement("label");
label3.style.marginRight = "4px";
label3.appendChild(input3);
label3.appendChild(document.createTextNode("decrease"));

const input4 = document.createElement("input");
input4.style.marginLeft = "4px";
input4.value = amount.toString();
input4.type = "number";
input4.min = "1";
input4.max = "10000";
input4.step = "1";
input4.addEventListener("change", () => {
  amount = Number(input4.value);
  // TODO
});

const inputs = document.createElement("div");
inputs.appendChild(label1);
inputs.appendChild(label2);
inputs.appendChild(label3);
inputs.appendChild(input4);

const div4 = document.createElement("div");
div4.appendChild(input4);

const input5 = document.createElement("input");
input5.type = "checkbox";
input5.style.marginLeft = "4px";
input5.checked = reverse;
input5.addEventListener("change", () => {
  reverse = !reverse;
  input5.checked = reverse;
  // TODO
});

const label5 = document.createElement("label");
label5.style.marginRight = "4px";
label5.appendChild(input5);
label5.appendChild(document.createTextNode("reverse"));

const div5 = document.createElement("div");
div5.appendChild(label5);

const input6 = document.createElement("input");
input6.type = "checkbox";
input6.style.marginLeft = "4px";
input6.checked = auto;
input6.addEventListener("change", () => {
  auto = !auto;
  input6.checked = auto;
  // TODO
});

const label6 = document.createElement("label");
label6.style.marginRight = "16px";
label6.appendChild(input6);
label6.appendChild(document.createTextNode("auto"));

const button6 = document.createElement("button");
button6.textContent = "update";
button6.addEventListener("click", () => {
  update();
});

const div6 = document.createElement("div");
div6.appendChild(label6);
div6.appendChild(button6);

const vList = vListInit({
  style: { flex: "1" },
  reverse,
  shift: prepend,
  children: createRows(amount, 0),
});

const div = document.createElement("div");
div.style.height = "100vh";
div.style.display = "flex";
div.style.flexDirection = "column";
div.appendChild(inputs);
div.appendChild(div4);
div.appendChild(div5);
div.appendChild(div6);
div.appendChild(vList.root);

const storyBookRoot = document.getElementById("storybook-root");
if (storyBookRoot === null) {
  throw new Error("Root element not found");
}

storyBookRoot.appendChild(div);
