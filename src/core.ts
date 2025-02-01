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
  readonly item: HTMLElement;
  readonly unobserve: () => void;
  hide: boolean;
  offset: string;
  idx: number;
}

export interface Virtualizer {
  readonly items: HTMLElement[];
  readonly container: HTMLElement;
  readonly offsetStyle: "left" | "right" | "top";
  readonly resizer: Resizer;
  readonly scroller: Scroller;
  readonly store: VirtualStore;
  readonly totalSizeStyle: "width" | "height";
  unsubscribeStore: () => void;
  renders: Render[];
  isScrolling: boolean;
  jumpCount: number;
  totalSize: string;
  shift?: boolean;
}

function renderItem(
  virt: Pick<Virtualizer, "offsetStyle" | "items" | "resizer" | "store">,
  idx: number,
  renders: Render[],
): Element | undefined {
  const item = virt.items[idx];
  if (item === undefined) {
    return undefined;
  }
  const offset = `${virt.store.$getItemOffset(idx)}px`;
  const hide = virt.store.$isUnmeasuredItem(idx);
  item.style[virt.offsetStyle] = offset;
  item.style.visibility = hide ? "hidden" : "visible";

  renders.push({
    idx,
    hide,
    offset,
    item,
    unobserve: virt.resizer.$observeItem(item, idx),
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
}): Virtualizer {
  const isHorizontal = !!horizontal;

  const items: HTMLElement[] = [];
  for (const child of Array.from(container.children)) {
    if (child instanceof HTMLElement) {
      items.push(child);
    } else {
      console.warn("Child element must be HTMLElement");
    }
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

  const isScrolling = store.$isScrolling();
  const jumpCount = store.$getJumpCount();
  const totalSize = `${store.$getTotalSize()}px`;

  const virt: Virtualizer = {
    container,
    isScrolling,
    items,
    jumpCount,
    offsetStyle,
    renders,
    resizer,
    scroller,
    shift,
    store,
    totalSize,
    totalSizeStyle,
    unsubscribeStore: store.$subscribe(UPDATE_VIRTUAL_STATE, (sync) => {
      if (sync) {
        render(virt);
      }
      requestAnimationFrame(() => {
        render(virt);
      });
    }),
  };

  return virt;
}

export function dispose(virt: Virtualizer): void {
  virt.unsubscribeStore();
  virt.resizer.$dispose();
  virt.scroller.$dispose();
  for (const render of virt.renders) {
    render.unobserve();
  }
}

export function appendItems(virt: Virtualizer, items: HTMLElement[]): void {
  virt.items.push(...items);
  virt.store.$update(ACTION_ITEMS_LENGTH_CHANGE, [virt.items.length, virt.shift]);
}

export function prependItems(virt: Virtualizer, items: HTMLElement[]): void {
  virt.items.unshift(...items);
  for (const render of virt.renders) {
    render.idx += items.length;
  }
  virt.store.$update(ACTION_ITEMS_LENGTH_CHANGE, [virt.items.length, virt.shift]);
}

export function spliceItems(virt: Virtualizer, amount: number): void {
  virt.items.splice(-amount);
  virt.store.$update(ACTION_ITEMS_LENGTH_CHANGE, [virt.items.length, virt.shift]);
}

export function shiftItems(virt: Virtualizer, amount: number): void {
  virt.items.splice(0, amount);
  for (const render of virt.renders) {
    render.idx -= amount;
  }
  virt.store.$update(ACTION_ITEMS_LENGTH_CHANGE, [virt.items.length, virt.shift]);
}

function render(virt: Virtualizer): void {
  const totalSize = `${virt.store.$getTotalSize()}px`;
  if (virt.totalSize !== totalSize) {
    virt.totalSize = totalSize;
    virt.container.style[virt.totalSizeStyle] = totalSize;
  }

  const isScrolling = virt.store.$isScrolling();
  if (virt.isScrolling !== isScrolling) {
    virt.isScrolling = isScrolling;
    virt.container.style.pointerEvents = isScrolling ? "none" : "";
  }

  const [startIdx, endIdx] = virt.store.$getRange();
  const newRenders: Render[] = [];
  for (let itemIdx = startIdx; itemIdx <= endIdx; itemIdx++) {
    let render = virt.renders[0];

    if (render === undefined) {
      const newRender = renderItem(virt, itemIdx, newRenders);
      if (newRender !== undefined) {
        virt.container.appendChild(newRender);
        virt.renders.shift();
      }
      continue;
    }

    while (itemIdx > render.idx) {
      render.item.remove();
      render.unobserve();
      virt.renders.shift();

      const nextRender = virt.renders[0];
      if (nextRender === undefined) {
        const newRender = renderItem(virt, itemIdx, newRenders);
        if (newRender !== undefined) {
          virt.container.appendChild(newRender);
          virt.renders.shift();
        }
        break;
      }

      render = nextRender;
    }

    // item should be rendered before target render.item
    if (itemIdx < render.idx) {
      const newRender = renderItem(virt, itemIdx, newRenders);
      if (newRender !== undefined) {
        virt.container.insertBefore(newRender, render.item);
      }
      continue;
    }

    // item already rendered, update styles
    if (itemIdx === render.idx) {
      const hide = virt.store.$isUnmeasuredItem(itemIdx);
      if (render.hide !== hide) {
        render.hide = hide;
        render.item.style.position = hide ? "" : "absolute";
        render.item.style.visibility = hide ? "hidden" : "visible";
      }

      const offset = `${virt.store.$getItemOffset(itemIdx)}px`;
      if (render.offset !== offset) {
        render.offset = offset;
        render.item.style[virt.offsetStyle] = offset;
      }

      newRenders.push(render);
      virt.renders.shift();
    }
  }

  for (const render of virt.renders) {
    render.item.remove();
    render.unobserve();
  }

  virt.renders = newRenders;

  const jumpCount = virt.store.$getJumpCount();
  if (virt.jumpCount !== jumpCount) {
    virt.jumpCount = jumpCount;
    virt.scroller.$fixScrollJump();
  }
}
