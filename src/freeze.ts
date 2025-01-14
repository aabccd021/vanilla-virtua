const newLocal = /^\/$/;
const normalizePathRegex = /\/+$/;

function normalizePath(path: string): string {
  const url = new URL(path);
  const normalizedpath = url.pathname + url.search;
  // remove trailing slash, unless index page
  if (!newLocal.test(path)) {
    return normalizedpath.replace(normalizePathRegex, "");
  }
  return normalizedpath;
}

type HistoryItem = {
  url: string;
  content: string;
  title: string;
  scroll: number;
  scripts: string[];
};

function getHistoryCache(): HistoryItem[] {
  return JSON.parse(
    localStorage.getItem("htmx-history-cache") ?? "[]",
  ) as HistoryItem[];
}

function getCachedHistory(cacheKey: string): HistoryItem | null {
  const historyCache = getHistoryCache();

  for (const item of historyCache) {
    if (item.url === cacheKey) {
      return item;
    }
  }

  return null;
}

function handleTitle(title: string): void {
  if (title) {
    const titleElt = document.querySelector("title");
    if (titleElt) {
      titleElt.innerHTML = title;
    } else {
      window.document.title = title;
    }
  }
}

function beforeUnload(subscribedScripts: Set<string>, cacheKey: string): void {
  const content = document.body.innerHTML;
  const title = document.title;

  const scripts = Array.from(subscribedScripts);

  const historyCache = getHistoryCache();
  for (let i = 0; i < historyCache.length; i++) {
    if (historyCache[i]?.url === cacheKey) {
      historyCache.splice(i, 1);
      break;
    }
  }

  const newHistoryItem: HistoryItem = {
    content,
    title,
    scripts,
    url: cacheKey,
    scroll: window.scrollY,
  };

  historyCache.push(newHistoryItem);

  // keep trying to save the cache until it succeeds or is empty
  while (historyCache.length > 0) {
    try {
      localStorage.setItem("htmx-history-cache", JSON.stringify(historyCache));
      break;
    } catch {
      historyCache.shift(); // shrink the cache and retry
    }
  }
}

let abortController = new AbortController();

async function restorePage(
  cached: HistoryItem,
  anchor: HTMLAnchorElement,
  cacheKey: string,
): Promise<void> {
  abortController.abort();
  abortController = new AbortController();

  document.body.innerHTML = cached.content;
  handleTitle(cached.title);
  window.setTimeout(() => window.scrollTo(0, cached.scroll), 0);

  const subscribedScripts = new Set<string>();

  window.addEventListener(
    "infsub",
    (e: CustomEventInit<string>) => {
      if (e.detail !== undefined) {
        subscribedScripts.add(e.detail);
      }
    },
    { signal: abortController.signal },
  );

  await Promise.all(cached.scripts.map((src) => import(src)));

  bindAnchors();

  history.replaceState({ freeze: true }, "", anchor.href);

  window.addEventListener(
    "beforeunload",
    () => beforeUnload(subscribedScripts, cacheKey),
    { signal: abortController.signal },
  );

  const originalPopstate = window.onpopstate
    ? window.onpopstate.bind(window)
    : null;

  window.addEventListener("popstate", (event) => {
    const path = location.pathname + location.search;
    if (event.state?.freeze) {
      const newCacheKey = normalizePath(path);
      const newCached = getCachedHistory(newCacheKey);
      if (newCached === null) {
        window.location.reload();
        return;
      }
      restorePage(newCached, anchor, newCacheKey);
    } else if (originalPopstate) {
      originalPopstate(event);
    }
  });
}

function bindAnchors(): void {
  const anchors = document.body.querySelectorAll<HTMLAnchorElement>(
    "a[data-freeze-link]",
  );

  for (const anchor of anchors) {
    anchor.addEventListener("click", (clickEvent) => {
      const cacheKey = normalizePath(anchor.href);
      const cached = getCachedHistory(cacheKey);
      if (cached === null) {
        return;
      }

      clickEvent.preventDefault();
      restorePage(cached, anchor, cacheKey);
    });
  }
}

bindAnchors();

const shouldFreeze = document.body.hasAttribute("data-freeze");
if (shouldFreeze) {
  const subscribedScripts = new Set<string>();

  window.addEventListener("infsub", (e: CustomEventInit<string>) => {
    if (e.detail !== undefined) {
      subscribedScripts.add(e.detail);
    }
  });

  window.addEventListener("beforeunload", () => {
    beforeUnload(subscribedScripts, normalizePath(location.pathname));
  });
}
