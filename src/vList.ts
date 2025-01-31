import {
  type CacheSnapshot,
  type Context,
  type InitResult,
  appendChildren as coreAppendChildren,
  init as coreInit,
  prependChildren as corePrependChildren,
  shiftChildren as coreShiftChildren,
  spliceChildren as coreSpliceChildren,
} from "./core.ts";

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
}): InitResult & { readonly root: HTMLElement } {
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

  if (shouldReverse) {
    const wrapper = document.createElement("div");
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
    horizontal: isHorizontal,
    root,
    container,
    cache,
    shift,
  });

  return { ...initResult, root };
}

export function appendChildren(context: Context, newChildren: HTMLElement[]) {
  const newItems: HTMLElement[] = [];
  for (const child of newChildren) {
    const item = newItem(child, context.isHorizontal);
    newItems.push(item);
  }
  return coreAppendChildren(context, newItems);
}

export function prependChildren(context: Context, newChildren: HTMLElement[]) {
  const newItems: HTMLElement[] = [];
  for (const child of newChildren) {
    const item = newItem(child, context.isHorizontal);
    newItems.push(item);
  }
  return corePrependChildren(context, newItems);
}

export function spliceChildren(context: Context, amount: number) {
  return coreSpliceChildren(context, amount);
}

export function shiftChildren(context: Context, amount: number) {
  return coreShiftChildren(context, amount);
}

export function setShift() {}

export function setReverse() {}
