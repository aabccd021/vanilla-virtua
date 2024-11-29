import * as virtua from "virtua/core";

interface ListResizer {
  _observeRoot(viewportElement: HTMLElement): void;
  _observeItem: virtua.ItemResizeObserver;
  _dispose(): void;
}

interface ChildrenData {
  index: number;
  hide: boolean;
  top: string;
  element: HTMLElement;
  unsubscribe: () => void;
}

let children: HTMLElement[];
let getElement: (i: number) => HTMLElement;
let count: number;
let store: virtua.VirtualStore;
let resizer: ListResizer;
let scroller: virtua.Scroller;
let virtualizer: HTMLElement;
let virtualizerHeight: string;
let jumpCount: number;
let childrenData: ChildrenData[] = [];

export const setChildren = (newChildren: HTMLElement[]) => {
  children = newChildren;
  count = children.length;
  getElement = (i: number) => children[i];
};

export const init = (parent: HTMLElement) => {
  store = virtua.createVirtualStore(
    count,
    undefined,
    undefined,
    undefined,
    undefined,
    true,
  );

  virtualizer = document.createElement("div");
  virtualizer.style.overflowAnchor = "none";
  virtualizer.style.flex = "none";
  virtualizer.style.position = "relative";
  virtualizer.style.visibility = "hidden";
  virtualizer.style.width = "100%";

  const vlist = document.createElement("div");
  vlist.style.display = "block";
  vlist.style.overflowY = "auto";
  vlist.style.contain = "strict";
  vlist.style.width = "400px";
  vlist.style.height = "400px";
  vlist.appendChild(virtualizer);

  parent.appendChild(vlist);

  store._subscribe(virtua.UPDATE_VIRTUAL_STATE, (sync) => {
    // if(!sync) {
    // rerender();
    // return
    // }
    requestAnimationFrame(() => {
      rerender();
    });
  });
  resizer = virtua.createResizer(store, false);
  resizer._observeRoot(vlist);

  scroller = virtua.createScroller(store, false);
  scroller._observe(vlist);

  requestAnimationFrame(() => {
    rerender();
  });
};

let rendering = false;
export const rerender = () => {
  if (rendering) {
    return;
  }
  rendering = true;
  if (count !== store._getItemsLength()) {
    store._update(virtua.ACTION_ITEMS_LENGTH_CHANGE, [count, false]);
    rendering = false;
    return;
  }
  const newJumpCount = store._getJumpCount();
  if (jumpCount !== newJumpCount) {
    scroller._fixScrollJump();
    jumpCount = newJumpCount;
    rendering = false;
    return;
  }
  const newVirtualizerHeight = `${store._getTotalSize()}px`;
  if (virtualizerHeight !== newVirtualizerHeight) {
    virtualizer.style.height = newVirtualizerHeight;
    virtualizerHeight = newVirtualizerHeight;
  }

  const [startIndex, endIndex] = store._getRange();
  const newChildrenData: ChildrenData[] = [];
  for (let newIndex = startIndex, j = endIndex; newIndex <= j; newIndex++) {
    const oldChildUnd = childrenData[0];
    const hide = store._isUnmeasuredItem(newIndex);
    const offset = store._getItemOffset(newIndex);
    const top = `${offset}px`;
    if (oldChildUnd === undefined) {
      const e = getElement(newIndex);
      const element = document.createElement("div");
      element.style.position = hide ? "" : "absolute";
      element.style.visibility = hide ? "hidden" : "visible";
      element.style.top = top;
      element.style.width = "100%";
      element.style.left = "0";
      element.dataset.index = newIndex.toString();
      element.appendChild(e);

      virtualizer.appendChild(element);
      newChildrenData.push({
        index: newIndex,
        hide,
        top,
        element: element,
        unsubscribe: resizer._observeItem(element, newIndex),
      });

      childrenData.shift();

      continue;
    }
    let oldChild = oldChildUnd;
    while (newIndex > oldChild.index) {

      oldChild.element.remove();

      oldChild.unsubscribe();
      childrenData.shift();
      const nextChildData = childrenData[0];

      if (nextChildData === undefined) {
        const e = getElement(newIndex);
        const element = document.createElement("div");
        element.style.position = hide ? "" : "absolute";
        element.style.visibility = hide ? "hidden" : "visible";
        element.style.top = top;
        element.style.width = "100%";
        element.style.left = "0";
        element.dataset.index = newIndex.toString();
        element.appendChild(e);

        virtualizer.appendChild(element);
        newChildrenData.push({
          index: newIndex,
          hide,
          top,
          element: element,
          unsubscribe: resizer._observeItem(element, newIndex),
        });

        childrenData.shift();
        continue;
      }
      oldChild = nextChildData;
    }

    if (newIndex < oldChild.index) {
      const e = getElement(newIndex);
      const element = document.createElement("div");
      element.style.position = hide ? "" : "absolute";
      element.style.visibility = hide ? "hidden" : "visible";
      element.style.top = top;
      element.style.width = "100%";
      element.style.left = "0";
      element.dataset.index = newIndex.toString();
      element.appendChild(e);

      virtualizer.insertBefore(element, oldChild.element);
      newChildrenData.push({
        index: newIndex,
        hide,
        top,
        element,
        unsubscribe: resizer._observeItem(element, newIndex),
      });
      const before = virtualizer.querySelectorAll(`div[data-index="${newIndex}"]`);

      continue;
    }
    if (oldChild.index === newIndex) {
      const prevHide = oldChild.hide;
      if (hide !== prevHide) {
        oldChild.element.style.position = hide ? "" : "absolute";
        oldChild.element.style.visibility = hide ? "hidden" : "visible";
        oldChild.hide = hide;
      }
      const prevTop = oldChild.top;
      if (top !== prevTop) {
        oldChild.element.style.top = top;
        oldChild.top = top;
      }
      newChildrenData.push(oldChild);
      childrenData.shift();
      continue;
    }
  }
  for (const oldChild of childrenData) {
    oldChild.element.remove();
    oldChild.unsubscribe();
  }
  childrenData = newChildrenData;
  rendering = false;
};
