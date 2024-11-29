import * as virtua from "virtua/core";

interface ListResizer {
  _observeRoot(viewportEl: HTMLElement): void;
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
  children: HTMLElement[];
  childrenData: ChildData[];
  containerHeight?: string;
  jumpCount?: number;
}

interface Context {
  readonly root: HTMLElement;
  readonly container: HTMLElement;
  readonly store: virtua.VirtualStore;
  readonly resizer: ListResizer;
  readonly scroller: virtua.Scroller;
  readonly state: State;
}

export const setChildren = (context: Context, newChildren: HTMLElement[]) => {
  context.state.children = newChildren;
  context.store._update(virtua.ACTION_ITEMS_LENGTH_CHANGE, [
    context.state.children.length,
    false,
  ]);
  render(context);
};

const _createChildEl = (
  context: Context,
  idx: number,
  hide: boolean,
  top: string,
  newChild: ChildData[],
) => {
  const child = context.state.children[idx]!;
  const listItem = document.createElement("div");
  listItem.style.position = hide ? "" : "absolute";
  listItem.style.visibility = hide ? "hidden" : "visible";
  listItem.style.top = top;
  listItem.style.width = "100%";
  listItem.style.left = "0";
  listItem.appendChild(child);
  newChild.push({
    idx,
    hide,
    top,
    element: listItem,
    unobserve: context.resizer._observeItem(listItem, idx),
  });

  return listItem;
};

export const init = (newChildren: HTMLElement[]): [Context, () => void] => {
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

  const store = virtua.createVirtualStore(
    newChildren.length,
    undefined,
    undefined,
    undefined,
    undefined,
    true,
  );

  const resizer = virtua.createResizer(store, false);
  resizer._observeRoot(root);

  const scroller = virtua.createScroller(store, false);
  scroller._observe(root);

  const context: Context = {
    root: root,
    container: container,
    store,
    resizer,
    scroller,
    state: {
      childrenData: [],
      children: newChildren,
    },
  };

  const unsubscribeStore = store._subscribe(
    virtua.UPDATE_VIRTUAL_STATE,
    (_sync) => {
      render(context);
    },
  );

  const dispose = () => {
    unsubscribeStore();
    for (const childData of context.state.childrenData) {
      childData.unobserve();
    }
  }

  return [context, dispose];
};

let isRendering = false;
export const render = (context: Context) => {
  requestAnimationFrame(() => {
    if (isRendering) {
      return;
    }
    isRendering = true;
    _render(context);
    isRendering = false;
  });
};

const _render = (context: Context) => {
  const { store, scroller, state, container: container } = context;
  const newJumpCount = store._getJumpCount();
  if (state.jumpCount !== newJumpCount) {
    scroller._fixScrollJump();
    state.jumpCount = newJumpCount;
    return;
  }

  const newContainerHeight = `${store._getTotalSize()}px`;
  if (state.containerHeight !== newContainerHeight) {
    container.style.height = newContainerHeight;
    state.containerHeight = newContainerHeight;
  }

  const [startIdx, endIdx] = store._getRange();
  const newChildrenData: ChildData[] = [];
  for (
    let newChildIdx = startIdx, j = endIdx;
    newChildIdx <= j;
    newChildIdx++
  ) {
    const oldChildDataMaybe: ChildData | undefined = state.childrenData[0];
    const hide = store._isUnmeasuredItem(newChildIdx);
    const top = `${store._getItemOffset(newChildIdx)}px`;
    const createChildEl = () =>
      _createChildEl(context, newChildIdx, hide, top, newChildrenData);

    if (oldChildDataMaybe === undefined) {
      container.appendChild(createChildEl());
      state.childrenData.shift();
      continue;
    }

    let oldChildData: ChildData = oldChildDataMaybe;
    let shouldContinue = false;
    while (newChildIdx > oldChildData.idx) {
      shouldContinue = true;
      oldChildData.element.remove();
      oldChildData.unobserve();
      state.childrenData.shift();

      const nextOldChild = state.childrenData[0];
      if (nextOldChild === undefined) {
        container.appendChild(createChildEl());
        state.childrenData.shift();
        break;
      }

      oldChildData = nextOldChild;
    }
    if (shouldContinue) {
      continue;
    }

    if (newChildIdx < oldChildData.idx) {
      container.insertBefore(createChildEl(), oldChildData.element);
      continue;
    }

    if (oldChildData.idx === newChildIdx) {
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
      state.childrenData.shift();
      continue;
    }
  }

  for (const oldChild of state.childrenData) {
    oldChild.element.remove();
    oldChild.unobserve();
  }


  state.childrenData = newChildrenData;
};
