console.log("4");

type RelPath = { pathname: string; search: string };

function counter(): number {
  const c = Number(sessionStorage.getItem("counter")) ?? 0;
  sessionStorage.setItem("counter", String(c + 1));
  return c;
}

type Page = {
  cacheKey: string;
  content: string;
  title: string;
  scroll: number;
  scripts: string[];
};

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
  const anchors = document.body.querySelectorAll("a");
  for (const anchor of anchors) {
    anchor.addEventListener("click", (event) => {
      const url = new URL(anchor.href);
      const cached = getCachedPage(url);
      if (cached) {
        event.preventDefault();
        if (shouldFreeze()) {
          sessionStorage.setItem(`anchor-${counter()}`, currentUrl.pathname);
          savePage(currentUrl);
        }
        restorePage(cached, url);
      }
    });
  }
}

async function restorePage(cached: Page, url: RelPath): Promise<void> {
  sessionStorage.setItem(`restorePage-${counter()}`, url.pathname);
  document.body.outerHTML = cached.content;

  const titleElt = document.querySelector("title");
  if (titleElt) {
    titleElt.innerHTML = cached.title;
  } else {
    window.document.title = cached.title;
  }

  window.setTimeout(() => window.scrollTo(0, cached.scroll), 0);
  await Promise.all(cached.scripts.map((src) => import(src)));

  subscribedScripts.clear();
  for (const script of cached.scripts) {
    subscribedScripts.add(script);
  }

  sessionStorage.setItem(`history.pushState-${counter()}`, url.pathname);
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
  sessionStorage.setItem(`initPage-${counter()}`, url.pathname);
  bindAnchors(url);
  if (shouldFreeze()) {
    savePageOnNavigation(url);
  }
}

const subscribedScripts = new Set<string>();

function savePage(url: RelPath): void {
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

function savePageOnNavigation(url: RelPath): void {
  abortController.abort();
  abortController = new AbortController();
  sessionStorage.setItem(`savePageOnNavigation-${counter()}`, url.pathname);

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

  window.addEventListener(
    "beforeunload",
    () => {
      sessionStorage.setItem(`beforeunload-${counter()}`, url.pathname);
      savePage(url);
    },
    {
      signal: abortController.signal,
    },
  );

  const originalPopstate = window.onpopstate
    ? window.onpopstate.bind(window)
    : null;

  window.addEventListener(
    "popstate",
    (event) => {
      sessionStorage.setItem(`popstate-${counter()}`, url.pathname);
      savePage(url);
      if (event.state?.freeze) {
        const newCached = getCachedPage(location);
        if (newCached) {
          restorePage(newCached, location);
          return;
        }
        window.location.reload();
      } else if (originalPopstate) {
        originalPopstate(event);
      } else {
        window.location.reload();
      }
    },
    { signal: abortController.signal },
  );
}

initPage(location);
