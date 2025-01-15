type RelPath = { pathname: string; search: string };

type Page = {
  cacheKey: string;
  content: string;
  title: string;
  scroll: number;
  scripts: string[];
};

function currentLocation(): RelPath {
  return {
    pathname: location.pathname,
    search: location.search,
  };
}

function getPageCache(): Page[] {
  return JSON.parse(
    sessionStorage.getItem("aaaa-history-cache") ?? "[]",
  ) as Page[];
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
  const anchors = document.body.querySelectorAll<HTMLAnchorElement>("a");
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
            savePage(currentUrl);
          }
          restorePage(cached, url);
          return;
        }
      },
      { once: true },
    );
  }
}

type Unsub = () => void;

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
  history.pushState({ freeze: true }, "", url.pathname + url.search);

  initPage(url);
}

function shouldFreeze(): boolean {
  return document.body.hasAttribute("data-freeze");
}

function initPage(url: RelPath): void {
  bindAnchors(url);
  if (shouldFreeze()) {
    savePageOnNavigation(url);
  }
}

const subscribedScripts = new Set<string>();

function savePage(url: RelPath): void {
  for (const unsub of unsubscribeScripts) {
    unsub();
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
      sessionStorage.setItem("aaaa-history-cache", JSON.stringify(pageCache));
      break;
    } catch {
      pageCache.shift(); // shrink the cache and retry
    }
  }
}

let abortController = new AbortController();

async function savePageOnNavigation(url: RelPath): Promise<void> {
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

  await Promise.all(
    subscribedScripts.values().map((src): Promise<unknown> => import(src)),
  );

  window.dispatchEvent(new CustomEvent("freeze:page-loaded"));

  const inits = await Promise.all(
    subscribedScripts
      .values()
      .map((src): Promise<{ init: () => Unsub }> => import(src)),
  );

  for (const init of inits) {
    const unsub = init.init();
    unsubscribeScripts.add(unsub);
  }

  window.addEventListener(
    "beforeunload",
    () => {
      savePage(url);
    },
    { signal: abortController.signal },
  );

  window.addEventListener(
    "popstate",
    (event) => {
      if (event.state?.freeze) {
        const loc = currentLocation();
        const newCached = getCachedPage(loc);
        if (newCached) {
          savePage(url);
          restorePage(newCached, loc);
          return;
        }
      }
      location.reload();
    },
    { signal: abortController.signal },
  );
}

window.addEventListener("pageshow", () => {
  initPage(currentLocation());
});
