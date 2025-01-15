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
          sessionStorage.setItem(`${counter()}-anchor`, currentUrl.pathname);
          console.log("anchor", currentUrl.pathname);
          savePage(currentUrl);
        }
        restorePage(cached, url);
      }
    });
  }
}

type Unsub = () => void;

const unsubscribeScripts = new Set<Unsub>();

async function restorePage(cached: Page, url: RelPath): Promise<void> {
  sessionStorage.setItem(`${counter()}-restorePage`, url.pathname);
  console.log("restorePage", url.pathname);
  document.body.outerHTML = cached.content;

  const titleElt = document.querySelector("title");
  if (titleElt) {
    titleElt.innerHTML = cached.title;
  } else {
    window.document.title = cached.title;
  }

  window.setTimeout(() => window.scrollTo(0, cached.scroll), 0);

  subscribedScripts.clear();
  console.log("subscribedScripts.clear", subscribedScripts);
  for (const script of cached.scripts) {
    console.log("subscribedScripts.add", script);
    subscribedScripts.add(script);
  }

  sessionStorage.setItem(`${counter()}-history.pushState`, url.pathname);
  console.log("history.pushState", url.pathname);
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
  sessionStorage.setItem(`${counter()}-initPage`, url.pathname);
  console.log("initPage", url.pathname);
  bindAnchors(url);
  if (shouldFreeze()) {
    savePageOnNavigation(url);
  }
}

const subscribedScripts = new Set<string>();

function savePage(url: RelPath): void {
  for (const unsub of unsubscribeScripts) {
    console.log("unsubscribing");
    unsub();
  }
  unsubscribeScripts.clear();

  sessionStorage.setItem(`${counter()}-savePage`, url.pathname);
  console.log("savePage", url.pathname);
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
      sessionStorage.setItem(`${counter()}-compacting`, url.pathname);
      console.log("compacting");
      pageCache.shift(); // shrink the cache and retry
    }
  }
}

let abortController = new AbortController();

async function savePageOnNavigation(url: RelPath): Promise<void> {
  abortController.abort();
  abortController = new AbortController();
  sessionStorage.setItem(`${counter()}-savePageOnNavigation`, url.pathname);
  console.log("savePageOnNavigation", url.pathname);

  window.addEventListener(
    "freeze:subscribe",
    (e: CustomEventInit<string>) => {
      if (e.detail) {
        subscribedScripts.add(e.detail);
        console.log("subscribedScripts.add", e.detail);
      }
    },
    { signal: abortController.signal },
  );

  console.log("initing scripts", url.pathname, subscribedScripts);
  await Promise.all(
    subscribedScripts
      .values()
      .map((src): Promise<{ init: () => Unsub }> => import(src)),
  );

  window.dispatchEvent(new CustomEvent("freeze:page-loaded"));

  const inits = await Promise.all(
    subscribedScripts
      .values()
      .map((src): Promise<{ init: () => Unsub }> => import(src)),
  );

  console.log("inits.length", inits.length);
  for (const init of inits) {
    console.log("init");
    const unsub = init.init();
    unsubscribeScripts.add(unsub);
  }
  console.log("restored scripts", url.pathname);

  window.addEventListener(
    "beforeunload",
    () => {
      sessionStorage.setItem(`${counter()}-beforeunload`, url.pathname);
      console.log("beforeunload", url.pathname);
      savePage(url);
    },
    {
      signal: abortController.signal,
    },
  );

  window.addEventListener(
    "popstate",
    (event) => {
      sessionStorage.setItem(`${counter()}-popstate`, url.pathname);
      console.log("popstate", url.pathname);
      if (event.state?.freeze) {
        const newCached = getCachedPage(location);
        if (newCached) {
          savePage(url);
          restorePage(newCached, location);
          return;
        }
      }
      window.location.reload();
    },
    { signal: abortController.signal },
  );
}

initPage(location);
