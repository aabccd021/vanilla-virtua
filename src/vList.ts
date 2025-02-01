import {
  type CacheSnapshot,
  type Core,
  appendChildren as coreAppendChildren,
  init as coreInit,
  prependChildren as corePrependChildren,
  shiftChildren as coreShiftChildren,
  spliceChildren as coreSpliceChildren,
} from "./core.ts";

function setStyle<T extends keyof CSSStyleDeclaration>(element: HTMLElement, key: T, value: CSSStyleDeclaration[T]) {
  element.style[key] = value;
}

type Vlist = Core & {
  readonly root: HTMLElement;
  readonly isHorizontal: boolean;
  readonly offsetAttr: "left" | "right" | "top";
  reverse?: boolean;
  wrapper?: HTMLElement;
};

function newItem(child: HTMLElement, isHorizontal: boolean, offsetAttr: "left" | "right" | "top"): HTMLElement {
  const item = document.createElement("div");
  setStyle(item, "position", "absolute");
  setStyle(item, isHorizontal ? "height" : "width", "100%");
  setStyle(item, offsetAttr, "0px");
  if (isHorizontal) {
    setStyle(item, "display", "flex");
  }
  item.appendChild(child);
  return item;
}

function createWrapper(container: HTMLElement): HTMLElement {
  const wrapper = document.createElement("div");
  setStyle(wrapper, "visibility", "hidden");
  setStyle(wrapper, "display", "flex");
  setStyle(wrapper, "flexDirection", "column");
  setStyle(wrapper, "justifyContent", "flex-end");
  setStyle(wrapper, "minHeight", "100%");
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
  const totalSizeAttr = isHorizontal ? "width" : "height";
  const offsetAttr = isHorizontal
    ? getComputedStyle(document.documentElement).direction === "rtl"
      ? "right"
      : "left"
    : "top";

  setStyle(container, "overflowAnchor", "none");
  setStyle(container, "flex", "none");
  setStyle(container, "position", "relative");
  setStyle(container, "visibility", "hidden");
  setStyle(container, totalSizeAttr, "100%");

  for (const child of children ?? []) {
    const item = newItem(child, isHorizontal, offsetAttr);
    container.appendChild(item);
  }

  const root = document.createElement("div");
  setStyle(root, "display", isHorizontal ? "inline-block" : "block");
  setStyle(root, isHorizontal ? "overflowX" : "overflowY", "auto");
  setStyle(root, "contain", "strict");
  setStyle(root, "width", "100%");
  setStyle(root, "height", "100%");

  const shouldReverse = reverse && !isHorizontal;

  let wrapper: HTMLElement | undefined;

  if (shouldReverse) {
    const wrapper = createWrapper(container);
    root.appendChild(wrapper);
  } else {
    root.appendChild(container);
  }

  if (style !== undefined) {
    Object.assign(root.style, style);
  }

  const core = coreInit({
    horizontal: isHorizontal,
    totalSizeAttr,
    offsetAttr,
    root,
    container,
    cache,
    shift,
  });

  return { ...core, root, wrapper, reverse, isHorizontal, offsetAttr };
}

export function appendChildren(vlist: Vlist, newChildren: HTMLElement[]) {
  const newItems: HTMLElement[] = [];
  for (const child of newChildren) {
    const item = newItem(child, vlist.isHorizontal, vlist.offsetAttr);
    newItems.push(item);
  }
  return coreAppendChildren(vlist.context, newItems);
}

export function prependChildren(vlist: Vlist, newChildren: HTMLElement[]) {
  const newItems: HTMLElement[] = [];
  for (const child of newChildren) {
    const item = newItem(child, vlist.isHorizontal, vlist.offsetAttr);
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

export function setReverse(vlist: Vlist, reverse: boolean) {
  if (vlist.reverse === reverse) {
    return;
  }
  vlist.reverse = reverse;
  const shouldReverse = reverse && !vlist.isHorizontal;
  if (shouldReverse) {
    const wrapper = createWrapper(vlist.context.container);
    vlist.wrapper = wrapper;
    vlist.root.appendChild(wrapper);
  } else {
    vlist.wrapper?.remove();
    vlist.root.appendChild(vlist.context.container);
  }
}
