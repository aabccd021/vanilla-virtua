import { type CacheSnapshot, type ScrollToIndexOpts, isRTLDocument } from "virtua/unstable_core";

import {
  type Virtualizer,
  appendItems as virtAppendItems,
  dispose as virtDispose,
  init as virtInit,
  prependItems as virtPrependItems,
  scrollBy as virtScrollBy,
  scrollTo as virtScrollTo,
  scrollToIndex as virtScrollToIndex,
  setShift as virtSetShift,
  shiftItems as virtShiftItems,
  spliceItems as virtSpliceItems,
} from "./virtualizer.ts";

type Vlist = {
  readonly virt: Virtualizer;
  readonly root: HTMLElement;
  readonly isHorizontal: boolean;
  reverse?: boolean;
  wrapper?: HTMLElement;
};

function createItem(child: HTMLElement, isHorizontal: boolean): HTMLElement {
  const item = document.createElement("div");
  item.style[isHorizontal ? "height" : "width"] = "100%";
  if (isHorizontal) {
    item.style.display = "flex";
  }
  item.appendChild(child);
  return item;
}

function createWrapper(container: HTMLElement): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.style.visibility = "hidden";
  wrapper.style.display = "flex";
  wrapper.style.flexDirection = "column";
  wrapper.style.justifyContent = "flex-end";
  wrapper.style.minHeight = "100%";
  wrapper.appendChild(container);
  return wrapper;
}

export function init({
  reverse,
  shift,
  horizontal,
  cache,
  children,
  style,
}: {
  readonly reverse?: boolean;
  readonly shift?: boolean;
  readonly horizontal?: boolean;
  readonly cache?: CacheSnapshot;
  readonly children?: HTMLElement[];
  readonly style?: Partial<CSSStyleDeclaration>;
}): Vlist {
  const isHorizontal = !!horizontal;
  const container = document.createElement("div");
  const offsetStyle = isHorizontal ? (isRTLDocument() ? "right" : "left") : "top";

  container.style.overflowAnchor = "none";
  container.style.flex = "none";
  container.style.position = "relative";
  container.style.visibility = "hidden";
  container.style[isHorizontal ? "height" : "width"] = "100%";

  for (const child of children ?? []) {
    const item = createItem(child, isHorizontal);
    container.appendChild(item);
  }

  const root = document.createElement("div");
  root.style.display = isHorizontal ? "inline-block" : "block";
  root.style[isHorizontal ? "overflowX" : "overflowY"] = "auto";
  root.style.contain = "strict";
  root.style.width = root.style.width === "" ? "100%" : root.style.width;
  root.style.height = root.style.height === "" ? "100%" : root.style.height;

  const shouldReverse = reverse && !isHorizontal;

  let wrapper: HTMLElement | undefined;

  if (shouldReverse) {
    wrapper = createWrapper(container);
    root.appendChild(wrapper);
  } else {
    root.appendChild(container);
  }

  if (style !== undefined) {
    Object.assign(root.style, style);
  }

  const totalSizeStyle = isHorizontal ? "width" : "height";
  const virt = virtInit({
    isHorizontal,
    totalSizeStyle,
    offsetStyle,
    root,
    container,
    cache,
    shift,
  });

  return {
    virt,
    root,
    wrapper,
    reverse,
    isHorizontal,
  };
}

export function dispose(vlist: Vlist) {
  virtDispose(vlist.virt);
}

export function appendItems(vlist: Vlist, newItems: HTMLElement[]) {
  const newVirtualizerItems = newItems.map((child) => createItem(child, vlist.isHorizontal));
  return virtAppendItems(vlist.virt, newVirtualizerItems);
}

export function prependItems(vlist: Vlist, newItems: HTMLElement[]) {
  const newVirtualizerItems = newItems.map((child) => createItem(child, vlist.isHorizontal));
  return virtPrependItems(vlist.virt, newVirtualizerItems);
}

export function spliceItems(vlist: Vlist, amount: number) {
  return virtSpliceItems(vlist.virt, amount);
}

export function shiftItems(vlist: Vlist, amount: number) {
  return virtShiftItems(vlist.virt, amount);
}

export function setReverse(vlist: Vlist, reverse: boolean) {
  if (vlist.reverse === reverse) {
    return;
  }
  vlist.reverse = reverse;
  const shouldReverse = reverse && !vlist.isHorizontal;
  if (shouldReverse) {
    const wrapper = createWrapper(vlist.virt.container);
    vlist.wrapper = wrapper;
    vlist.root.appendChild(wrapper);
  } else {
    vlist.wrapper?.remove();
    vlist.root.appendChild(vlist.virt.container);
  }
}

export function scrollToIndex(vlist: Vlist, index: number, opts?: ScrollToIndexOpts): void {
  virtScrollToIndex(vlist.virt, index, opts);
}

export function scrollTo(vlist: Vlist, offset: number): void {
  virtScrollTo(vlist.virt, offset);
}

export function scrollBy(vlist: Vlist, offset: number): void {
  virtScrollBy(vlist.virt, offset);
}

export function getCacheSnapshot(vlist: Vlist): CacheSnapshot {
  return vlist.virt.store.$getCacheSnapshot();
}

export function getScrollOffset(vlist: Vlist): number {
  return vlist.virt.store.$getScrollOffset();
}

export function setShift(vlist: Vlist, shift: boolean): void {
  virtSetShift(vlist.virt, shift);
}
