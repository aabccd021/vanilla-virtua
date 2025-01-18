type RelPath = { pathname: string; search: string };

type Page = {
  cacheKey: string;
  content: string;
  title: string;
  scroll: number;
  scripts: string[];
};

// dereference location and make it immutable
function currentUrl(): RelPath {
  return {
    pathname: location.pathname,
    search: location.search,
  };
}

function getPageCache(): Page[] {
  return JSON.parse(sessionStorage.getItem("freeze-cache") ?? "[]") as Page[];
}

function getCachedPage(url: RelPath): Page | null {
  const pageCache = getPageCache();

  for (const item of pageCache) {
    if (item.cacheKey === url.pathname + url.search) {
      return item;
    }
  }

  return null;
}

function bindAnchors(currentUrl: RelPath): void {
  const anchors = document.body.querySelectorAll("a");
  for (const anchor of Array.from(anchors)) {
    anchor.addEventListener(
      "click",
      (event) => {
        const urlRaw = new URL(anchor.href);
        const url = { pathname: urlRaw.pathname, search: urlRaw.search };
        const cached = getCachedPage(url);
        if (cached) {
          event.preventDefault();
          if (shouldFreeze()) {
            freezePage(currentUrl);
          }
          restorePage(cached, url);
          return;
        }
      },
      { once: true },
    );
  }
}

type Unsub = (() => void) | undefined;

const unsubscribeScripts = new Set<Unsub>();

async function restorePage(cached: Page, url: RelPath): Promise<void> {
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

function shouldFreeze(): boolean {
  return document.body.hasAttribute("data-freeze");
}

async function initPage(url: RelPath): Promise<void> {
  bindAnchors(url);
  if (shouldFreeze()) {
    await freezeOnNavigateOrPopstate(url);
  }
}

const subscribedScripts = new Set<string>();

function freezePage(url: RelPath): void {
  for (const unsub of Array.from(unsubscribeScripts)) {
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

  const newPage: Page = {
    content,
    title,
    scripts,
    cacheKey,
    scroll: window.scrollY,
  };

  pageCache.push(newPage);

  // keep trying to save the cache until it succeeds or is empty
  while (pageCache.length > 0) {
    try {
      sessionStorage.setItem("freeze-cache", JSON.stringify(pageCache));
      break;
    } catch {
      pageCache.shift(); // shrink the cache and retry
    }
  }
}

let abortController = new AbortController();

async function freezeOnNavigateOrPopstate(url: RelPath): Promise<void> {
  abortController.abort();
  abortController = new AbortController();

  window.addEventListener(
    "freeze:subscribe",
    (e: CustomEventInit<string>) => {
      if (e.detail) {
        subscribedScripts.add(e.detail);
      }
    },
    { signal: abortController.signal },
  );

  // trigger `window.addEventListener("freeze:page-loaded")`
  await Promise.all(
    Array.from(subscribedScripts.values()).map(
      (src): Promise<unknown> => import(src),
    ),
  );

  window.dispatchEvent(new CustomEvent("freeze:page-loaded"));

  const inits = await Promise.all(
    Array.from(subscribedScripts.values()).map(
      (src): Promise<{ init: () => Unsub }> => import(src),
    ),
  );

  for (const init of inits) {
    const unsub = init.init();
    unsubscribeScripts.add(unsub);
  }

  window.addEventListener(
    "pagehide",
    (_event) => {
      // console.log("pagehide", event.persisted, url.pathname);
      freezePage(url);
    },
    {
      signal: abortController.signal,
    },
  );

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

function log(..._messages: unknown[]): void {
  const _epochLastDigits = Date.now().toString().slice(-5);
}

log("freeze.ts");

window.addEventListener("pageshow", (event) => {
  const url = currentUrl();
  log("pageshow", event.persisted, url.pathname);
  const navType = performance.getEntriesByType("navigation")[0]?.type;
  log(navType);
  if (navType === "back_forward") {
    const cached = getCachedPage(url);
    if (cached) {
      restorePage(cached, url);
      return;
    }
  }
  initPage(url);
});
