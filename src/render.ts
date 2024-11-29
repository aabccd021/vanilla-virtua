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
  el: HTMLElement;
  unobserve: () => void;
}

interface State {
  childrenEls: HTMLElement[];
  childrenData: ChildData[];
  containerHeight?: string;
  jumpCount?: number;
}

interface Context {
  readonly rootEl: HTMLElement;
  readonly containerEl: HTMLElement;
  readonly store: virtua.VirtualStore;
  readonly resizer: ListResizer;
  readonly scroller: virtua.Scroller;
  readonly state: State;
}

export const setChildren = (context: Context, newChildren: HTMLElement[]) => {
  context.state.childrenEls = newChildren;
  context.store._update(virtua.ACTION_ITEMS_LENGTH_CHANGE, [
    context.state.childrenEls.length,
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
  const child = context.state.childrenEls[idx]!;
  const listItemEl = document.createElement("div");
  listItemEl.style.position = hide ? "" : "absolute";
  listItemEl.style.visibility = hide ? "hidden" : "visible";
  listItemEl.style.top = top;
  listItemEl.style.width = "100%";
  listItemEl.style.left = "0";
  listItemEl.appendChild(child);
  newChild.push({
    idx,
    hide,
    top,
    el: listItemEl,
    unobserve: context.resizer._observeItem(listItemEl, idx),
  });

  return listItemEl;
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

  const containerEl = document.createElement("div");
  containerEl.style.overflowAnchor = "none";
  containerEl.style.flex = "none";
  containerEl.style.position = "relative";
  containerEl.style.visibility = "hidden";
  containerEl.style.width = "100%";

  const rootEl = document.createElement("div");
  rootEl.style.display = "block";
  rootEl.style.overflowY = "auto";
  rootEl.style.contain = "strict";
  rootEl.style.width = "100%";
  rootEl.style.height = "100%";
  rootEl.appendChild(containerEl);

  const resizer = virtua.createResizer(store, false);
  resizer._observeRoot(rootEl);

  const scroller = virtua.createScroller(store, false);
  scroller._observe(rootEl);

  const context: Context = {
    rootEl: rootEl,
    containerEl: containerEl,
    store,
    resizer,
    scroller,
    state: {
      childrenData: [],
      childrenEls: newChildren,
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
  const { store, scroller, state, containerEl: container } = context;
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
    const oldChildDataMaybe = state.childrenData[0];
    const hide = store._isUnmeasuredItem(newIdx);
    const top = `${store._getItemOffset(newIdx)}px`;
    const createChild = () =>
      createListItem(context, newIdx, hide, top, newChildrenData);

    if (oldChildDataMaybe === undefined) {
      const newChildData = createChild();
      container.appendChild(newChildData);
      state.childrenData.shift();
      continue;
    }

    let oldChildData: ChildData = oldChildDataMaybe;
    while (newIdx > oldChildData.idx) {
      oldChildData.el.remove();
      oldChildData.unobserve();
      state.childrenData.shift();

      const nextOldChild = state.childrenData[0];
      if (nextOldChild === undefined) {
        const newChildData = createChild();
        container.appendChild(newChildData);
        state.childrenData.shift();
        continue;
      }

      oldChildData = nextOldChild;
    }

    if (newIdx < oldChildData.idx) {
      const newChildData = createChild();
      container.insertBefore(newChildData, oldChildData.el);
      continue;
    }

    if (oldChildData.idx === newIdx) {
      const prevHide = oldChildData.hide;
      if (hide !== prevHide) {
        oldChildData.el.style.position = hide ? "" : "absolute";
        oldChildData.el.style.visibility = hide ? "hidden" : "visible";
        oldChildData.hide = hide;
      }

      const prevTop = oldChildData.top;
      if (top !== prevTop) {
        oldChildData.el.style.top = top;
        oldChildData.top = top;
      }

      newChildrenData.push(oldChildData);
      state.childrenData.shift();
      continue;
    }
  }

  for (const oldChild of state.childrenData) {
    oldChild.el.remove();
    oldChild.unobserve();
  }

  state.childrenData = newChildrenData;
};
