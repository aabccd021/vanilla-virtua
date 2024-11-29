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
  unobserve: () => void;
}

let children: HTMLElement[];
let store: virtua.VirtualStore;
let resizer: ListResizer;
let scroller: virtua.Scroller;
let virtualizer: HTMLElement;
let virtualizerHeight: string;
let jumpCount: number;
let childrenData: ChildrenData[] = [];

export const setChildren = (store: virtua.VirtualStore, newChildren: HTMLElement[]) => {
  children = newChildren;
  store._update(virtua.ACTION_ITEMS_LENGTH_CHANGE, [children.length, false]);
  render();
};

const createListItem = (
  newIndex: number,
  hide: boolean,
  top: string,
  newChildrenData: ChildrenData[],
) => {
  const e = children[newIndex]!;
  const element = document.createElement("div");
  element.style.position = hide ? "" : "absolute";
  element.style.visibility = hide ? "hidden" : "visible";
  element.style.top = top;
  element.style.width = "100%";
  element.style.left = "0";
  element.appendChild(e);
  newChildrenData.push({
    index: newIndex,
    hide,
    top,
    element,
    unobserve: resizer._observeItem(element, newIndex),
  });

  return element;
}

interface InitResult {
  vlist: HTMLElement;
  store: virtua.VirtualStore;
}

export const init = (newChildren: HTMLElement[]): InitResult  => {
  children = newChildren;

  store = virtua.createVirtualStore(
    children.length,
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
  vlist.style.width = "100%";
  vlist.style.height = "100%";
  vlist.appendChild(virtualizer);

  resizer = virtua.createResizer(store, false);
  resizer._observeRoot(vlist);

  scroller = virtua.createScroller(store, false);
  scroller._observe(vlist);

  store._subscribe(virtua.UPDATE_VIRTUAL_STATE, (_sync) => {
    render()
  });

  return {
    vlist,
    store
  }
};

export const render = () => {
  requestAnimationFrame(() => {
    _render();
  });
}

const _render = () => {
  const newJumpCount = store._getJumpCount();
  if (jumpCount !== newJumpCount) {
    scroller._fixScrollJump();
    jumpCount = newJumpCount;
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
    const oldChildMaybe = childrenData[0];
    const hide = store._isUnmeasuredItem(newIndex);
    const top = `${store._getItemOffset(newIndex)}px`;

    if (oldChildMaybe === undefined) {
      const element = createListItem(newIndex, hide, top, newChildrenData);
      virtualizer.appendChild(element);
      childrenData.shift();
      continue;
    }

    let oldChild = oldChildMaybe;
    while (newIndex > oldChild.index) {

      oldChild.element.remove();
      oldChild.unobserve();
      childrenData.shift();

      const nextOldChild = childrenData[0];
      if (nextOldChild === undefined) {
        const element = createListItem(newIndex, hide, top, newChildrenData);
        virtualizer.appendChild(element);
        childrenData.shift();
        continue;
      }

      oldChild = nextOldChild;
    }

    if (newIndex < oldChild.index) {
      const element = createListItem(newIndex, hide, top, newChildrenData);
      virtualizer.insertBefore(element, oldChild.element);
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
    oldChild.unobserve();
  }

  childrenData = newChildrenData;
};
