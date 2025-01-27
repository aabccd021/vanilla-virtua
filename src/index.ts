import {
  ACTION_ITEMS_LENGTH_CHANGE,
  type CacheSnapshot,
  UPDATE_VIRTUAL_STATE,
  type VirtualStore,
  createResizer,
  createScroller,
  createVirtualStore,
} from "virtua/core";

export type {
  VirtualStore,
  StateVersion,
  ItemResizeObserver,
  GridResizer,
  CacheSnapshot,
  ScrollToIndexOpts,
  ItemsRange,
} from "virtua/core";

type Scroller = ReturnType<typeof createScroller>;

type Resizer = ReturnType<typeof createResizer>;

interface ChildData {
  idx: number;
  hide: boolean;
  top: string;
  element: HTMLElement;
  unobserve: () => void;
}

interface State {
  children: Element[];
  childData: ChildData[];
  containerHeight?: string;
  jumpCount?: number;
}

export interface Context {
  readonly container: HTMLElement;
  readonly store: VirtualStore;
  readonly resizer: Resizer;
  readonly scroller: Scroller;
  readonly itemTag?: keyof HTMLElementTagNameMap;
  readonly state: State;
}

export function appendChildren(context: Context, newChildren: Element[]): void {
  for (const child of newChildren) {
    context.state.children.push(child);
  }
  context.store.$update(ACTION_ITEMS_LENGTH_CHANGE, [context.state.children.length, false]);
}

function newChild(context: Context, idx: number, top: string, newChildData: ChildData[]): Element {
  const child = context.state.children[idx];
  if (child === undefined) {
    throw new Error(`Absurd: child is undefined at index ${idx}`);
  }
  const element = document.createElement(context.itemTag ?? "div");
  element.style.position = "absolute";
  element.style.visibility = "visible";
  element.style.top = top;
  element.style.width = "100%";
  element.style.left = "0";
  element.appendChild(child);
  newChildData.push({
    idx,
    hide: false,
    top,
    element,
    unobserve: context.resizer.$observeItem(element, idx),
  });

  return element;
}

export interface VirtualizerProps {
  element: HTMLElement;
  overscan?: number;
  itemSize?: number;
  cache?: CacheSnapshot;
  as?: keyof HTMLElementTagNameMap;
  item?: keyof HTMLElementTagNameMap;
}

export interface InitResult {
  context: Context;
  dispose: () => void;
  root: HTMLElement;
  container: HTMLElement;
}

export function init({ element, as, itemSize, overscan, cache, item }: VirtualizerProps): InitResult {
  const children = Array.from(element.children);
  const container = document.createElement(as ?? "div");
  container.style.overflowAnchor = "none";
  container.style.flex = "none";
  container.style.position = "relative";
  container.style.visibility = "hidden";
  container.style.width = "100%";
  for (const child of children) {
    container.appendChild(child);
  }

  const root = document.createElement("div");
  root.style.display = "block";
  root.style.overflowY = "auto";
  root.style.contain = "strict";
  root.style.width = "100%";
  root.style.height = "100%";
  root.appendChild(container);

  element.appendChild(root);

  const store = createVirtualStore(children.length, itemSize, overscan, undefined, cache, !itemSize);

  const resizer = createResizer(store, false);
  resizer.$observeRoot(root);

  const scroller = createScroller(store, false);
  scroller.$observe(root);

  const context: Context = {
    container,
    store,
    resizer,
    scroller,
    itemTag: item,
    state: {
      childData: [],
      children,
    },
  };
  
  render(context);

  const unsubscribeStore = store.$subscribe(UPDATE_VIRTUAL_STATE, (sync) => {
    if (sync) {
      render(context);
    }
    requestAnimationFrame(() => {
      render(context);
    })
  });

  const dispose = (): void => {
    unsubscribeStore();
    resizer.$dispose();
    scroller.$dispose();
    for (const childData of context.state.childData) {
      childData.unobserve();
    }
  };

  return { context, dispose, root, container };
}

function render(context: Context): void {
  const { store, scroller, state, container } = context;
  const newJumpCount = store.$getJumpCount();
  if (state.jumpCount !== newJumpCount) {
    scroller.$fixScrollJump();
    state.jumpCount = newJumpCount;
  }

  const newContainerHeight = `${store.$getTotalSize()}px`;
  if (state.containerHeight !== newContainerHeight) {
    container.style.height = newContainerHeight;
    state.containerHeight = newContainerHeight;
  }

  const [startIdx, endIdx] = store.$getRange();
  const newChildData: ChildData[] = [];
  for (let newChildIdx = startIdx, j = endIdx; newChildIdx <= j; newChildIdx++) {
    const oldChildDataMaybe: ChildData | undefined = state.childData[0];
    const top = `${store.$getItemOffset(newChildIdx)}px`;

    if (oldChildDataMaybe === undefined) {
      const childEl = newChild(context, newChildIdx, top, newChildData);
      container.appendChild(childEl);
      state.childData.shift();
      continue;
    }

    let oldChildData: ChildData = oldChildDataMaybe;
    while (newChildIdx > oldChildData.idx) {
      oldChildData.element.remove();
      oldChildData.unobserve();
      state.childData.shift();

      const nextOldChild = state.childData[0];
      if (nextOldChild === undefined) {
        const childEl = newChild(context, newChildIdx, top, newChildData);
        container.appendChild(childEl);
        state.childData.shift();
        break;
      }

      oldChildData = nextOldChild;
    }

    if (newChildIdx < oldChildData.idx) {
      const childEl = newChild(context, newChildIdx, top, newChildData);
      container.insertBefore(childEl, oldChildData.element);
      continue;
    }

    if (oldChildData.idx === newChildIdx) {
      const prevHide = oldChildData.hide;
      const hide = store.$isUnmeasuredItem(newChildIdx);
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

      newChildData.push(oldChildData);
      state.childData.shift();
    }
  }

  for (const oldChild of state.childData) {
    oldChild.element.remove();
    oldChild.unobserve();
  }

  state.childData = newChildData;
}
