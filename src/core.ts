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

interface Render {
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
  renders: Render[];
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
  renders: Render[],
): Element | undefined {
  const item = context.items[idx];
  if (item === undefined) {
    return undefined;
  }
  const offset = `${context.store.$getItemOffset(idx)}px`;
  const hide = context.store.$isUnmeasuredItem(idx);
  item.style[context.offsetStyle] = offset;
  item.style.visibility = hide ? "hidden" : "visible";

  renders.push({
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

  const renders: Render[] = [];
  for (let idx = 0; idx < items.length; idx++) {
    renderItem({ offsetStyle, items, resizer, store }, idx, renders);
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
    renders,
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
    for (const render of context.renders) {
      render.unobserve();
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
  const newRenders: Render[] = [];
  for (let itemIdx = startIdx; itemIdx <= endIdx; itemIdx++) {
    const renderNullable: Render | undefined = context.renders[0];

    if (renderNullable === undefined) {
      const newRender = renderItem(context, itemIdx, newRenders);
      if (newRender !== undefined) {
        container.appendChild(newRender);
        context.renders.shift();
      }
      continue;
    }

    let render: Render = renderNullable;
    while (itemIdx > render.idx) {
      render.element.remove();
      render.unobserve();
      context.renders.shift();

      const nextRender = context.renders[0];
      if (nextRender === undefined) {
        const newRender = renderItem(context, itemIdx, newRenders);
        if (newRender !== undefined) {
          container.appendChild(newRender);
          context.renders.shift();
        }
        break;
      }

      render = nextRender;
    }

    if (itemIdx < render.idx) {
      const newRender = renderItem(context, itemIdx, newRenders);
      if (newRender !== undefined) {
        container.insertBefore(newRender, render.element);
      }
      continue;
    }

    if (itemIdx === render.idx) {
      const prevHide = render.hide;
      const offset = `${context.store.$getItemOffset(itemIdx)}px`;
      const hide = context.store.$isUnmeasuredItem(itemIdx);
      if (hide !== prevHide) {
        render.element.style.position = hide ? "" : "absolute";
        render.element.style.visibility = hide ? "hidden" : "visible";
        render.hide = hide;
      }

      const prevOffset = render.offset;
      if (offset !== prevOffset) {
        render.element.style[context.offsetStyle] = offset;
        render.offset = offset;
      }

      newRenders.push(render);
      context.renders.shift();
    }
  }

  for (const render of context.renders) {
    render.element.remove();
    render.unobserve();
  }

  context.renders = newRenders;
}

export function appendItems(context: Context, items: HTMLElement[]): void {
  for (const item of items) {
    context.items.push(item);
  }
  context.store.$update(ACTION_ITEMS_LENGTH_CHANGE, [context.items.length, context.shift]);
}

export function prependItems(context: Context, items: HTMLElement[]): void {
  items.reverse();
  for (const item of items) {
    context.items.unshift(item);
  }
  for (const render of context.renders) {
    render.idx += items.length;
  }
  context.store.$update(ACTION_ITEMS_LENGTH_CHANGE, [context.items.length, context.shift]);
}

export function spliceItems(context: Context, amount: number): void {
  context.items.splice(-amount);
  context.store.$update(ACTION_ITEMS_LENGTH_CHANGE, [context.items.length, context.shift]);
}

export function shiftItems(context: Context, amount: number): void {
  context.items.splice(0, amount);
  for (const render of context.renders) {
    render.idx -= amount;
  }
  context.store.$update(ACTION_ITEMS_LENGTH_CHANGE, [context.items.length, context.shift]);
}
