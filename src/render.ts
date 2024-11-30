import * as virtua from "virtua/core";

interface ListResizer {
  _observeRoot(viewportEl: HTMLElement): void;
  _observeItem: virtua.ItemResizeObserver;
  _dispose(): void;
}

interface ChildData {
  idx: number;
  hide: boolean;
  top: string;
  element: HTMLElement;
  unobserve: () => void;
}

interface State {
  children: HTMLElement[];
  childData: ChildData[];
  containerHeight?: string;
  jumpCount?: number;
}

interface Context {
  readonly container: HTMLElement;
  readonly store: virtua.VirtualStore;
  readonly resizer: ListResizer;
  readonly scroller: virtua.Scroller;
  readonly itemTag?: keyof HTMLElementTagNameMap;
  readonly state: State;
}

export function appendChild(context: Context, newChild: HTMLElement[]): void {
  context.state.children = context.state.children.concat(newChild);
  context.store._update(virtua.ACTION_ITEMS_LENGTH_CHANGE, [
    context.state.children.length,
    false,
  ]);
  render(context);
}

function newChild(
  context: Context,
  idx: number,
  top: string,
  newChild: ChildData[],
): HTMLElement {
  const child = context.state.children[idx]!;
  const element = document.createElement(context.itemTag ?? "div");
  element.style.position = "absolute";
  element.style.visibility = "visible";
  element.style.top = top;
  element.style.width = "100%";
  element.style.left = "0";
  element.appendChild(child);
  newChild.push({
    idx,
    hide: false,
    top,
    element,
    unobserve: context.resizer._observeItem(element, idx),
  });

  return element;
}

export interface VirtualizerProps {
  /**
   * Elements rendered by this component.
   *
   * You can also pass a function and set {@link VirtualizerProps.count} to create elements lazily.
   */
  children: HTMLElement[];
  // TODO
  // | ((index: number) => HTMLElement);
  /**
   * If you set a function to {@link VirtualizerProps.children}, you have to set total number of items to this prop.
   */
  // TODO
  // count?: number;
  /**
   * Number of items to render above/below the visible bounds of the list.
   * Lower value will give better performance but you can increase to avoid showing blank items in fast scrolling.
   * @defaultValue 4
   */
  overscan?: number;
  /**
   * Item size hint for unmeasured items.
   * It will help to reduce scroll jump when items are measured if used properly.
   *
   * - If not set, initial item sizes will be automatically estimated from measured sizes.
   * This is recommended for most cases.
   * - If set, you can opt out estimation and use the value as initial item size.
   */
  itemSize?: number;
  /**
   * While true is set, scroll position will be maintained from the end not usual start when items are added to/removed from start.
   * It's recommended to set false if you add to/remove from mid/end of the list because it can cause unexpected behavior.
   * This prop is useful for reverse infinite scrolling.
   */
  // shift?: boolean;
  /**
   * If true, rendered as a horizontally scrollable list.
   * Otherwise rendered as a vertically scrollable list.
   */
  // TODO
  // horizontal?: boolean;
  /**
   * List of indexes that should be always mounted, even when off screen.
   */
  // keepMounted?: number[];
  /**
   * You can restore cache by passing a {@link CacheSnapshot} on mount.
   * This is useful when you want to restore scroll position after navigation.
   * The snapshot can be obtained from {@link VirtualizerHandle.cache}.
   *
   * **The length of items should be the same as when you take the snapshot, otherwise restoration may not work as expected.**
   */
  cache?: virtua.CacheSnapshot;
  /**
   * If you put an element before virtualizer, you have to define its height with this prop.
   */
  // startMargin?: number;
  /**
   * A prop for SSR.
   * If set, the specified amount of items will be mounted in the initial rendering regardless of the container size until hydrated.
   */
  // ssrCount?: number;
  /**
   * Component or element type for container element.
   * @defaultValue "div"
   */
  as?: keyof HTMLElementTagNameMap;
  /**
   * Component or element type for item element.
   * This component will get {@link CustomItemComponentProps} as props.
   * @defaultValue "div"
   */
  item?: keyof HTMLElementTagNameMap;
  /**
   * Callback invoked whenever scroll offset changes.
   * @param offset Current scrollTop, or scrollLeft if horizontal: true.
   */
  // TODO
  // onScroll?: (offset: number) => void;
  /**
   * Callback invoked when scrolling stops.
   */
  // TODO
  // onScrollEnd?: () => void;
  /**
   * If true, items are aligned to the end of the list when total size of items are smaller than viewport size.
   * It's useful for chat like app.
   */
  // TODO
  // reverse?: boolean;
}

interface InitResult {
  context: Context;
  dispose: () => void;
  root: HTMLElement;
}

export function init({
  children,
  as,
  itemSize,
  overscan,
  cache,
}: VirtualizerProps): InitResult {
  const container = document.createElement(as ?? "div");
  container.style.overflowAnchor = "none";
  container.style.flex = "none";
  container.style.position = "relative";
  container.style.visibility = "hidden";
  container.style.width = "100%";

  const root = document.createElement("div");
  root.style.display = "block";
  root.style.overflowY = "auto";
  root.style.contain = "strict";
  root.style.width = "100%";
  root.style.height = "100%";
  root.appendChild(container);

  const store = virtua.createVirtualStore(
    children.length,
    itemSize,
    overscan,
    undefined,
    cache,
    !itemSize,
  );

  const resizer = virtua.createResizer(store, false);
  resizer._observeRoot(root);

  const scroller = virtua.createScroller(store, false);
  scroller._observe(root);

  const context: Context = {
    container,
    store,
    resizer,
    scroller,
    state: {
      childData: [],
      children,
    },
  };

  const unsubscribeStore = store._subscribe(
    virtua.UPDATE_VIRTUAL_STATE,
    (_sync) => {
      render(context);
    },
  );

  const dispose = () => {
    unsubscribeStore();
    for (const childData of context.state.childData) {
      childData.unobserve();
    }
  };

  return { context, dispose, root };
}

export function render(context: Context): void {
  requestAnimationFrame(() => {
    _render(context);
  });
}

function _render(context: Context): void {
  const { store, scroller, state, container: container } = context;
  const newJumpCount = store._getJumpCount();
  if (state.jumpCount !== newJumpCount) {
    scroller._fixScrollJump();
    state.jumpCount = newJumpCount;
  }

  const newContainerHeight = `${store._getTotalSize()}px`;
  if (state.containerHeight !== newContainerHeight) {
    container.style.height = newContainerHeight;
    state.containerHeight = newContainerHeight;
  }

  const [startIdx, endIdx] = store._getRange();
  const newChildData: ChildData[] = [];
  for (
    let newChildIdx = startIdx, j = endIdx;
    newChildIdx <= j;
    newChildIdx++
  ) {
    const oldChildDataMaybe: ChildData | undefined = state.childData[0];
    const top = `${store._getItemOffset(newChildIdx)}px`;

    if (oldChildDataMaybe === undefined) {
      const childEl = newChild(context, newChildIdx, top, newChildData);
      container.appendChild(childEl);
      state.childData.shift();
      continue;
    }

    let oldChildData: ChildData = oldChildDataMaybe;
    while (newChildIdx > oldChildData.idx) {
      oldChildData.element.remove();
      oldChildData.unobserve();
      state.childData.shift();

      const nextOldChild = state.childData[0];
      if (nextOldChild === undefined) {
        const childEl = newChild(context, newChildIdx, top, newChildData);
        container.appendChild(childEl);
        state.childData.shift();
        break;
      }

      oldChildData = nextOldChild;
    }

    if (newChildIdx < oldChildData.idx) {
      const childEl = newChild(context, newChildIdx, top, newChildData);
      container.insertBefore(childEl, oldChildData.element);
      continue;
    }

    if (oldChildData.idx === newChildIdx) {
      const prevHide = oldChildData.hide;
      const hide = store._isUnmeasuredItem(newChildIdx);
      if (hide !== prevHide) {
        oldChildData.element.style.position = hide ? "" : "absolute";
        oldChildData.element.style.visibility = hide ? "hidden" : "visible";
        oldChildData.hide = hide;
      }

      const prevTop = oldChildData.top;
      if (top !== prevTop) {
        oldChildData.element.style.top = top;
        oldChildData.top = top;
      }

      newChildData.push(oldChildData);
      state.childData.shift();
      continue;
    }
  }

  for (const oldChild of state.childData) {
    oldChild.element.remove();
    oldChild.unobserve();
  }

  state.childData = newChildData;
}
