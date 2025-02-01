import {
  type CacheSnapshot,
  type Virtualizer,
  appendItems as virtAppendItems,
  init as virtInit,
  prependItems as virtPrependItems,
  shiftItems as virtShiftItems,
  spliceItems as virtSpliceItems,
} from "./core.ts";

type Vlist = {
  readonly virtualizer: Virtualizer;
  readonly root: HTMLElement;
  readonly isHorizontal: boolean;
  readonly offsetStyle: "left" | "right" | "top";
  reverse?: boolean;
  wrapper?: HTMLElement;
};

function createItem(child: HTMLElement, isHorizontal: boolean, offsetStyle: "left" | "right" | "top"): HTMLElement {
  const item = document.createElement("div");
  item.style.position = "absolute";
  item.style[isHorizontal ? "height" : "width"] = "100%";
  item.style[offsetStyle] = "0px";

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
  const totalSizeStyle = isHorizontal ? "width" : "height";
  const offsetStyle = isHorizontal
    ? getComputedStyle(document.documentElement).direction === "rtl"
      ? "right"
      : "left"
    : "top";

  container.style.overflowAnchor = "none";
  container.style.flex = "none";
  container.style.position = "relative";
  container.style.visibility = "hidden";
  container.style[totalSizeStyle] = "100%";

  for (const child of children ?? []) {
    const item = createItem(child, isHorizontal, offsetStyle);
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

  const virtualizer = virtInit({
    horizontal: isHorizontal,
    totalSizeStyle,
    offsetStyle,
    root,
    container,
    cache,
    shift,
  });

  return { virtualizer, root, wrapper, reverse, isHorizontal, offsetStyle };
}

export function appendItems(vlist: Vlist, newItems: HTMLElement[]) {
  const newVirtualizerItems = newItems.map((child) => createItem(child, vlist.isHorizontal, vlist.offsetStyle));
  return virtAppendItems(vlist.virtualizer, newVirtualizerItems);
}

export function prependItems(vlist: Vlist, newItems: HTMLElement[]) {
  const newVirtualizerItems = newItems.map((child) => createItem(child, vlist.isHorizontal, vlist.offsetStyle));
  return virtPrependItems(vlist.virtualizer, newVirtualizerItems);
}

export function spliceItems(vlist: Vlist, amount: number) {
  return virtSpliceItems(vlist.virtualizer, amount);
}

export function shiftItems(vlist: Vlist, amount: number) {
  return virtShiftItems(vlist.virtualizer, amount);
}

export function setReverse(vlist: Vlist, reverse: boolean) {
  if (vlist.reverse === reverse) {
    return;
  }
  vlist.reverse = reverse;
  const shouldReverse = reverse && !vlist.isHorizontal;
  if (shouldReverse) {
    const wrapper = createWrapper(vlist.virtualizer.container);
    vlist.wrapper = wrapper;
    vlist.root.appendChild(wrapper);
  } else {
    vlist.wrapper?.remove();
    vlist.root.appendChild(vlist.virtualizer.container);
  }
}
