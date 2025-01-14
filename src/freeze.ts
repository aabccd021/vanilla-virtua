type RelPath = { pathname: string; search: string };

const _counter = 0;

type Page = {
  cacheKey: string;
  content: string;
  title: string;
  scroll: number;
  scripts: string[];
};

function getPageCache(): Page[] {
  return JSON.parse(
    sessionStorage.getItem("htmx-history-cache") ?? "[]",
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

function bindAnchors(): void {
  const anchors = document.body.querySelectorAll("a");
  for (const anchor of anchors) {
    anchor.addEventListener("click", (event) => {
      const url = new URL(anchor.href);
      const cached = getCachedPage(url);
      if (cached) {
        event.preventDefault();
        if (shouldFreeze()) {
          savePage(location);
        }
        restorePage(cached, url);
      }
    });
  }
}

async function restorePage(cached: Page, url: RelPath): Promise<void> {
  document.body.outerHTML = cached.content;

  const titleElt = document.querySelector("title");
  if (titleElt) {
    titleElt.innerHTML = cached.title;
  } else {
    window.document.title = cached.title;
  }

  window.setTimeout(() => window.scrollTo(0, cached.scroll), 0);
  await Promise.all(cached.scripts.map((src) => import(src)));
  history.pushState({ freeze: true }, "", url.pathname + url.search);

  initPage();
}

function shouldFreeze(): boolean {
  return document.body.hasAttribute("data-freeze");
}

function initPage(): void {
  bindAnchors();
  if (shouldFreeze()) {
    savePageOnNavigation();
  }
}

const subscribedScripts = new Set<string>();

function savePage(url: RelPath): void {
  const content = document.body.outerHTML;
  const title = document.title;

  const scripts = Array.from(subscribedScripts);
  subscribedScripts.clear();

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
      sessionStorage.setItem("htmx-history-cache", JSON.stringify(pageCache));
      break;
    } catch {
      pageCache.shift(); // shrink the cache and retry
    }
  }
  abortController.abort();
  abortController = new AbortController();
}

let abortController = new AbortController();

function savePageOnNavigation(): void {
  window.addEventListener(
    "freeze:subscribe",
    (e: CustomEventInit<string>) => {
      if (e.detail) {
        subscribedScripts.add(e.detail);
      }
    },
    { signal: abortController.signal },
  );

  window.dispatchEvent(new CustomEvent("freeze:page-loaded"));

  const url = location;

  window.addEventListener("beforeunload", () => savePage(url), {
    signal: abortController.signal,
  });

  const originalPopstate = window.onpopstate
    ? window.onpopstate.bind(window)
    : null;

  window.addEventListener(
    "popstate",
    (event) => {
      savePage(url);
      if (event.state?.freeze) {
        const newCached = getCachedPage(location);
        if (newCached) {
          restorePage(newCached, location);
          return;
        }
        location.reload();
      } else if (originalPopstate) {
        originalPopstate(event);
      } else {
        location.reload();
      }
    },
    { signal: abortController.signal },
  );
}

initPage();
