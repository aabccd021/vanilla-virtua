import {
  type CacheSnapshot,
  type InitResult,
  appendChildren as coreAppendChildren,
  init as coreInit,
  prependChildren as corePrependChildren,
  setShift as coreSetShift,
  shiftChildren as coreShiftChildren,
  spliceChildren as coreSpliceChildren,
} from "./core.ts";

type Vlist = InitResult & {
  readonly root: HTMLElement;
  reverse?: boolean;
  wrapper?: HTMLElement;
};

function newItem(child: HTMLElement, isHorizontal: boolean): HTMLElement {
  const item = document.createElement("div");
  item.style.position = "absolute";
  item.style[isHorizontal ? "height" : "width"] = "100%";
  item.style[isHorizontal ? "top" : "left"] = "0px";
  if (isHorizontal) {
    item.style.display = "flex";
  }
  item.appendChild(child);
  return item;
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
  container.style.overflowAnchor = "none";
  container.style.flex = "none";
  container.style.position = "relative";
  container.style.visibility = "hidden";
  if (isHorizontal) {
    container.style.height = "100%";
  } else {
    container.style.width = "100%";
  }

  for (const child of children ?? []) {
    const item = newItem(child, isHorizontal);
    container.appendChild(item);
  }

  const root = document.createElement("div");
  root.style.display = isHorizontal ? "inline-block" : "block";
  root.style[isHorizontal ? "overflowX" : "overflowY"] = "auto";
  root.style.contain = "strict";
  root.style.width = root.style.width === "" || root.style.width === undefined ? "100%" : root.style.width;
  root.style.height = root.style.height === "" || root.style.height === undefined ? "100%" : root.style.height;

  const shouldReverse = reverse && !isHorizontal;

  let wrapper: HTMLElement | undefined;

  if (shouldReverse) {
    wrapper = document.createElement("div");
    wrapper.style.visibility = "hidden";
    wrapper.style.display = "flex";
    wrapper.style.flexDirection = "column";
    wrapper.style.justifyContent = "flex-end";
    wrapper.style.minHeight = "100%";
    wrapper.appendChild(container);
    root.appendChild(wrapper);
  } else {
    root.appendChild(container);
  }

  if (style !== undefined) {
    Object.assign(root.style, style);
  }

  const initResult = coreInit({
    totalSizeAttr: isHorizontal ? "width" : "height",
    horizontal: isHorizontal,
    offsetAttr: isHorizontal
      ? getComputedStyle(document.documentElement).direction === "rtl"
        ? "right"
        : "left"
      : "top",
    root,
    container,
    cache,
    shift,
  });

  return { ...initResult, root, wrapper, reverse };
}

export function appendChildren(vlist: Vlist, newChildren: HTMLElement[]) {
  const newItems: HTMLElement[] = [];
  for (const child of newChildren) {
    const item = newItem(child, vlist.context.isHorizontal);
    newItems.push(item);
  }
  return coreAppendChildren(vlist.context, newItems);
}

export function prependChildren(vlist: Vlist, newChildren: HTMLElement[]) {
  const newItems: HTMLElement[] = [];
  for (const child of newChildren) {
    const item = newItem(child, vlist.context.isHorizontal);
    newItems.push(item);
  }
  return corePrependChildren(vlist.context, newItems);
}

export function spliceChildren(vlist: Vlist, amount: number) {
  return coreSpliceChildren(vlist.context, amount);
}

export function shiftChildren(vlist: Vlist, amount: number) {
  return coreShiftChildren(vlist.context, amount);
}

export function setShift(vlist: Vlist, shift: boolean) {
  return coreSetShift(vlist.context, shift);
}

export function setReverse(vlist: Vlist, reverse: boolean) {
  if (vlist.reverse === reverse) {
    return;
  }
  vlist.reverse = reverse;
  const shouldReverse = reverse && !vlist.context.isHorizontal;
  if (shouldReverse) {
    const wrapper = document.createElement("div");
    wrapper.style.visibility = "hidden";
    wrapper.style.display = "flex";
    wrapper.style.flexDirection = "column";
    wrapper.style.justifyContent = "flex-end";
    wrapper.style.minHeight = "100%";
    wrapper.appendChild(vlist.context.container);
    vlist.wrapper = wrapper;
    vlist.root.appendChild(wrapper);
  } else {
    vlist.wrapper?.remove();
    vlist.root.appendChild(vlist.context.container);
  }
}
