// src/freeze.ts
function currentUrl() {
  return {
    pathname: location.pathname,
    search: location.search,
  };
}
function getPageCache() {
  return JSON.parse(sessionStorage.getItem("freeze-cache") ?? "[]");
}
function getCachedPage(url) {
  const pageCache = getPageCache();
  for (const item of pageCache) {
    if (item.cacheKey === url.pathname + url.search) {
      return item;
    }
  }
  return null;
}
function bindAnchors(currentUrl2) {
  const anchors = document.body.querySelectorAll("a");
  for (const anchor of anchors) {
    anchor.addEventListener(
      "click",
      (event) => {
        const urlRaw = new URL(anchor.href);
        const url = { pathname: urlRaw.pathname, search: urlRaw.search };
        const cached = getCachedPage(url);
        if (cached) {
          event.preventDefault();
          if (shouldFreeze()) {
            freezePage(currentUrl2);
          }
          restorePage(cached, url);
          return;
        }
      },
      { once: true },
    );
  }
}
const unsubscribeScripts = new Set();
async function restorePage(cached, url) {
  document.body.outerHTML = cached.content;
  const titleElt = document.querySelector("title");
  if (titleElt) {
    titleElt.innerHTML = cached.title;
  } else {
    window.document.title = cached.title;
  }
  window.setTimeout(() => window.scrollTo(0, cached.scroll), 0);
  subscribedScripts.clear();
  for (const script of cached.scripts) {
    subscribedScripts.add(script);
  }
  if (url.pathname === "/") {
    throw new Error("no");
  }
  await initPage(url);
  history.pushState({ freeze: true }, "", url.pathname + url.search);
}
function shouldFreeze() {
  return document.body.hasAttribute("data-freeze");
}
async function initPage(url) {
  bindAnchors(url);
  if (shouldFreeze()) {
    await freezeOnNavigateOrPopstate(url);
  }
}
const subscribedScripts = new Set();
function freezePage(url) {
  for (const unsub of unsubscribeScripts) {
    unsub?.();
  }
  unsubscribeScripts.clear();
  const content = document.body.outerHTML;
  const title = document.title;
  const scripts = Array.from(subscribedScripts);
  const pageCache = getPageCache();
  const cacheKey = url.pathname + url.search;
  for (let i = 0; i < pageCache.length; i++) {
    if (pageCache[i]?.cacheKey === cacheKey) {
      pageCache.splice(i, 1);
      break;
    }
  }
  const newPage = {
    content,
    title,
    scripts,
    cacheKey,
    scroll: window.scrollY,
  };
  pageCache.push(newPage);
  while (pageCache.length > 0) {
    try {
      sessionStorage.setItem("freeze-cache", JSON.stringify(pageCache));
      break;
    } catch {
      pageCache.shift();
    }
  }
}
let abortController = new AbortController();
async function freezeOnNavigateOrPopstate(url) {
  abortController.abort();
  abortController = new AbortController();
  window.addEventListener(
    "freeze:subscribe",
    (e) => {
      if (e.detail) {
        subscribedScripts.add(e.detail);
      }
    },
    { signal: abortController.signal },
  );
  await Promise.all(subscribedScripts.values().map((src) => import(src)));
  window.dispatchEvent(new CustomEvent("freeze:page-loaded"));
  const inits = await Promise.all(
    subscribedScripts.values().map((src) => import(src)),
  );
  for (const init of inits) {
    const unsub = init.init();
    unsubscribeScripts.add(unsub);
  }
  window.addEventListener("beforeunload", () => freezePage(url), {
    signal: abortController.signal,
  });
  window.addEventListener(
    "popstate",
    (event) => {
      if (event.state?.freeze) {
        const newUrl = currentUrl();
        const newCached = getCachedPage(newUrl);
        if (newCached) {
          freezePage(url);
          restorePage(newCached, newUrl);
          return;
        }
      }
      window.location.reload();
    },
    { signal: abortController.signal },
  );
}
window.addEventListener("pageshow", () => {
  initPage(currentUrl());
});
