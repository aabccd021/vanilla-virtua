import { type CacheSnapshot, type InitResult, init as indexInit } from "./index.ts";

export function init({
  cache,
  children,
  style,
}: {
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
  root.appendChild(container);

  if (style !== undefined) {
    Object.assign(root.style, style);
  }

  const initResult = indexInit({ container, cache });

  return { ...initResult, root };
}
