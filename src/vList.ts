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
  const container = document.createElement("div");
  for (const child of children ?? []) {
    const item = document.createElement("div");
    item.appendChild(child);
    container.appendChild(item);
  }

  const root = document.createElement("div");

  const shouldReverse = reverse && !horizontal;

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

  const initResult = indexInit({ horizontal, container, cache, shift });

  return { ...initResult, root };
}

export function appendChildren() {}

export function spliceChildren() {}

export function prependChildren() {}

export function shiftChildren() {}

export function setShift() {}

export function setReverse() {}
