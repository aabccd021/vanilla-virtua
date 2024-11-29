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

interface Context {
  store: virtua.VirtualStore;
  resizer: ListResizer;
  scroller: virtua.Scroller;
  children: HTMLElement[];
}

let virtualizer: HTMLElement;
let virtualizerHeight: string;
let jumpCount: number;
let childrenData: ChildrenData[] = [];

export const setChildren = (context: Context, newChildren: HTMLElement[]) => {
  context.children = newChildren;
  context.store._update(virtua.ACTION_ITEMS_LENGTH_CHANGE, [context.children.length, false]);
  render(context);
};

const createListItem = (
  context: Context,
  newIndex: number,
  hide: boolean,
  top: string,
  newChildrenData: ChildrenData[],
) => {
  const e = context.children[newIndex]!;
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
    unobserve: context.resizer._observeItem(element, newIndex),
  });

  return element;
}

interface InitResult {
  vlist: HTMLElement;
  context: Context;
}

export const init = (newChildren: HTMLElement[]): InitResult  => {
  const store = virtua.createVirtualStore(
    newChildren.length,
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

  const resizer = virtua.createResizer(store, false);
  resizer._observeRoot(vlist);

  const scroller = virtua.createScroller(store, false);
  scroller._observe(vlist);

  const context: Context = {
    children: newChildren,
    store,
    resizer,
    scroller
  };

  store._subscribe(virtua.UPDATE_VIRTUAL_STATE, (_sync) => {
    render(context);
  });

  return {
    vlist,
    context,
  }
};

export const render = (context: Context) => {
  requestAnimationFrame(() => {
    _render(context);
  });
}

const _render = (context: Context) => {
  const newJumpCount = context.store._getJumpCount();
  if (jumpCount !== newJumpCount) {
    context.scroller._fixScrollJump();
    jumpCount = newJumpCount;
    return;
  }

  const newVirtualizerHeight = `${context.store._getTotalSize()}px`;
  if (virtualizerHeight !== newVirtualizerHeight) {
    virtualizer.style.height = newVirtualizerHeight;
    virtualizerHeight = newVirtualizerHeight;
  }

  const [startIndex, endIndex] = context.store._getRange();
  const newChildrenData: ChildrenData[] = [];
  for (let newIndex = startIndex, j = endIndex; newIndex <= j; newIndex++) {
    const oldChildMaybe = childrenData[0];
    const hide = context.store._isUnmeasuredItem(newIndex);
    const top = `${context.store._getItemOffset(newIndex)}px`;

    if (oldChildMaybe === undefined) {
      const element = createListItem(context, newIndex, hide, top, newChildrenData);
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
        const element = createListItem(context, newIndex, hide, top, newChildrenData);
        virtualizer.appendChild(element);
        childrenData.shift();
        continue;
      }

      oldChild = nextOldChild;
    }

    if (newIndex < oldChild.index) {
      const element = createListItem(context, newIndex, hide, top, newChildrenData);
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
