var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) =>
      x.done
        ? resolve(x.value)
        : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// ../../../../../../nix/store/y62hv79n9fym1prhii8znq362fckmdjv-freeze.ts
function currentUrl() {
  return { pathname: location.pathname, search: location.search };
}
function getCache() {
  var _a;
  return JSON.parse(
    (_a = sessionStorage.getItem("freeze-cache")) != null ? _a : "[]",
  );
}
function getPageCache(url) {
  const pageCache = getCache();
  for (const item of pageCache) {
    if (item.cacheKey === url.pathname + url.search) {
      return item;
    }
  }
  return void 0;
}
function restorePage(url, cache) {
  return __async(this, null, function* () {
    if (cache !== void 0) {
      document.body.innerHTML = cache.bodyHtml;
      for (const name of document.body.getAttributeNames()) {
        document.body.removeAttribute(name);
      }
      for (const [name, value] of cache.bodyAttributes) {
        document.body.setAttribute(name, value);
      }
      document.head.innerHTML = cache.headHtml;
      window.setTimeout(() => window.scrollTo(0, cache.scroll), 0);
      history.pushState("freeze", "", url.pathname + url.search);
    }
    const pageLoads = Array.from(document.querySelectorAll("script"))
      .filter((script) => script.type === "module")
      .map((script) =>
        __async(this, null, function* () {
          const module = yield import(script.src);
          if (
            typeof module === "object" &&
            module !== null &&
            "freezePageLoad" in module &&
            typeof module.freezePageLoad === "function"
          ) {
            return yield module.freezePageLoad();
          }
          return void 0;
        }),
      );
    const pageLoadResults = yield Promise.allSettled(pageLoads);
    const unsubs = pageLoadResults
      .map((unsub) => {
        if (unsub.status === "fulfilled" && typeof unsub.value === "function") {
          return unsub.value;
        }
        return void 0;
      })
      .filter((unsub) => unsub !== void 0);
    const abortController = new AbortController();
    const shouldFreeze = document.body.hasAttribute("data-freeze");
    const anchors = document.body.querySelectorAll("a");
    for (const anchor of Array.from(anchors)) {
      anchor.addEventListener(
        "click",
        (e) =>
          __async(this, null, function* () {
            const urlRaw = new URL(anchor.href);
            const nextUrl = {
              pathname: urlRaw.pathname,
              search: urlRaw.search,
            };
            const nextCache = getPageCache(nextUrl);
            if (nextCache === void 0) {
              return;
            }
            e.preventDefault();
            if (shouldFreeze) {
              freezePage(url, abortController, unsubs);
            }
            yield restorePage(nextUrl, nextCache);
          }),
        { once: true },
      );
    }
    if (!shouldFreeze) {
      return;
    }
    window.addEventListener(
      "pagehide",
      () => freezePage(url, abortController, unsubs),
      {
        signal: abortController.signal,
      },
    );
    window.addEventListener(
      "popstate",
      (event) => {
        freezePage(url, abortController, unsubs);
        if (event.state !== "freeze") {
          window.location.reload();
          return;
        }
        const nextUrl = currentUrl();
        const nextPageCache = getPageCache(nextUrl);
        if (nextPageCache === void 0) {
          return;
        }
        restorePage(nextUrl, nextPageCache);
      },
      { signal: abortController.signal },
    );
  });
}
function freezePage(url, abortController, unsubs) {
  var _a;
  abortController.abort();
  for (const unsub of unsubs) {
    unsub();
  }
  const bodyAttributes = Array.from(document.body.attributes).map((attr) => [
    attr.name,
    attr.value,
  ]);
  const pageCache = getCache();
  const cacheKey = url.pathname + url.search;
  for (let i = 0; i < pageCache.length; i++) {
    if (((_a = pageCache[i]) == null ? void 0 : _a.cacheKey) === cacheKey) {
      pageCache.splice(i, 1);
      break;
    }
  }
  const newPage = {
    bodyHtml: document.body.innerHTML,
    headHtml: document.head.innerHTML,
    scroll: window.scrollY,
    bodyAttributes,
    cacheKey,
  };
  pageCache.push(newPage);
  while (pageCache.length > 0) {
    try {
      sessionStorage.setItem("freeze-cache", JSON.stringify(pageCache));
      break;
    } catch (e) {
      pageCache.shift();
    }
  }
}
window.addEventListener("pageshow", (event) => {
  const url = currentUrl();
  const perfNavigation = performance.getEntriesByType("navigation")[0];
  if (
    perfNavigation === void 0 ||
    !("type" in perfNavigation) ||
    typeof perfNavigation.type !== "string"
  ) {
    throw new Error(
      `Unknown performance entry: ${JSON.stringify(perfNavigation)}`,
    );
  }
  const shouldRestoreFromCache =
    (!event.persisted && perfNavigation.type === "back_forward") ||
    (event.persisted && perfNavigation.type === "navigate");
  if (!shouldRestoreFromCache) {
    restorePage(url);
    return;
  }
  const cache = getPageCache(url);
  restorePage(url, cache);
});
