const f = (t, a, n) =>
  new Promise((d, o) => {
    const s = (e) => {
      try {
        i(n.next(e));
      } catch (r) {
        o(r);
      }
    };
    const c = (e) => {
      try {
        i(n.throw(e));
      } catch (r) {
        o(r);
      }
    };
    const i = (e) =>
      e.done ? d(e.value) : Promise.resolve(e.value).then(s, c);
    i((n = n.apply(t, a)).next());
  });
function y() {
  return { pathname: location.pathname, search: location.search };
}
function b() {
  let t;
  return JSON.parse(
    (t = sessionStorage.getItem("freeze-cache")) != null ? t : "[]",
  );
}
function m(t) {
  const a = b();
  for (const n of a) {
    if (n.cacheKey === t.pathname + t.search) {
      return n;
    }
  }
}
function l(t, a) {
  return f(this, null, function* () {
    if (a !== void 0) {
      document.body.innerHTML = a.bodyHtml;
      for (const e of document.body.getAttributeNames()) {
        document.body.removeAttribute(e);
      }
      for (const [e, r] of a.bodyAttributes) {
        document.body.setAttribute(e, r);
      }
      (document.head.innerHTML = a.headHtml),
        window.setTimeout(() => window.scrollTo(0, a.scroll), 0),
        history.pushState("freeze", "", t.pathname + t.search);
    }
    const n = Array.from(document.querySelectorAll("script"))
      .filter((e) => e.type === "module")
      .map((e) =>
        f(this, null, function* () {
          const r = yield import(e.src);
          if (
            typeof r === "object" &&
            r !== null &&
            "freezePageLoad" in r &&
            typeof r.freezePageLoad === "function"
          ) {
            return yield r.freezePageLoad();
          }
        }),
      );
    const o = (yield Promise.allSettled(n))
      .map((e) => {
        if (e.status === "fulfilled" && typeof e.value === "function") {
          return e.value;
        }
      })
      .filter((e) => e !== void 0);
    const s = new AbortController();
    const c = document.body.hasAttribute("data-freeze");
    const i = document.body.querySelectorAll("a");
    for (const e of Array.from(i)) {
      e.addEventListener(
        "click",
        (r) =>
          f(this, null, function* () {
            const u = new URL(e.href);
            const g = { pathname: u.pathname, search: u.search };
            const p = m(g);
            p !== void 0 &&
              (r.preventDefault(), c && h(t, s, o), yield l(g, p));
          }),
        { once: !0 },
      );
    }
    c &&
      (window.addEventListener("pagehide", () => h(t, s, o), {
        signal: s.signal,
      }),
      window.addEventListener(
        "popstate",
        (e) => {
          if ((h(t, s, o), e.state !== "freeze")) {
            window.location.reload();
            return;
          }
          const r = y();
          const u = m(r);
          u !== void 0 && l(r, u);
        },
        { signal: s.signal },
      ));
  });
}
function h(t, a, n) {
  let i;
  a.abort();
  for (const e of n) {
    e();
  }
  const d = Array.from(document.body.attributes).map((e) => [e.name, e.value]);
  const o = b();
  const s = t.pathname + t.search;
  for (let e = 0; e < o.length; e++) {
    if (((i = o[e]) == null ? void 0 : i.cacheKey) === s) {
      o.splice(e, 1);
      break;
    }
  }
  const c = {
    bodyHtml: document.body.innerHTML,
    headHtml: document.head.innerHTML,
    scroll: window.scrollY,
    bodyAttributes: d,
    cacheKey: s,
  };
  for (o.push(c); o.length > 0; ) {
    try {
      sessionStorage.setItem("freeze-cache", JSON.stringify(o));
      break;
    } catch (_e) {
      o.shift();
    }
  }
}
window.addEventListener("pageshow", (t) => {
  const a = y();
  const n = performance.getEntriesByType("navigation")[0];
  if (n === void 0 || !("type" in n) || typeof n.type !== "string") {
    throw new Error(`Unknown performance entry: ${JSON.stringify(n)}`);
  }
  if (
    !(
      (!t.persisted && n.type === "back_forward") ||
      (t.persisted && n.type === "navigate")
    )
  ) {
    l(a);
    return;
  }
  const o = m(a);
  l(a, o);
});
