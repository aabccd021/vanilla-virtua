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
  readonly idx: number;
  readonly element: HTMLElement;
  readonly unobserve: () => void;
  hide: boolean;
  offset: string;
}

interface State {
  readonly children: HTMLElement[];
  childData: ChildData[];
  totalSize?: string;
  jumpCount?: number;
}

export interface Context {
  shift?: boolean;
  readonly isHorizontal: boolean;
  readonly container: HTMLElement;
  readonly store: VirtualStore;
  readonly resizer: Resizer;
  readonly scroller: Scroller;
  readonly itemTag?: keyof HTMLElementTagNameMap;
  readonly state: State;
}

export function appendChildren(context: Context, newChildren: HTMLElement[]): void {
  for (const child of newChildren) {
    context.state.children.push(child);
  }
  context.store.$update(ACTION_ITEMS_LENGTH_CHANGE, [context.state.children.length, context.shift]);
}

export function prependChildren(context: Context, newChildren: HTMLElement[]): void {
  newChildren.reverse();
  for (const child of newChildren) {
    context.state.children.unshift(child);
  }
  context.store.$update(ACTION_ITEMS_LENGTH_CHANGE, [context.state.children.length, context.shift]);
}

export function spliceChildren(context: Context, amount: number): void {
  context.state.children.splice(-amount);
  context.store.$update(ACTION_ITEMS_LENGTH_CHANGE, [context.state.children.length, context.shift]);
}

export function shiftChildren(context: Context, amount: number): void {
  context.state.children.splice(0, amount);
  context.store.$update(ACTION_ITEMS_LENGTH_CHANGE, [context.state.children.length, context.shift]);
}

export function setShift(context: Context, shift: boolean): void {
  if (context.shift === shift) {
    return;
  }
  context.shift = shift;
  // context.store.$update(ACTION_ITEMS_LENGTH_CHANGE, [context.state.children.length, context.shift]);
}

const once = <V>(fn: () => V): (() => V) => {
  let called: undefined | boolean;
  let cache: V;

  return () => {
    if (!called) {
      called = true;
      cache = fn();
    }
    return cache;
  };
};

const getDocumentElement = () => document.documentElement;

const isRtlDocument = once(() => getComputedStyle(getDocumentElement()).direction === "rtl");

function newChild(
  context: {
    readonly isHorizontal: boolean;
    readonly state: {
      readonly children: HTMLElement[];
    };
    readonly resizer: Resizer;
  },
  idx: number,
  offset: string,
  hide: boolean,
  newChildData: ChildData[],
): Element {
  const item = context.state.children[idx];
  if (item === undefined) {
    throw new Error(`Absurd: child is undefined at index ${idx}`);
  }
  item.style[context.isHorizontal ? (isRtlDocument() ? "right" : "left") : "top"] = offset;
  item.style.visibility = hide ? "hidden" : "visible";

  newChildData.push({
    idx,
    hide,
    offset,
    element: item,
    unobserve: context.resizer.$observeItem(item, idx),
  });

  return item;
}

export interface VirtualizerProps {
  readonly shift?: boolean;
  readonly container: HTMLElement;
  readonly root: HTMLElement;
  readonly scrollOffset?: number;
  readonly overscan?: number;
  readonly itemSize?: number;
  readonly cache?: CacheSnapshot;
  readonly as?: keyof HTMLElementTagNameMap;
  readonly item?: keyof HTMLElementTagNameMap;
  readonly horizontal?: boolean;
}

export interface InitResult {
  readonly context: Context;
  readonly dispose: () => void;
  readonly container: HTMLElement;
}

export function init({
  shift,
  horizontal,
  container,
  root,
  itemSize,
  overscan,
  cache,
  item,
  scrollOffset,
}: VirtualizerProps): InitResult {
  const isHorizontal = !!horizontal;

  const children: HTMLElement[] = [];
  for (const child of Array.from(container.children)) {
    if (!(child instanceof HTMLElement)) {
      throw new Error("Child element must be HTMLElement");
    }
    children.push(child);
  }

  const store = createVirtualStore(children.length, itemSize, overscan, undefined, cache, !itemSize);

  const resizer = createResizer(store, isHorizontal);
  resizer.$observeRoot(root);

  const scroller = createScroller(store, isHorizontal);
  scroller.$observe(root);
  if (scrollOffset !== undefined) {
    scroller.$scrollTo(scrollOffset ?? 0);
  }

  const childData: ChildData[] = [];
  const tmpCtx = {
    isHorizontal,
    state: { children },
    resizer,
  };
  for (let i = 0; i < children.length; i++) {
    const offset = `${store.$getItemOffset(i)}px`;
    const hide = store.$isUnmeasuredItem(i);
    newChild(tmpCtx, i, offset, hide, childData);
  }

  const context: Context = {
    shift,
    isHorizontal,
    container,
    store,
    resizer,
    scroller,
    itemTag: item,
    state: {
      childData,
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
    });
  });

  const dispose = (): void => {
    unsubscribeStore();
    resizer.$dispose();
    scroller.$dispose();
    for (const childData of context.state.childData) {
      childData.unobserve();
    }
  };

  return { context, dispose, container };
}

function render(context: Context): void {
  const { store, scroller, state, container, isHorizontal } = context;
  const newJumpCount = store.$getJumpCount();
  if (state.jumpCount !== newJumpCount) {
    scroller.$fixScrollJump();
    state.jumpCount = newJumpCount;
  }

  const newTotalSize = `${store.$getTotalSize()}px`;
  if (state.totalSize !== newTotalSize) {
    if (isHorizontal) {
      container.style.width = newTotalSize;
    } else {
      container.style.height = newTotalSize;
    }
    state.totalSize = newTotalSize;
  }

  const [startIdx, endIdx] = store.$getRange();
  const newChildData: ChildData[] = [];
  for (let newChildIdx = startIdx; newChildIdx <= endIdx; newChildIdx++) {
    const oldChildDataMaybe: ChildData | undefined = state.childData[0];
    const offset = `${store.$getItemOffset(newChildIdx)}px`;
    const hide = store.$isUnmeasuredItem(newChildIdx);

    if (oldChildDataMaybe === undefined) {
      const childEl = newChild(context, newChildIdx, offset, hide, newChildData);
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
        const childEl = newChild(context, newChildIdx, offset, hide, newChildData);
        container.appendChild(childEl);
        state.childData.shift();
        break;
      }

      oldChildData = nextOldChild;
    }

    if (newChildIdx < oldChildData.idx) {
      const childEl = newChild(context, newChildIdx, offset, hide, newChildData);
      container.insertBefore(childEl, oldChildData.element);
      continue;
    }

    if (newChildIdx === oldChildData.idx) {
      const prevHide = oldChildData.hide;
      if (hide !== prevHide) {
        oldChildData.element.style.position = hide ? "" : "absolute";
        oldChildData.element.style.visibility = hide ? "hidden" : "visible";
        oldChildData.hide = hide;
      }

      const prevOffset = oldChildData.offset;
      if (offset !== prevOffset) {
        if (isHorizontal) {
          oldChildData.element.style.left = offset;
        } else {
          oldChildData.element.style.top = offset;
        }
        oldChildData.offset = offset;
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
