import "./style.css";
import typescriptLogo from "./typescript.svg";
import viteLogo from "/vite.svg";
import { setupCounter } from "./counter.ts";
import * as virtua from "virtua/core";
import morphdom from "morphdom";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("No #app found");
}

app.innerHTML = `
  <div>
    <a href="https://vite.dev" target="_blank">
      <img src="${viteLogo}" class="logo" alt="Vite logo" />
    </a>
    <a href="https://www.typescriptlang.org/" target="_blank">
      <img src="${typescriptLogo}" class="logo vanilla" alt="TypeScript logo" />
    </a>
    <h1>Vite + TypeScript</h1>
    <div class="card">
      <button id="counter" type="button"></button>
    </div>
    <p class="read-the-docs">
      Click on the Vite and TypeScript logos to learn more
    </p>
  </div>
`;
setupCounter(document.querySelector<HTMLButtonElement>("#counter")!);

const rand = [
  20, 70, 50, 130, 120, 130, 90, 90, 120, 130, 110, 120, 50, 130, 120, 50, 120,
  70, 80, 60, 80, 90, 130, 110, 90, 50, 120, 80, 120, 130, 80, 70, 90, 100, 70,
  70, 110, 50, 140, 130, 80, 100, 50, 90, 50, 80, 140, 120, 130, 70, 70, 110,
  90, 70, 80, 100, 50, 80, 90, 80, 130, 100, 50, 110, 70, 70, 130, 130, 50, 120,
  50, 50, 90, 70, 110, 110, 110, 140, 130, 100, 90, 130, 130, 90, 50, 60, 110,
  60, 50, 130, 90, 110, 80, 100, 60, 70, 60, 110, 140, 50,
];

interface ListResizer {
  _observeRoot(viewportElement: HTMLElement): void;
  _observeItem: virtua.ItemResizeObserver;
  _dispose(): void;
}

const vlist = document.createElement("div");
vlist.style.display = "block";
vlist.style.overflowY = "auto";
vlist.style.contain = "strict";
vlist.style.width = "100%";
vlist.style.height = "500px";

const childrenEls = rand.map((height, i) => {
  const el = document.createElement("div");
  el.textContent = `Item ${i + 1}`;
  el.style.border = "1px solid #ccc";
  el.style.height = `${height}px`;
  return el;
});

let store: virtua.VirtualStore | undefined;
let resizer: ListResizer | undefined;
let scroller: virtua.Scroller | undefined;
let jumpCount: number | undefined;

const virtualizedView = (
  children: HTMLElement[],
): [HTMLElement, () => void] => {
  const getElement = (i: number) => children[i];
  const count = children.length;

  const localstore =
    store ??
    virtua.createVirtualStore(
      count,
      undefined,
      undefined,
      undefined,
      undefined,
      true,
    );

  if (store === undefined) {
    localstore._subscribe(virtua.UPDATE_VIRTUAL_STATE, (sync) => {
      render();
    });
    store = localstore;
  }


  const localresizer = resizer ?? virtua.createResizer(localstore, false);
  if (resizer === undefined) {
    localresizer._observeRoot(vlist);
    resizer = localresizer;
  }

  const localscroller = scroller ?? virtua.createScroller(localstore, false);
  if (scroller === undefined) {
    localscroller._observe(vlist);
    scroller = localscroller;
  }

  const newJumpCount = localstore._getJumpCount();
  if (jumpCount !== newJumpCount) {
    console.log("fixing scroll jump")
    localscroller._fixScrollJump();
  }
  jumpCount = jumpCount ?? newJumpCount;


  if (count !== localstore._getItemsLength()) {
    localstore._update(virtua.ACTION_ITEMS_LENGTH_CHANGE, [count, false]);
  }

  const unsubscribeList = new Array<() => void>(count);

  function unsubscribe() {
    unsubscribeList.forEach((unsub) => unsub());
  }

  const getListItem = (index: number) => {
    const e = getElement(index);

    const hide = localstore._isUnmeasuredItem(index);

    const el = document.createElement("div");
    el.style.position = hide ? "" : "absolute";
    el.style.visibility = hide ? "hidden" : "visible";
    el.style.width = "100%";
    el.style.left = "0";
    el.style.top = `${localstore._getItemOffset(index).toString()}px`;
    el.appendChild(e);

    const unobserve = localresizer._observeItem(el, index);
    unsubscribeList.push(unobserve);

    return el;
  };

  const items: Element[] = [];
  const [startIndex, endIndex] = localstore._getRange();
  for (let i = startIndex, j = endIndex; i <= j; i++) {
    items.push(getListItem(i));
  }

  const virtualizer = document.createElement("div");
  virtualizer.style.overflowAnchor = "none";
  virtualizer.style.flex = "none";
  virtualizer.style.position = "relative";
  virtualizer.style.visibility = "hidden";
  virtualizer.style.width = "100%";
  virtualizer.style.height = `${localstore._getTotalSize()}px`;
  items.forEach((item) => virtualizer.appendChild(item));

  return [virtualizer, unsubscribe];
};

console.log("Hello Vite + TypeScript!");

app.appendChild(vlist);


const virtualizer = document.createElement("div");
vlist.appendChild(virtualizer);

let unsubscribe: () => void = () => {};

const render = () => {
  requestAnimationFrame(() => {
    console.log("render");
    unsubscribe();
    const [vNew, unsub] = virtualizedView(childrenEls);
    unsubscribe = unsub;
    morphdom(virtualizer, vNew);
  })
}

render();
