import { type CacheSnapshot, type InitResult, init as indexInit } from "./index.ts";

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

  for (const child of children ?? []) {
    const item = document.createElement("div");
    item.style.position = "absolute";
    item.style[isHorizontal ? "height" : "width"] = "100%";
    item.style[isHorizontal ? "top" : "left"] = "0px";
    if (isHorizontal) {
      item.style.display = "flex";
    }

    item.appendChild(child);
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

  const initResult = indexInit({
    horizontal: isHorizontal,
    root,
    container,
    cache,
    shift,
  });

  return { ...initResult, root };
}

export function appendChildren() {}

export function spliceChildren() {}

export function prependChildren() {}

export function shiftChildren() {}

export function setShift() {}

export function setReverse() {}
