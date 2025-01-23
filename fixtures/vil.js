// node_modules/virtua/src/core/utils.ts
var NULL = null;
var { min, max, abs, floor } = Math;
var clamp = (value, minValue, maxValue) => min(maxValue, max(minValue, value));
var sort = (arr) => {
  return [...arr].sort((a, b) => a - b);
};
var microtask =
  typeof queueMicrotask === "function"
    ? queueMicrotask
    : (fn) => {
        Promise.resolve().then(fn);
      };
var once = (fn) => {
  let called;
  let cache;
  return () => {
    if (!called) {
      called = true;
      cache = fn();
    }
    return cache;
  };
};

// node_modules/virtua/src/core/cache.ts
var UNCACHED = -1;
var fill = (array, length, prepend) => {
  const key = prepend ? "unshift" : "push";
  for (let i = 0; i < length; i++) {
    array[key](UNCACHED);
  }
  return array;
};
var getItemSize = (cache, index) => {
  const size = cache._sizes[index];
  return size === UNCACHED ? cache._defaultItemSize : size;
};
var setItemSize = (cache, index, size) => {
  const isInitialMeasurement = cache._sizes[index] === UNCACHED;
  cache._sizes[index] = size;
  cache._computedOffsetIndex = min(index, cache._computedOffsetIndex);
  return isInitialMeasurement;
};
var computeOffset = (cache, index) => {
  if (!cache._length) return 0;
  if (cache._computedOffsetIndex >= index) {
    return cache._offsets[index];
  }
  if (cache._computedOffsetIndex < 0) {
    cache._offsets[0] = 0;
    cache._computedOffsetIndex = 0;
  }
  let i = cache._computedOffsetIndex;
  let top = cache._offsets[i];
  while (i < index) {
    top += getItemSize(cache, i);
    cache._offsets[++i] = top;
  }
  cache._computedOffsetIndex = index;
  return top;
};
var computeTotalSize = (cache) => {
  if (!cache._length) return 0;
  return (
    computeOffset(cache, cache._length - 1) +
    getItemSize(cache, cache._length - 1)
  );
};
var findIndex = (cache, offset, low = 0, high = cache._length - 1) => {
  while (low <= high) {
    const mid = floor((low + high) / 2);
    const itemOffset = computeOffset(cache, mid);
    if (itemOffset <= offset) {
      if (itemOffset + getItemSize(cache, mid) > offset) {
        return mid;
      }
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return clamp(low, 0, cache._length - 1);
};
var computeRange = (cache, scrollOffset, viewportSize, prevStartIndex) => {
  prevStartIndex = min(prevStartIndex, cache._length - 1);
  if (computeOffset(cache, prevStartIndex) <= scrollOffset) {
    const end = findIndex(cache, scrollOffset + viewportSize, prevStartIndex);
    return [findIndex(cache, scrollOffset, prevStartIndex, end), end];
  } else {
    const start = findIndex(cache, scrollOffset, void 0, prevStartIndex);
    return [start, findIndex(cache, scrollOffset + viewportSize, start)];
  }
};
var estimateDefaultItemSize = (cache, startIndex) => {
  let measuredCountBeforeStart = 0;
  const measuredSizes = [];
  cache._sizes.forEach((s, i) => {
    if (s !== UNCACHED) {
      measuredSizes.push(s);
      if (i < startIndex) {
        measuredCountBeforeStart++;
      }
    }
  });
  cache._computedOffsetIndex = -1;
  const sorted = sort(measuredSizes);
  const len = sorted.length;
  const mid = (len / 2) | 0;
  const median =
    len % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  const prevDefaultItemSize = cache._defaultItemSize;
  return (
    ((cache._defaultItemSize = median) - prevDefaultItemSize) *
    max(startIndex - measuredCountBeforeStart, 0)
  );
};
var initCache = (length, itemSize, snapshot) => {
  return {
    _defaultItemSize: snapshot ? snapshot[1] : itemSize,
    _sizes:
      snapshot && snapshot[0]
        ? // https://github.com/inokawa/virtua/issues/441
          fill(
            snapshot[0].slice(0, min(length, snapshot[0].length)),
            max(0, length - snapshot[0].length),
          )
        : fill([], length),
    _length: length,
    _computedOffsetIndex: -1,
    _offsets: fill([], length),
  };
};
var takeCacheSnapshot = (cache) => {
  return [cache._sizes.slice(), cache._defaultItemSize];
};
var updateCacheLength = (cache, length, isShift) => {
  const diff = length - cache._length;
  cache._computedOffsetIndex = isShift
    ? // Discard cache for now
      -1
    : min(length - 1, cache._computedOffsetIndex);
  cache._length = length;
  if (diff > 0) {
    fill(cache._offsets, diff);
    fill(cache._sizes, diff, isShift);
    return cache._defaultItemSize * diff;
  } else {
    cache._offsets.splice(diff);
    return (
      isShift ? cache._sizes.splice(0, -diff) : cache._sizes.splice(diff)
    ).reduce(
      (acc, removed) =>
        acc - (removed === UNCACHED ? cache._defaultItemSize : removed),
      0,
    );
  }
};

// node_modules/virtua/src/core/environment.ts
var isBrowser = typeof window !== "undefined";
var getDocumentElement = () => document.documentElement;
var getCurrentDocument = (node) => node.ownerDocument;
var getCurrentWindow = (doc) => doc.defaultView;
var isRTLDocument = /* @__PURE__ */ once(() => {
  return isBrowser
    ? getComputedStyle(getDocumentElement()).direction === "rtl"
    : false;
});
var isIOSWebKit = /* @__PURE__ */ once(() => {
  return /iP(hone|od|ad)/.test(navigator.userAgent);
});
var isSmoothScrollSupported = /* @__PURE__ */ once(() => {
  return "scrollBehavior" in getDocumentElement().style;
});

// node_modules/virtua/src/core/store.ts
var SCROLL_IDLE = 0;
var SCROLL_DOWN = 1;
var SCROLL_UP = 2;
var SCROLL_BY_NATIVE = 0;
var SCROLL_BY_MANUAL_SCROLL = 1;
var SCROLL_BY_SHIFT = 2;
var ACTION_SCROLL = 1;
var ACTION_SCROLL_END = 2;
var ACTION_ITEM_RESIZE = 3;
var ACTION_VIEWPORT_RESIZE = 4;
var ACTION_ITEMS_LENGTH_CHANGE = 5;
var ACTION_START_OFFSET_CHANGE = 6;
var ACTION_MANUAL_SCROLL = 7;
var ACTION_BEFORE_MANUAL_SMOOTH_SCROLL = 8;
var UPDATE_VIRTUAL_STATE = 1;
var UPDATE_SIZE_EVENT = 2;
var UPDATE_SCROLL_EVENT = 4;
var UPDATE_SCROLL_END_EVENT = 8;
var isInitialMeasurementDone = (store) => {
  return !!store.$getViewportSize();
};
var createVirtualStore = (
  elementsCount,
  itemSize = 40,
  overscan = 4,
  ssrCount = 0,
  cacheSnapshot,
  shouldAutoEstimateItemSize = false,
) => {
  let isSSR = !!ssrCount;
  let stateVersion = [];
  let viewportSize = 0;
  let startSpacerSize = 0;
  let scrollOffset = 0;
  let jumpCount = 0;
  let jump = 0;
  let pendingJump = 0;
  let _flushedJump = 0;
  let _scrollDirection = SCROLL_IDLE;
  let _scrollMode = SCROLL_BY_NATIVE;
  let _frozenRange = isSSR ? [0, max(ssrCount - 1, 0)] : NULL;
  let _prevRange = [0, 0];
  let _totalMeasuredSize = 0;
  const cache = initCache(elementsCount, itemSize, cacheSnapshot);
  const subscribers = /* @__PURE__ */ new Set();
  const getRelativeScrollOffset = () => scrollOffset - startSpacerSize;
  const getVisibleOffset = () => getRelativeScrollOffset() + pendingJump + jump;
  const getRange = (offset) => {
    return computeRange(cache, offset, viewportSize, _prevRange[0]);
  };
  const getTotalSize = () => computeTotalSize(cache);
  const getItemOffset = (index) => {
    return computeOffset(cache, index) - pendingJump;
  };
  const getItemSize2 = (index) => {
    return getItemSize(cache, index);
  };
  const applyJump = (j) => {
    if (j) {
      if (isIOSWebKit() && _scrollDirection !== SCROLL_IDLE) {
        pendingJump += j;
      } else {
        jump += j;
        jumpCount++;
      }
    }
  };
  return {
    $getStateVersion: () => stateVersion,
    $getCacheSnapshot: () => {
      return takeCacheSnapshot(cache);
    },
    $getRange: () => {
      if (_flushedJump) {
        return _prevRange;
      }
      let [startIndex, endIndex] = getRange(max(0, getVisibleOffset()));
      if (_frozenRange) {
        startIndex = min(startIndex, _frozenRange[0]);
        endIndex = max(endIndex, _frozenRange[1]);
      }
      if (_scrollDirection !== SCROLL_DOWN) {
        startIndex -= max(0, overscan);
      }
      if (_scrollDirection !== SCROLL_UP) {
        endIndex += max(0, overscan);
      }
      return (_prevRange = [
        max(startIndex, 0),
        min(endIndex, cache._length - 1),
      ]);
    },
    $findStartIndex: () => findIndex(cache, getVisibleOffset()),
    $findEndIndex: () => findIndex(cache, getVisibleOffset() + viewportSize),
    $isUnmeasuredItem: (index) => cache._sizes[index] === UNCACHED,
    _hasUnmeasuredItemsInFrozenRange: () => {
      if (!_frozenRange) return false;
      return cache._sizes
        .slice(
          max(0, _frozenRange[0] - 1),
          min(cache._length - 1, _frozenRange[1] + 1) + 1,
        )
        .includes(UNCACHED);
    },
    $getItemOffset: getItemOffset,
    $getItemSize: getItemSize2,
    $getItemsLength: () => cache._length,
    $getScrollOffset: () => scrollOffset,
    $isScrolling: () => _scrollDirection !== SCROLL_IDLE,
    $getViewportSize: () => viewportSize,
    $getStartSpacerSize: () => startSpacerSize,
    $getTotalSize: getTotalSize,
    $getJumpCount: () => jumpCount,
    _flushJump: () => {
      _flushedJump = jump;
      jump = 0;
      return [
        _flushedJump,
        // Use absolute position not to exceed scrollable bounds
        _scrollMode === SCROLL_BY_SHIFT || // https://github.com/inokawa/virtua/discussions/475
          getRelativeScrollOffset() + viewportSize >= getTotalSize(),
      ];
    },
    $subscribe: (target, cb) => {
      const sub = [target, cb];
      subscribers.add(sub);
      return () => {
        subscribers.delete(sub);
      };
    },
    $update: (type, payload) => {
      let shouldFlushPendingJump;
      let shouldSync;
      let mutated = 0;
      switch (type) {
        case ACTION_SCROLL: {
          const flushedJump = _flushedJump;
          _flushedJump = 0;
          const delta = payload - scrollOffset;
          const distance = abs(delta);
          const isJustJumped = flushedJump && distance < abs(flushedJump) + 1;
          if (
            !isJustJumped && // Ignore until manual scrolling
            _scrollMode === SCROLL_BY_NATIVE
          ) {
            _scrollDirection = delta < 0 ? SCROLL_UP : SCROLL_DOWN;
          }
          if (isSSR) {
            _frozenRange = NULL;
            isSSR = false;
          }
          scrollOffset = payload;
          mutated = UPDATE_SCROLL_EVENT;
          const relativeOffset = getRelativeScrollOffset();
          if (
            relativeOffset >= -viewportSize &&
            relativeOffset <= getTotalSize()
          ) {
            mutated += UPDATE_VIRTUAL_STATE;
            shouldSync = distance > viewportSize;
          }
          break;
        }
        case ACTION_SCROLL_END: {
          mutated = UPDATE_SCROLL_END_EVENT;
          if (_scrollDirection !== SCROLL_IDLE) {
            shouldFlushPendingJump = true;
            mutated += UPDATE_VIRTUAL_STATE;
          }
          _scrollDirection = SCROLL_IDLE;
          _scrollMode = SCROLL_BY_NATIVE;
          _frozenRange = NULL;
          break;
        }
        case ACTION_ITEM_RESIZE: {
          const updated = payload.filter(
            ([index, size]) => cache._sizes[index] !== size,
          );
          if (!updated.length) {
            break;
          }
          applyJump(
            updated.reduce((acc, [index, size]) => {
              if (
                // Keep distance from end during shifting
                _scrollMode === SCROLL_BY_SHIFT ||
                (_frozenRange
                  ? // https://github.com/inokawa/virtua/issues/380
                    // https://github.com/inokawa/virtua/issues/590
                    !isSSR && index < _frozenRange[0]
                  : // Otherwise we should maintain visible position
                    getItemOffset(index) + // https://github.com/inokawa/virtua/issues/385
                      (_scrollDirection === SCROLL_IDLE &&
                      _scrollMode === SCROLL_BY_NATIVE
                        ? getItemSize2(index)
                        : 0) <
                    getRelativeScrollOffset())
              ) {
                acc += size - getItemSize2(index);
              }
              return acc;
            }, 0),
          );
          for (const [index, size] of updated) {
            const prevSize = getItemSize2(index);
            const isInitialMeasurement = setItemSize(cache, index, size);
            if (shouldAutoEstimateItemSize) {
              _totalMeasuredSize += isInitialMeasurement
                ? size
                : size - prevSize;
            }
          }
          if (
            shouldAutoEstimateItemSize &&
            viewportSize && // If the total size is lower than the viewport, the item may be a empty state
            _totalMeasuredSize > viewportSize
          ) {
            applyJump(
              estimateDefaultItemSize(
                cache,
                findIndex(cache, getVisibleOffset()),
              ),
            );
            shouldAutoEstimateItemSize = false;
          }
          mutated = UPDATE_VIRTUAL_STATE + UPDATE_SIZE_EVENT;
          shouldSync = true;
          break;
        }
        case ACTION_VIEWPORT_RESIZE: {
          if (viewportSize !== payload) {
            viewportSize = payload;
            mutated = UPDATE_VIRTUAL_STATE + UPDATE_SIZE_EVENT;
          }
          break;
        }
        case ACTION_ITEMS_LENGTH_CHANGE: {
          if (payload[1]) {
            applyJump(updateCacheLength(cache, payload[0], true));
            _scrollMode = SCROLL_BY_SHIFT;
            mutated = UPDATE_VIRTUAL_STATE;
          } else {
            updateCacheLength(cache, payload[0]);
            mutated = UPDATE_VIRTUAL_STATE;
          }
          break;
        }
        case ACTION_START_OFFSET_CHANGE: {
          startSpacerSize = payload;
          break;
        }
        case ACTION_MANUAL_SCROLL: {
          _scrollMode = SCROLL_BY_MANUAL_SCROLL;
          break;
        }
        case ACTION_BEFORE_MANUAL_SMOOTH_SCROLL: {
          _frozenRange = getRange(payload);
          mutated = UPDATE_VIRTUAL_STATE;
          break;
        }
      }
      if (mutated) {
        stateVersion = [];
        if (shouldFlushPendingJump && pendingJump) {
          jump += pendingJump;
          pendingJump = 0;
          jumpCount++;
        }
        subscribers.forEach(([target, cb]) => {
          if (!(mutated & target)) {
            return;
          }
          cb(shouldSync);
        });
      }
    },
  };
};

// node_modules/virtua/src/core/scroller.ts
var timeout = setTimeout;
var debounce = (fn, ms) => {
  let id;
  const cancel = () => {
    if (id != NULL) {
      clearTimeout(id);
    }
  };
  const debouncedFn = () => {
    cancel();
    id = timeout(() => {
      id = NULL;
      fn();
    }, ms);
  };
  debouncedFn._cancel = cancel;
  return debouncedFn;
};
var normalizeOffset = (offset, isHorizontal) => {
  if (isHorizontal && isRTLDocument()) {
    return -offset;
  } else {
    return offset;
  }
};
var createScrollObserver = (
  store,
  viewport,
  isHorizontal,
  getScrollOffset,
  updateScrollOffset,
  getStartOffset,
) => {
  const now = Date.now;
  let lastScrollTime = 0;
  let wheeling = false;
  let touching = false;
  let justTouchEnded = false;
  let stillMomentumScrolling = false;
  const onScrollEnd = debounce(() => {
    if (wheeling || touching) {
      wheeling = false;
      onScrollEnd();
      return;
    }
    justTouchEnded = false;
    store.$update(ACTION_SCROLL_END);
  }, 150);
  const onScroll = () => {
    lastScrollTime = now();
    if (justTouchEnded) {
      stillMomentumScrolling = true;
    }
    if (getStartOffset) {
      store.$update(ACTION_START_OFFSET_CHANGE, getStartOffset());
    }
    store.$update(ACTION_SCROLL, getScrollOffset());
    onScrollEnd();
  };
  const onWheel = (e) => {
    if (
      wheeling || // Scroll start should be detected with scroll event
      !store.$isScrolling() || // Probably a pinch-to-zoom gesture
      e.ctrlKey
    ) {
      return;
    }
    const timeDelta = now() - lastScrollTime;
    if (
      // Check if wheel event occurs some time after scrolling
      150 > timeDelta &&
      50 < timeDelta && // Get delta before checking deltaMode for firefox behavior
      // https://github.com/w3c/uievents/issues/181#issuecomment-392648065
      // https://bugzilla.mozilla.org/show_bug.cgi?id=1392460#c34
      (isHorizontal ? e.deltaX : e.deltaY)
    ) {
      wheeling = true;
    }
  };
  const onTouchStart = () => {
    touching = true;
    justTouchEnded = stillMomentumScrolling = false;
  };
  const onTouchEnd = () => {
    touching = false;
    if (isIOSWebKit()) {
      justTouchEnded = true;
    }
  };
  viewport.addEventListener("scroll", onScroll);
  viewport.addEventListener("wheel", onWheel, { passive: true });
  viewport.addEventListener("touchstart", onTouchStart, { passive: true });
  viewport.addEventListener("touchend", onTouchEnd, { passive: true });
  return {
    _dispose: () => {
      viewport.removeEventListener("scroll", onScroll);
      viewport.removeEventListener("wheel", onWheel);
      viewport.removeEventListener("touchstart", onTouchStart);
      viewport.removeEventListener("touchend", onTouchEnd);
      onScrollEnd._cancel();
    },
    _fixScrollJump: () => {
      const [jump, shift] = store._flushJump();
      if (!jump) return;
      updateScrollOffset(
        normalizeOffset(jump, isHorizontal),
        shift,
        stillMomentumScrolling,
      );
      stillMomentumScrolling = false;
      if (shift && store.$getViewportSize() > store.$getTotalSize()) {
        store.$update(ACTION_SCROLL, getScrollOffset());
      }
    },
  };
};
var createScroller = (store, isHorizontal) => {
  let viewportElement;
  let scrollObserver;
  let cancelScroll;
  const scrollOffsetKey = isHorizontal ? "scrollLeft" : "scrollTop";
  const overflowKey = isHorizontal ? "overflowX" : "overflowY";
  const scheduleImperativeScroll = async (getTargetOffset, smooth) => {
    if (!viewportElement) {
      microtask(() => scheduleImperativeScroll(getTargetOffset, smooth));
      return;
    }
    if (cancelScroll) {
      cancelScroll();
    }
    const waitForMeasurement = () => {
      let queue;
      return [
        new Promise((resolve, reject) => {
          queue = resolve;
          cancelScroll = reject;
          if (isInitialMeasurementDone(store)) {
            timeout(reject, 150);
          }
        }),
        store.$subscribe(UPDATE_SIZE_EVENT, () => {
          queue && queue();
        }),
      ];
    };
    if (smooth && isSmoothScrollSupported()) {
      while (true) {
        store.$update(ACTION_BEFORE_MANUAL_SMOOTH_SCROLL, getTargetOffset());
        if (!store._hasUnmeasuredItemsInFrozenRange()) {
          break;
        }
        const [promise, unsubscribe] = waitForMeasurement();
        try {
          await promise;
        } catch (e) {
          return;
        } finally {
          unsubscribe();
        }
      }
      viewportElement.scrollTo({
        [isHorizontal ? "left" : "top"]: normalizeOffset(
          getTargetOffset(),
          isHorizontal,
        ),
        behavior: "smooth",
      });
    } else {
      while (true) {
        const [promise, unsubscribe] = waitForMeasurement();
        try {
          viewportElement[scrollOffsetKey] = normalizeOffset(
            getTargetOffset(),
            isHorizontal,
          );
          store.$update(ACTION_MANUAL_SCROLL);
          await promise;
        } catch (e) {
          return;
        } finally {
          unsubscribe();
        }
      }
    }
  };
  return {
    $observe(viewport) {
      viewportElement = viewport;
      scrollObserver = createScrollObserver(
        store,
        viewport,
        isHorizontal,
        () => normalizeOffset(viewport[scrollOffsetKey], isHorizontal),
        (jump, shift, isMomentumScrolling) => {
          if (isMomentumScrolling) {
            const style = viewport.style;
            const prev = style[overflowKey];
            style[overflowKey] = "hidden";
            timeout(() => {
              style[overflowKey] = prev;
            });
          }
          if (shift) {
            viewport[scrollOffsetKey] = store.$getScrollOffset() + jump;
            cancelScroll && cancelScroll();
          } else {
            viewport[scrollOffsetKey] += jump;
          }
        },
      );
    },
    $dispose() {
      scrollObserver && scrollObserver._dispose();
    },
    $scrollTo(offset) {
      scheduleImperativeScroll(() => offset);
    },
    $scrollBy(offset) {
      offset += store.$getScrollOffset();
      scheduleImperativeScroll(() => offset);
    },
    $scrollToIndex(index, { align, smooth, offset = 0 } = {}) {
      index = clamp(index, 0, store.$getItemsLength() - 1);
      if (align === "nearest") {
        const itemOffset = store.$getItemOffset(index);
        const scrollOffset = store.$getScrollOffset();
        if (itemOffset < scrollOffset) {
          align = "start";
        } else if (
          itemOffset + store.$getItemSize(index) >
          scrollOffset + store.$getViewportSize()
        ) {
          align = "end";
        } else {
          return;
        }
      }
      scheduleImperativeScroll(() => {
        return (
          offset +
          store.$getStartSpacerSize() +
          store.$getItemOffset(index) +
          (align === "end"
            ? store.$getItemSize(index) - store.$getViewportSize()
            : align === "center"
              ? (store.$getItemSize(index) - store.$getViewportSize()) / 2
              : 0)
        );
      }, smooth);
    },
    $fixScrollJump: () => {
      scrollObserver && scrollObserver._fixScrollJump();
    },
  };
};

// node_modules/virtua/src/core/resizer.ts
var createResizeObserver = (cb) => {
  let ro;
  return {
    _observe(e) {
      (
        ro || // https://bugs.chromium.org/p/chromium/issues/detail?id=1491739
        (ro = new (getCurrentWindow(getCurrentDocument(e)).ResizeObserver)(cb))
      ).observe(e);
    },
    _unobserve(e) {
      ro.unobserve(e);
    },
    _dispose() {
      ro && ro.disconnect();
    },
  };
};
var createResizer = (store, isHorizontal) => {
  let viewportElement;
  const sizeKey = isHorizontal ? "width" : "height";
  const mountedIndexes = /* @__PURE__ */ new WeakMap();
  const resizeObserver = createResizeObserver((entries) => {
    const resizes = [];
    for (const { target, contentRect } of entries) {
      if (!target.offsetParent) continue;
      if (target === viewportElement) {
        store.$update(ACTION_VIEWPORT_RESIZE, contentRect[sizeKey]);
      } else {
        const index = mountedIndexes.get(target);
        if (index != NULL) {
          resizes.push([index, contentRect[sizeKey]]);
        }
      }
    }
    if (resizes.length) {
      store.$update(ACTION_ITEM_RESIZE, resizes);
    }
  });
  return {
    $observeRoot(viewport) {
      resizeObserver._observe((viewportElement = viewport));
    },
    $observeItem: (el, i) => {
      mountedIndexes.set(el, i);
      resizeObserver._observe(el);
      return () => {
        mountedIndexes.delete(el);
        resizeObserver._unobserve(el);
      };
    },
    $dispose: resizeObserver._dispose,
  };
};

// index.ts
function newChild(context, idx, top, newChildData) {
  const child = context.state.children[idx];
  if (child === void 0) {
    throw new Error(`Absurd: child is undefined at index ${idx}`);
  }
  const element = document.createElement(context.itemTag ?? "div");
  element.style.position = "absolute";
  element.style.visibility = "visible";
  element.style.top = top;
  element.style.width = "100%";
  element.style.left = "0";
  element.appendChild(child);
  newChildData.push({
    idx,
    hide: false,
    top,
    element,
    unobserve: context.resizer.$observeItem(element, idx),
  });
  return element;
}
function init({ children, as, itemSize, overscan, cache, item }) {
  const container = document.createElement(as ?? "div");
  container.style.overflowAnchor = "none";
  container.style.flex = "none";
  container.style.position = "relative";
  container.style.visibility = "hidden";
  container.style.width = "100%";
  container.dataset["testid"] = "container";
  for (const child of children) {
    container.appendChild(child);
  }
  const root = document.createElement("div");
  root.style.display = "block";
  root.style.overflowY = "auto";
  root.style.contain = "strict";
  root.style.width = "100%";
  root.style.height = "100%";
  root.dataset["testid"] = "virtualroot";
  root.appendChild(container);
  const store = createVirtualStore(
    children.length,
    itemSize,
    overscan,
    void 0,
    cache,
    !itemSize,
  );
  const resizer = createResizer(store, false);
  resizer.$observeRoot(root);
  const scroller = createScroller(store, false);
  scroller.$observe(root);
  const context = {
    container,
    store,
    resizer,
    scroller,
    itemTag: item,
    state: {
      childData: [],
      children,
    },
  };
  const unsubscribeStore = store.$subscribe(UPDATE_VIRTUAL_STATE, (_sync) => {
    render(context);
  });
  const dispose = () => {
    unsubscribeStore();
    resizer.$dispose();
    scroller.$dispose();
    for (const childData of context.state.childData) {
      childData.unobserve();
    }
  };
  return { context, dispose, root, container };
}
function render(context) {
  requestAnimationFrame(() => {
    _render(context);
  });
}
function _render(context) {
  const { store, scroller, state, container } = context;
  const newJumpCount = store.$getJumpCount();
  if (state.jumpCount !== newJumpCount) {
    scroller.$fixScrollJump();
    state.jumpCount = newJumpCount;
  }
  const newContainerHeight = `${store.$getTotalSize()}px`;
  if (state.containerHeight !== newContainerHeight) {
    container.style.height = newContainerHeight;
    state.containerHeight = newContainerHeight;
  }
  const [startIdx, endIdx] = store.$getRange();
  const newChildData = [];
  for (
    let newChildIdx = startIdx, j = endIdx;
    newChildIdx <= j;
    newChildIdx++
  ) {
    const oldChildDataMaybe = state.childData[0];
    const top = `${store.$getItemOffset(newChildIdx)}px`;
    if (oldChildDataMaybe === void 0) {
      const childEl = newChild(context, newChildIdx, top, newChildData);
      container.appendChild(childEl);
      state.childData.shift();
      continue;
    }
    let oldChildData = oldChildDataMaybe;
    while (newChildIdx > oldChildData.idx) {
      oldChildData.element.remove();
      oldChildData.unobserve();
      state.childData.shift();
      const nextOldChild = state.childData[0];
      if (nextOldChild === void 0) {
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
      const hide = store.$isUnmeasuredItem(newChildIdx);
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
    }
  }
  for (const oldChild of state.childData) {
    oldChild.element.remove();
    oldChild.unobserve();
  }
  state.childData = newChildData;
}

// vil.ts
function waitAnimationFrame() {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}
async function freezePageLoad(cache) {
  const root = document.body.querySelector("[data-infinite-root]");
  if (!(root instanceof HTMLElement)) {
    return;
  }
  const listId = root.dataset["infiniteRoot"];
  if (listId === void 0) {
    throw new Error("List ID not found");
  }
  const next = document.body.querySelector(`a[data-infinite-next="${listId}"]`);
  if (next === null) {
    throw new Error("Next not found");
  }
  const triggers = root.querySelectorAll(`[data-infinite-trigger="${listId}"]`);
  const vList = init({
    children: Array.from(root.children),
    cache: cache?.virtuaSnapshot,
  });
  await waitAnimationFrame();
  root.appendChild(vList.root);
  render(vList.context);
  if (cache?.scrollOffset) {
    await waitAnimationFrame();
    vList.context.scroller.$scrollTo(cache.scrollOffset);
  }
  return () => {
    console.log("unsub");
    const cache2 = vList.context.store.$getCacheSnapshot();
    const scrollOffset = vList.context.store.$getScrollOffset();
    for (const child of vList.context.state.children) {
      vList.root.appendChild(child);
    }
    vList.container.remove();
    const storage = { virtuaSnapshot: cache2, scrollOffset };
    sessionStorage.setItem(`cache-${listId}`, JSON.stringify(storage));
  };
}
export { freezePageLoad };
