import { init } from "../src/virtualizer.ts";

const container = document.querySelector(".container");
const root = document.querySelector(".root");

if (container === null || root === null || !(container instanceof HTMLElement) || !(root instanceof HTMLElement)) {
  throw new Error("Invalid container or root element");
}

init({
  container,
  root,
  totalSizeStyle: "height",
  offsetStyle: "top",
});
