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
  readonly element: HTMLElement;
  readonly unobserve: () => void;
  hide: boolean;
  offset: string;
}

export interface Context {
  shift?: boolean;
  readonly totalSizeAttr: "width" | "height";
  readonly offsetAttr: "left" | "right" | "top";
  readonly isHorizontal: boolean;
  readonly container: HTMLElement;
  readonly store: VirtualStore;
  readonly resizer: Resizer;
  readonly scroller: Scroller;
  readonly itemTag?: keyof HTMLElementTagNameMap;
  readonly children: HTMLElement[];
  jumpCount?: number;
  totalSize?: string;
  isScrolling?: boolean;
  childData: ChildData[];
}

export function appendChildren(context: Context, newChildren: HTMLElement[]): void {
  for (const child of newChildren) {
    context.children.push(child);
  }
  context.store.$update(ACTION_ITEMS_LENGTH_CHANGE, [context.children.length, context.shift]);
}

export function prependChildren(context: Context, newChildren: HTMLElement[]): void {
  newChildren.reverse();
  for (const child of newChildren) {
    context.children.unshift(child);
  }
  for (const childData of context.childData) {
    childData.idx += newChildren.length;
  }
  context.store.$update(ACTION_ITEMS_LENGTH_CHANGE, [context.children.length, context.shift]);
}

export function spliceChildren(context: Context, amount: number): void {
  context.children.splice(-amount);
  context.store.$update(ACTION_ITEMS_LENGTH_CHANGE, [context.children.length, context.shift]);
}

export function shiftChildren(context: Context, amount: number): void {
  context.children.splice(0, amount);
  for (const childData of context.childData) {
    childData.idx -= amount;
  }
  context.store.$update(ACTION_ITEMS_LENGTH_CHANGE, [context.children.length, context.shift]);
}

export function setShift(context: Context, shift: boolean): void {
  if (context.shift === shift) {
    return;
  }
  context.shift = shift;
}

function newChild(
  context: {
    readonly offsetAttr: "left" | "right" | "top";
    readonly children: HTMLElement[];
    readonly resizer: Resizer;
  },
  idx: number,
  offset: string,
  hide: boolean,
  childData: ChildData[],
): Element | undefined {
  const item = context.children[idx];
  if (item === undefined) {
    return undefined;
  }
  item.style[context.offsetAttr] = offset;
  item.style.visibility = hide ? "hidden" : "visible";

  childData.push({
    idx,
    hide,
    offset,
    element: item,
    unobserve: context.resizer.$observeItem(item, idx),
  });

  return item;
}

export interface VirtualizerProps {
  readonly totalSizeAttr: "width" | "height";
  readonly offsetAttr: "left" | "right" | "top";
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
  offsetAttr,
  totalSizeAttr,
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
    offsetAttr,
    children,
    resizer,
  };
  for (let i = 0; i < children.length; i++) {
    const offset = `${store.$getItemOffset(i)}px`;
    const hide = store.$isUnmeasuredItem(i);
    newChild(tmpCtx, i, offset, hide, childData);
  }

  const context: Context = {
    totalSizeAttr,
    offsetAttr,
    shift,
    isHorizontal,
    container,
    store,
    resizer,
    scroller,
    itemTag: item,
    children,
    childData,
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
    for (const childData of context.childData) {
      childData.unobserve();
    }
  };

  return { context, dispose, container };
}

function render(context: Context): void {
  const { store, scroller, container } = context;
  const jumpCount = store.$getJumpCount();
  if (context.jumpCount !== jumpCount) {
    scroller.$fixScrollJump();
    context.jumpCount = jumpCount;
  }

  const totalSize = `${store.$getTotalSize()}px`;
  if (context.totalSize !== totalSize) {
    container.style[context.totalSizeAttr] = totalSize;
    context.totalSize = totalSize;
  }

  const isScrolling = store.$isScrolling();
  if (context.isScrolling !== isScrolling) {
    context.isScrolling = isScrolling;
    const pointerEvents = isScrolling ? "none" : "";
    container.style.pointerEvents = pointerEvents;
  }

  const [startIdx, endIdx] = store.$getRange();
  const newChildData: ChildData[] = [];
  for (let newChildIdx = startIdx; newChildIdx <= endIdx; newChildIdx++) {
    const oldChildDataMaybe: ChildData | undefined = context.childData[0];
    const offset = `${store.$getItemOffset(newChildIdx)}px`;
    const hide = store.$isUnmeasuredItem(newChildIdx);

    if (oldChildDataMaybe === undefined) {
      const childEl = newChild(context, newChildIdx, offset, hide, newChildData);
      if (childEl !== undefined) {
        container.appendChild(childEl);
        context.childData.shift();
      }
      continue;
    }

    let oldChildData: ChildData = oldChildDataMaybe;
    while (newChildIdx > oldChildData.idx) {
      oldChildData.element.remove();
      oldChildData.unobserve();
      context.childData.shift();

      const nextOldChild = context.childData[0];
      if (nextOldChild === undefined) {
        const childEl = newChild(context, newChildIdx, offset, hide, newChildData);
        if (childEl !== undefined) {
          container.appendChild(childEl);
          context.childData.shift();
        }
        break;
      }

      oldChildData = nextOldChild;
    }

    if (newChildIdx < oldChildData.idx) {
      const childEl = newChild(context, newChildIdx, offset, hide, newChildData);
      if (childEl !== undefined) {
        container.insertBefore(childEl, oldChildData.element);
      }
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
        oldChildData.element.style[context.offsetAttr] = offset;
        oldChildData.offset = offset;
      }

      newChildData.push(oldChildData);
      context.childData.shift();
    }
  }

  for (const oldChild of context.childData) {
    oldChild.element.remove();
    oldChild.unobserve();
  }

  context.childData = newChildData;
}
