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
  readonly rootElement: HTMLElement;
  readonly containerElement: HTMLElement;
  readonly store: virtua.VirtualStore;
  readonly resizer: ListResizer;
  readonly scroller: virtua.Scroller;
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

export const init = (newChildren: HTMLElement[]): Context => {
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
    rootElement: root,
    containerElement: container,
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

  return context;
};

export const render = (context: Context) => {
  requestAnimationFrame(() => {
    _render(context);
  });
};

const _render = (context: Context) => {
  const { store, scroller, state, containerElement: container } = context;
  const newJumpCount = store._getJumpCount();
  if (state.jumpCount !== newJumpCount) {
    scroller._fixScrollJump();
    state.jumpCount = newJumpCount;
    return;
  }

  const newVirtualizerHeight = `${store._getTotalSize()}px`;
  if (state.containerHeight !== newVirtualizerHeight) {
    container.style.height = newVirtualizerHeight;
    state.containerHeight = newVirtualizerHeight;
  }

  const [startIdx, endIdx] = store._getRange();
  const newChildrenData: ChildData[] = [];
  for (let newIdx = startIdx, j = endIdx; newIdx <= j; newIdx++) {
    const oldChildDataMaybe = state.childData[0];
    const hide = store._isUnmeasuredItem(newIdx);
    const top = `${store._getItemOffset(newIdx)}px`;
    const createChild = () =>
      createListItem(context, newIdx, hide, top, newChildrenData);

    if (oldChildDataMaybe === undefined) {
      const newChildData = createChild();
      container.appendChild(newChildData);
      state.childData.shift();
      continue;
    }

    let oldChildData: ChildData = oldChildDataMaybe;
    while (newIdx > oldChildData.idx) {
      oldChildData.element.remove();
      oldChildData.unobserve();
      state.childData.shift();

      const nextOldChild = state.childData[0];
      if (nextOldChild === undefined) {
        const newChildData = createChild();
        container.appendChild(newChildData);
        state.childData.shift();
        continue;
      }

      oldChildData = nextOldChild;
    }

    if (newIdx < oldChildData.idx) {
      const newChildData = createChild();
      container.insertBefore(newChildData, oldChildData.element);
      continue;
    }

    if (oldChildData.idx === newIdx) {
      const prevHide = oldChildData.hide;
      if (hide !== prevHide) {
        oldChildData.element.style.position = hide ? "" : "absolute";
        oldChildData.element.style.visibility = hide ? "hidden" : "visible";
        oldChildData.hide = hide;
      }

      const prevTop = oldChildData.top;
      if (top !== prevTop) {
        oldChildData.element.style.top = top;
        oldChildData.top = top;
      }

      newChildrenData.push(oldChildData);
      state.childData.shift();
      continue;
    }
  }

  for (const oldChild of state.childData) {
    oldChild.element.remove();
    oldChild.unobserve();
  }

  state.childData = newChildrenData;
};
