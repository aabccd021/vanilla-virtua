import * as virtua from "virtua/core";

interface ListResizer {
  _observeRoot(viewportElement: HTMLElement): void;
  _observeItem: virtua.ItemResizeObserver;
  _dispose(): void;
}

interface ChildrenData {
  idx: number;
  hide: boolean;
  top: string;
  element: HTMLElement;
  unobserve: () => void;
}

interface Context {
  store: virtua.VirtualStore;
  resizer: ListResizer;
  scroller: virtua.Scroller;
  container: HTMLElement;
  children: HTMLElement[];
  containerHeight?: string; 
  jumpCount?: number;
  childrenData: ChildrenData[];
}


export const setChildren = (context: Context, newChildren: HTMLElement[]) => {
  context.children = newChildren;
  context.store._update(virtua.ACTION_ITEMS_LENGTH_CHANGE, [
    context.children.length,
    false,
  ]);
  render(context);
};

const createListItem = (
  context: Context,
  newIdx: number,
  hide: boolean,
  top: string,
  newChildrenData: ChildrenData[],
) => {
  const e = context.children[newIdx]!;
  const element = document.createElement("div");
  element.style.position = hide ? "" : "absolute";
  element.style.visibility = hide ? "hidden" : "visible";
  element.style.top = top;
  element.style.width = "100%";
  element.style.left = "0";
  element.appendChild(e);
  newChildrenData.push({
    idx: newIdx,
    hide,
    top,
    element,
    unobserve: context.resizer._observeItem(element, newIdx),
  });

  return element;
};

interface InitResult {
  root: HTMLElement;
  context: Context;
}

export const init = (newChildren: HTMLElement[]): InitResult => {
  const store = virtua.createVirtualStore(
    newChildren.length,
    undefined,
    undefined,
    undefined,
    undefined,
    true,
  );

  const container = document.createElement("div");
  container.style.overflowAnchor = "none";
  container.style.flex = "none";
  container.style.position = "relative";
  container.style.visibility = "hidden";
  container.style.width = "100%";

  const root = document.createElement("div");
  root.style.display = "block";
  root.style.overflowY = "auto";
  root.style.contain = "strict";
  root.style.width = "100%";
  root.style.height = "100%";
  root.appendChild(container);

  const resizer = virtua.createResizer(store, false);
  resizer._observeRoot(root);

  const scroller = virtua.createScroller(store, false);
  scroller._observe(root);

  const context: Context = {
    children: newChildren,
    container,
    store,
    resizer,
    scroller,
    childrenData: [],
  };

  store._subscribe(virtua.UPDATE_VIRTUAL_STATE, (_sync) => {
    render(context);
  });

  return {
    root,
    context,
  };
};

export const render = (context: Context) => {
  requestAnimationFrame(() => {
    _render(context);
  });
};

const _render = (context: Context) => {
  const newJumpCount = context.store._getJumpCount();
  if (context.jumpCount !== newJumpCount) {
    context.scroller._fixScrollJump();
    context.jumpCount = newJumpCount;
    return;
  }

  const newVirtualizerHeight = `${context.store._getTotalSize()}px`;
  if (context.containerHeight !== newVirtualizerHeight) {
    context.container.style.height = newVirtualizerHeight;
    context.containerHeight = newVirtualizerHeight;
  }

  const [startIdx, endIdx] = context.store._getRange();
  const newChildrenData: ChildrenData[] = [];
  for (let newIdx = startIdx, j = endIdx; newIdx <= j; newIdx++) {
    const oldChildMaybe = context.childrenData[0];
    const hide = context.store._isUnmeasuredItem(newIdx);
    const top = `${context.store._getItemOffset(newIdx)}px`;
    const createNewChild = () => createListItem(
      context,
      newIdx,
      hide,
      top,
      newChildrenData,
    );

    if (oldChildMaybe === undefined) {
      const newChild = createNewChild();
      context.container.appendChild(newChild);
      context.childrenData.shift();
      continue;
    }

    let oldChild = oldChildMaybe;
    while (newIdx > oldChild.idx) {
      oldChild.element.remove();
      oldChild.unobserve();
      context.childrenData.shift();

      const nextOldChild = context.childrenData[0];
      if (nextOldChild === undefined) {
        const newChild = createNewChild();
        context.container.appendChild(newChild);
        context.childrenData.shift();
        continue;
      }

      oldChild = nextOldChild;
    }

    if (newIdx < oldChild.idx) {
      const newChild = createNewChild()
      context.container.insertBefore(newChild, oldChild.element);
      continue;
    }

    if (oldChild.idx === newIdx) {
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
      context.childrenData.shift();
      continue;
    }
  }

  for (const oldChild of context.childrenData) {
    oldChild.element.remove();
    oldChild.unobserve();
  }

  context.childrenData = newChildrenData;
};
