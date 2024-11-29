import * as virtua from "virtua/core";

interface ListResizer {
  _observeRoot(viewportElement: HTMLElement): void;
  _observeItem: virtua.ItemResizeObserver;
  _dispose(): void;
}

interface ChildData {
  idx: number;
  hide: boolean;
  top: string;
  element: HTMLElement;
  unobserve: () => void;
}

interface State {
  childElements: HTMLElement[];
  childData: ChildData[];
  containerHeight?: string;
  jumpCount?: number;
}

interface Context {
  readonly store: virtua.VirtualStore;
  readonly resizer: ListResizer;
  readonly scroller: virtua.Scroller;
  readonly container: HTMLElement;
  readonly state: State;
}

export const setChildren = (context: Context, newChildren: HTMLElement[]) => {
  context.state.childElements = newChildren;
  context.store._update(virtua.ACTION_ITEMS_LENGTH_CHANGE, [
    context.state.childElements.length,
    false,
  ]);
  render(context);
};

const createListItem = (
  context: Context,
  idx: number,
  hide: boolean,
  top: string,
  newChild: ChildData[],
) => {
  const child = context.state.childElements[idx]!;
  const listItemElement = document.createElement("div");
  listItemElement.style.position = hide ? "" : "absolute";
  listItemElement.style.visibility = hide ? "hidden" : "visible";
  listItemElement.style.top = top;
  listItemElement.style.width = "100%";
  listItemElement.style.left = "0";
  listItemElement.appendChild(child);
  newChild.push({
    idx,
    hide,
    top,
    element: listItemElement,
    unobserve: context.resizer._observeItem(listItemElement, idx),
  });

  return listItemElement;
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
    container,
    store,
    resizer,
    scroller,
    state: {
      childData: [],
      childElements: newChildren,
    },
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
  if (context.state.jumpCount !== newJumpCount) {
    context.scroller._fixScrollJump();
    context.state.jumpCount = newJumpCount;
    return;
  }

  const newVirtualizerHeight = `${context.store._getTotalSize()}px`;
  if (context.state.containerHeight !== newVirtualizerHeight) {
    context.container.style.height = newVirtualizerHeight;
    context.state.containerHeight = newVirtualizerHeight;
  }

  const [startIdx, endIdx] = context.store._getRange();
  const newChild: ChildData[] = [];
  for (let newIdx = startIdx, j = endIdx; newIdx <= j; newIdx++) {
    const oldChildMaybe = context.state.childData[0];
    const hide = context.store._isUnmeasuredItem(newIdx);
    const top = `${context.store._getItemOffset(newIdx)}px`;
    const createNewListItem = () =>
      createListItem(context, newIdx, hide, top, newChild);

    if (oldChildMaybe === undefined) {
      const newChild = createNewListItem();
      context.container.appendChild(newChild);
      context.state.childData.shift();
      continue;
    }

    let oldChild: ChildData = oldChildMaybe;
    while (newIdx > oldChild.idx) {
      oldChild.element.remove();
      oldChild.unobserve();
      context.state.childData.shift();

      const nextOldChild = context.state.childData[0];
      if (nextOldChild === undefined) {
        const newChild = createNewListItem();
        context.container.appendChild(newChild);
        context.state.childData.shift();
        continue;
      }

      oldChild = nextOldChild;
    }

    if (newIdx < oldChild.idx) {
      const newChild = createNewListItem();
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
      newChild.push(oldChild);
      context.state.childData.shift();
      continue;
    }
  }

  for (const oldChild of context.state.childData) {
    oldChild.element.remove();
    oldChild.unobserve();
  }

  context.state.childData = newChild;
};
