import {
  ACTION_ITEMS_LENGTH_CHANGE,
  type CacheSnapshot,
  UPDATE_VIRTUAL_STATE,
  type VirtualStore,
  createResizer,
  createScroller,
  createVirtualStore,
} from "virtua/unstable_core";

export type {
  VirtualStore,
  StateVersion,
  ItemResizeObserver,
  GridResizer,
  CacheSnapshot,
  ScrollToIndexOpts,
  ItemsRange,
} from "virtua/unstable_core";

type Scroller = ReturnType<typeof createScroller>;

type Resizer = ReturnType<typeof createResizer>;

interface RenderedItem {
  readonly element: HTMLElement;
  readonly unobserve: () => void;
  hide: boolean;
  offset: string;
  idx: number;
}

export interface Context {
  readonly items: HTMLElement[];
  readonly container: HTMLElement;
  readonly offsetStyle: "left" | "right" | "top";
  readonly resizer: Resizer;
  readonly scroller: Scroller;
  readonly store: VirtualStore;
  readonly totalSizeStyle: "width" | "height";
  renderedItems: RenderedItem[];
  isScrolling?: boolean;
  jumpCount?: number;
  shift?: boolean;
  totalSize?: string;
}

export interface Core {
  readonly context: Context;
  readonly dispose: () => void;
}

function renderItem(
  context: Pick<Context, "offsetStyle" | "items" | "resizer" | "store">,
  idx: number,
  renderedItems: RenderedItem[],
): Element | undefined {
  const item = context.items[idx];
  if (item === undefined) {
    return undefined;
  }
  const offset = `${context.store.$getItemOffset(idx)}px`;
  const hide = context.store.$isUnmeasuredItem(idx);
  item.style[context.offsetStyle] = offset;
  item.style.visibility = hide ? "hidden" : "visible";

  renderedItems.push({
    idx,
    hide,
    offset,
    element: item,
    unobserve: context.resizer.$observeItem(item, idx),
  });

  return item;
}

export function init({
  cache,
  container,
  horizontal,
  itemSize,
  offsetStyle,
  overscan,
  root,
  shift,
  totalSizeStyle,
}: {
  readonly root: HTMLElement;
  readonly container: HTMLElement;
  readonly offsetStyle: "left" | "right" | "top";
  readonly totalSizeStyle: "width" | "height";
  readonly cache?: CacheSnapshot;
  readonly horizontal?: boolean;
  readonly itemSize?: number;
  readonly overscan?: number;
  readonly shift?: boolean;
}): Core {
  const isHorizontal = !!horizontal;

  const items: HTMLElement[] = [];
  for (const child of Array.from(container.children)) {
    if (!(child instanceof HTMLElement)) {
      throw new Error("Child element must be HTMLElement");
    }
    items.push(child);
  }

  const store = createVirtualStore(items.length, itemSize, overscan, undefined, cache, !itemSize);

  const resizer = createResizer(store, isHorizontal);
  resizer.$observeRoot(root);

  const scroller = createScroller(store, isHorizontal);
  scroller.$observe(root);

  const renderedItems: RenderedItem[] = [];
  for (let idx = 0; idx < items.length; idx++) {
    renderItem({ offsetStyle, items, resizer, store }, idx, renderedItems);
  }

  const context: Context = {
    totalSizeStyle,
    offsetStyle,
    shift,
    container,
    store,
    resizer,
    scroller,
    items,
    renderedItems,
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
    for (const renderedItem of context.renderedItems) {
      renderedItem.unobserve();
    }
  };

  return { context, dispose };
}

function render(context: Context): void {
  const { store, scroller, container } = context;
  const jumpCount = store.$getJumpCount();
  if (context.jumpCount !== jumpCount) {
    context.jumpCount = jumpCount;
    scroller.$fixScrollJump();
  }

  const totalSize = `${store.$getTotalSize()}px`;
  if (context.totalSize !== totalSize) {
    context.totalSize = totalSize;
    container.style[context.totalSizeStyle] = totalSize;
  }

  const isScrolling = store.$isScrolling();
  if (context.isScrolling !== isScrolling) {
    context.isScrolling = isScrolling;
    container.style.pointerEvents = isScrolling ? "none" : "";
  }

  const [startIdx, endIdx] = store.$getRange();
  const newRenderedItems: RenderedItem[] = [];
  for (let newItemIdx = startIdx; newItemIdx <= endIdx; newItemIdx++) {
    const renderedItemNullable: RenderedItem | undefined = context.renderedItems[0];

    if (renderedItemNullable === undefined) {
      const newItem = renderItem(context, newItemIdx, newRenderedItems);
      if (newItem !== undefined) {
        container.appendChild(newItem);
        context.renderedItems.shift();
      }
      continue;
    }

    let renderedItem: RenderedItem = renderedItemNullable;
    while (newItemIdx > renderedItem.idx) {
      renderedItem.element.remove();
      renderedItem.unobserve();
      context.renderedItems.shift();

      const nextRenderedItem = context.renderedItems[0];
      if (nextRenderedItem === undefined) {
        const newItem = renderItem(context, newItemIdx, newRenderedItems);
        if (newItem !== undefined) {
          container.appendChild(newItem);
          context.renderedItems.shift();
        }
        break;
      }

      renderedItem = nextRenderedItem;
    }

    if (newItemIdx < renderedItem.idx) {
      const newItem = renderItem(context, newItemIdx, newRenderedItems);
      if (newItem !== undefined) {
        container.insertBefore(newItem, renderedItem.element);
      }
      continue;
    }

    if (newItemIdx === renderedItem.idx) {
      const prevHide = renderedItem.hide;
      const offset = `${context.store.$getItemOffset(newItemIdx)}px`;
      const hide = context.store.$isUnmeasuredItem(newItemIdx);
      if (hide !== prevHide) {
        renderedItem.element.style.position = hide ? "" : "absolute";
        renderedItem.element.style.visibility = hide ? "hidden" : "visible";
        renderedItem.hide = hide;
      }

      const prevOffset = renderedItem.offset;
      if (offset !== prevOffset) {
        renderedItem.element.style[context.offsetStyle] = offset;
        renderedItem.offset = offset;
      }

      newRenderedItems.push(renderedItem);
      context.renderedItems.shift();
    }
  }

  for (const renderedItem of context.renderedItems) {
    renderedItem.element.remove();
    renderedItem.unobserve();
  }

  context.renderedItems = newRenderedItems;
}

export function appendItems(context: Context, newItems: HTMLElement[]): void {
  for (const newItem of newItems) {
    context.items.push(newItem);
  }
  context.store.$update(ACTION_ITEMS_LENGTH_CHANGE, [context.items.length, context.shift]);
}

export function prependItems(context: Context, newItems: HTMLElement[]): void {
  newItems.reverse();
  for (const newItem of newItems) {
    context.items.unshift(newItem);
  }
  for (const renderedItem of context.renderedItems) {
    renderedItem.idx += newItems.length;
  }
  context.store.$update(ACTION_ITEMS_LENGTH_CHANGE, [context.items.length, context.shift]);
}

export function spliceItems(context: Context, amount: number): void {
  context.items.splice(-amount);
  context.store.$update(ACTION_ITEMS_LENGTH_CHANGE, [context.items.length, context.shift]);
}

export function shiftItems(context: Context, amount: number): void {
  context.items.splice(0, amount);
  for (const renderedItem of context.renderedItems) {
    renderedItem.idx -= amount;
  }
  context.store.$update(ACTION_ITEMS_LENGTH_CHANGE, [context.items.length, context.shift]);
}
