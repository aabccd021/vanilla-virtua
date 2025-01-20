var M = (e, t, n) =>
  new Promise((r, i) => {
    var s = (o) => {
        try {
          a(n.next(o));
        } catch (l) {
          i(l);
        }
      },
      c = (o) => {
        try {
          a(n.throw(o));
        } catch (l) {
          i(l);
        }
      },
      a = (o) => (o.done ? r(o.value) : Promise.resolve(o.value).then(s, c));
    a((n = n.apply(e, t)).next());
  });
var { min: g, max: $, abs: re, floor: Ee } = Math,
  J = (e, t, n) => g(n, $(t, e)),
  ye = (e) => [...e].sort((t, n) => t - n),
  $e =
    typeof queueMicrotask == "function"
      ? queueMicrotask
      : (e) => {
          Promise.resolve().then(e);
        },
  F = (e) => {
    let t, n;
    return () => (t || ((t = !0), (n = e())), n);
  };
var x = -1,
  N = (e, t, n) => {
    let r = n ? "unshift" : "push";
    for (let i = 0; i < t; i++) e[r](x);
    return e;
  },
  D = (e, t) => {
    let n = e._sizes[t];
    return n === x ? e._defaultItemSize : n;
  },
  ve = (e, t, n) => {
    let r = e._sizes[t] === x;
    return (
      (e._sizes[t] = n),
      (e._computedOffsetIndex = g(t, e._computedOffsetIndex)),
      r
    );
  },
  V = (e, t) => {
    if (!e._length) return 0;
    if (e._computedOffsetIndex >= t) return e._offsets[t];
    e._computedOffsetIndex < 0 &&
      ((e._offsets[0] = 0), (e._computedOffsetIndex = 0));
    let n = e._computedOffsetIndex,
      r = e._offsets[n];
    for (; n < t; ) (r += D(e, n)), (e._offsets[++n] = r);
    return (e._computedOffsetIndex = t), r;
  },
  ge = (e) => (e._length ? V(e, e._length - 1) + D(e, e._length - 1) : 0),
  R = (e, t, n = 0, r = e._length - 1) => {
    for (; n <= r; ) {
      let i = Ee((n + r) / 2),
        s = V(e, i);
      if (s <= t) {
        if (s + D(e, i) > t) return i;
        n = i + 1;
      } else r = i - 1;
    }
    return J(n, 0, e._length - 1);
  },
  Ce = (e, t, n, r) => {
    if (((r = g(r, e._length - 1)), V(e, r) <= t)) {
      let i = R(e, t + n, r);
      return [R(e, t, r, i), i];
    } else {
      let i = R(e, t, void 0, r);
      return [i, R(e, t + n, i)];
    }
  },
  Le = (e, t) => {
    let n = 0,
      r = [];
    e._sizes.forEach((l, u) => {
      l !== x && (r.push(l), u < t && n++);
    }),
      (e._computedOffsetIndex = -1);
    let i = ye(r),
      s = i.length,
      c = (s / 2) | 0,
      a = s % 2 === 0 ? (i[c - 1] + i[c]) / 2 : i[c],
      o = e._defaultItemSize;
    return ((e._defaultItemSize = a) - o) * $(t - n, 0);
  },
  Oe = (e, t, n) => ({
    _defaultItemSize: n ? n[1] : t,
    _sizes:
      n && n[0]
        ? N(n[0].slice(0, g(e, n[0].length)), $(0, e - n[0].length))
        : N([], e),
    _length: e,
    _computedOffsetIndex: -1,
    _offsets: N([], e),
  }),
  Re = (e) => [e._sizes.slice(), e._defaultItemSize],
  oe = (e, t, n) => {
    let r = t - e._length;
    return (
      (e._computedOffsetIndex = n ? -1 : g(t - 1, e._computedOffsetIndex)),
      (e._length = t),
      r > 0
        ? (N(e._offsets, r), N(e._sizes, r, n), e._defaultItemSize * r)
        : (e._offsets.splice(r),
          (n ? e._sizes.splice(0, -r) : e._sizes.splice(r)).reduce(
            (i, s) => i - (s === x ? e._defaultItemSize : s),
            0,
          ))
    );
  };
var Pe = typeof window != "undefined",
  xe = () => document.documentElement,
  se = (e) => e.ownerDocument,
  ie = (e) => e.defaultView,
  ze = F(() => (Pe ? getComputedStyle(xe()).direction === "rtl" : !1)),
  B = F(() => /iP(hone|od|ad)/.test(navigator.userAgent)),
  we = F(() => "scrollBehavior" in xe().style);
var w = 0,
  Ae = 1,
  Me = 2,
  G = 0,
  Je = 1,
  le = 2,
  Y = 1,
  ce = 2,
  ue = 3,
  ae = 4,
  q = 5,
  Z = 6,
  de = 7,
  me = 8,
  C = 1,
  K = 2,
  Ne = 4,
  De = 8;
var Ve = (e) => !!e.$getViewportSize(),
  fe = (e, t = 40, n = 4, r = 0, i, s = !1) => {
    let c = !!r,
      a = [],
      o = 0,
      l = 0,
      u = 0,
      f = 0,
      d = 0,
      m = 0,
      b = 0,
      p = w,
      I = G,
      S = c ? [0, $(r - 1, 0)] : null,
      L = [0, 0],
      _e = 0,
      _ = Oe(e, t, i),
      Q = new Set(),
      H = () => u - l,
      W = () => H() + m + d,
      Ie = (h) => Ce(_, h, o, L[0]),
      ee = () => ge(_),
      Te = (h) => V(_, h) - m,
      U = (h) => D(_, h),
      te = (h) => {
        h && (B() && p !== w ? (m += h) : ((d += h), f++));
      };
    return {
      $getStateVersion: () => a,
      $getCacheSnapshot: () => Re(_),
      $getRange: () => {
        if (b) return L;
        let [h, T] = Ie($(0, W()));
        return (
          S && ((h = g(h, S[0])), (T = $(T, S[1]))),
          p !== Ae && (h -= $(0, n)),
          p !== Me && (T += $(0, n)),
          (L = [$(h, 0), g(T, _._length - 1)])
        );
      },
      $findStartIndex: () => R(_, W()),
      $findEndIndex: () => R(_, W() + o),
      $isUnmeasuredItem: (h) => _._sizes[h] === x,
      _hasUnmeasuredItemsInFrozenRange: () =>
        S
          ? _._sizes
              .slice($(0, S[0] - 1), g(_._length - 1, S[1] + 1) + 1)
              .includes(x)
          : !1,
      $getItemOffset: Te,
      $getItemSize: U,
      $getItemsLength: () => _._length,
      $getScrollOffset: () => u,
      $isScrolling: () => p !== w,
      $getViewportSize: () => o,
      $getStartSpacerSize: () => l,
      $getTotalSize: ee,
      $getJumpCount: () => f,
      _flushJump: () => ((b = d), (d = 0), [b, I === le || H() + o >= ee()]),
      $subscribe: (h, T) => {
        let A = [h, T];
        return (
          Q.add(A),
          () => {
            Q.delete(A);
          }
        );
      },
      $update: (h, T) => {
        let A,
          ne,
          v = 0;
        switch (h) {
          case Y: {
            let O = b;
            b = 0;
            let y = T - u,
              E = re(y);
            !(O && E < re(O) + 1) && I === G && (p = y < 0 ? Me : Ae),
              c && ((S = null), (c = !1)),
              (u = T),
              (v = Ne);
            let P = H();
            P >= -o && P <= ee() && ((v += C), (ne = E > o));
            break;
          }
          case ce: {
            (v = De),
              p !== w && ((A = !0), (v += C)),
              (p = w),
              (I = G),
              (S = null);
            break;
          }
          case ue: {
            let O = T.filter(([y, E]) => _._sizes[y] !== E);
            if (!O.length) break;
            te(
              O.reduce(
                (y, [E, k]) => (
                  (I === le ||
                    (S
                      ? !c && E < S[0]
                      : Te(E) + (p === w && I === G ? U(E) : 0) < H())) &&
                    (y += k - U(E)),
                  y
                ),
                0,
              ),
            );
            for (let [y, E] of O) {
              let k = U(y),
                P = ve(_, y, E);
              s && (_e += P ? E : E - k);
            }
            s && o && _e > o && (te(Le(_, R(_, W()))), (s = !1)),
              (v = C + K),
              (ne = !0);
            break;
          }
          case ae: {
            o !== T && ((o = T), (v = C + K));
            break;
          }
          case q: {
            T[1]
              ? (te(oe(_, T[0], !0)), (I = le), (v = C))
              : (oe(_, T[0]), (v = C));
            break;
          }
          case Z: {
            l = T;
            break;
          }
          case de: {
            I = Je;
            break;
          }
          case me: {
            (S = Ie(T)), (v = C);
            break;
          }
        }
        v &&
          ((a = []),
          A && m && ((d += m), (m = 0), f++),
          Q.forEach(([O, y]) => {
            v & O && y(ne);
          }));
      },
    };
  };
var pe = setTimeout,
  Fe = (e, t) => {
    let n,
      r = () => {
        n != null && clearTimeout(n);
      },
      i = () => {
        r(),
          (n = pe(() => {
            (n = null), e();
          }, t));
      };
    return (i._cancel = r), i;
  },
  X = (e, t) => (t && ze() ? -e : e),
  Be = (e, t, n, r, i, s) => {
    let c = Date.now,
      a = 0,
      o = !1,
      l = !1,
      u = !1,
      f = !1,
      d = Fe(() => {
        if (o || l) {
          (o = !1), d();
          return;
        }
        (u = !1), e.$update(ce);
      }, 150),
      m = () => {
        (a = c()),
          u && (f = !0),
          s && e.$update(Z, s()),
          e.$update(Y, r()),
          d();
      },
      b = (S) => {
        if (o || !e.$isScrolling() || S.ctrlKey) return;
        let L = c() - a;
        150 > L && 50 < L && (n ? S.deltaX : S.deltaY) && (o = !0);
      },
      p = () => {
        (l = !0), (u = f = !1);
      },
      I = () => {
        (l = !1), B() && (u = !0);
      };
    return (
      t.addEventListener("scroll", m),
      t.addEventListener("wheel", b, { passive: !0 }),
      t.addEventListener("touchstart", p, { passive: !0 }),
      t.addEventListener("touchend", I, { passive: !0 }),
      {
        _dispose: () => {
          t.removeEventListener("scroll", m),
            t.removeEventListener("wheel", b),
            t.removeEventListener("touchstart", p),
            t.removeEventListener("touchend", I),
            d._cancel();
        },
        _fixScrollJump: () => {
          let [S, L] = e._flushJump();
          S &&
            (i(X(S, n), L, f),
            (f = !1),
            L && e.$getViewportSize() > e.$getTotalSize() && e.$update(Y, r()));
        },
      }
    );
  },
  be = (e, t) => {
    let n,
      r,
      i,
      s = t ? "scrollLeft" : "scrollTop",
      c = t ? "overflowX" : "overflowY",
      a = (o, l) =>
        M(void 0, null, function* () {
          if (!n) {
            $e(() => a(o, l));
            return;
          }
          i && i();
          let u = () => {
            let f;
            return [
              new Promise((d, m) => {
                (f = d), (i = m), Ve(e) && pe(m, 150);
              }),
              e.$subscribe(K, () => {
                f && f();
              }),
            ];
          };
          if (l && we()) {
            for (
              ;
              e.$update(me, o()), !!e._hasUnmeasuredItemsInFrozenRange();

            ) {
              let [f, d] = u();
              try {
                yield f;
              } catch (m) {
                return;
              } finally {
                d();
              }
            }
            n.scrollTo({ [t ? "left" : "top"]: X(o(), t), behavior: "smooth" });
          } else
            for (;;) {
              let [f, d] = u();
              try {
                (n[s] = X(o(), t)), e.$update(de), yield f;
              } catch (m) {
                return;
              } finally {
                d();
              }
            }
        });
    return {
      $observe(o) {
        (n = o),
          (r = Be(
            e,
            o,
            t,
            () => X(o[s], t),
            (l, u, f) => {
              if (f) {
                let d = o.style,
                  m = d[c];
                (d[c] = "hidden"),
                  pe(() => {
                    d[c] = m;
                  });
              }
              u ? ((o[s] = e.$getScrollOffset() + l), i && i()) : (o[s] += l);
            },
          ));
      },
      $dispose() {
        r && r._dispose();
      },
      $scrollTo(o) {
        a(() => o);
      },
      $scrollBy(o) {
        (o += e.$getScrollOffset()), a(() => o);
      },
      $scrollToIndex(o, { align: l, smooth: u, offset: f = 0 } = {}) {
        if (((o = J(o, 0, e.$getItemsLength() - 1)), l === "nearest")) {
          let d = e.$getItemOffset(o),
            m = e.$getScrollOffset();
          if (d < m) l = "start";
          else if (d + e.$getItemSize(o) > m + e.$getViewportSize()) l = "end";
          else return;
        }
        a(
          () =>
            f +
            e.$getStartSpacerSize() +
            e.$getItemOffset(o) +
            (l === "end"
              ? e.$getItemSize(o) - e.$getViewportSize()
              : l === "center"
                ? (e.$getItemSize(o) - e.$getViewportSize()) / 2
                : 0),
          u,
        );
      },
      $fixScrollJump: () => {
        r && r._fixScrollJump();
      },
    };
  };
var Ge = (e) => {
    let t;
    return {
      _observe(n) {
        (t || (t = new (ie(se(n)).ResizeObserver)(e))).observe(n);
      },
      _unobserve(n) {
        t.unobserve(n);
      },
      _dispose() {
        t && t.disconnect();
      },
    };
  },
  Se = (e, t) => {
    let n,
      r = t ? "width" : "height",
      i = new WeakMap(),
      s = Ge((c) => {
        let a = [];
        for (let { target: o, contentRect: l } of c)
          if (o.offsetParent)
            if (o === n) e.$update(ae, l[r]);
            else {
              let u = i.get(o);
              u != null && a.push([u, l[r]]);
            }
        a.length && e.$update(ue, a);
      });
    return {
      $observeRoot(c) {
        s._observe((n = c));
      },
      $observeItem: (c, a) => (
        i.set(c, a),
        s._observe(c),
        () => {
          i.delete(c), s._unobserve(c);
        }
      ),
      $dispose: s._dispose,
    };
  };
function He(e, t) {
  (e.state.children = e.state.children.concat(t)),
    e.store.$update(q, [e.state.children.length, !1]),
    j(e);
}
function he(e, t, n, r) {
  var c;
  let i = e.state.children[t];
  if (i === void 0) throw new Error(`Absurd: child is undefined at index ${t}`);
  let s = document.createElement((c = e.itemTag) != null ? c : "div");
  return (
    (s.style.position = "absolute"),
    (s.style.visibility = "visible"),
    (s.style.top = n),
    (s.style.width = "100%"),
    (s.style.left = "0"),
    s.appendChild(i),
    r.push({
      idx: t,
      hide: !1,
      top: n,
      element: s,
      unobserve: e.resizer.$observeItem(s, t),
    }),
    s
  );
}
function We({ root: e, as: t, itemSize: n, overscan: r, cache: i, item: s }) {
  let c = Array.from(e.children),
    a = document.createElement(t != null ? t : "div");
  (a.style.overflowAnchor = "none"),
    (a.style.flex = "none"),
    (a.style.position = "relative"),
    (a.style.visibility = "hidden"),
    (a.style.width = "100%");
  let o = document.createElement(e.tagName);
  (o.style.display = "block"),
    (o.style.overflowY = "auto"),
    (o.style.contain = "strict"),
    (o.style.width = "100%"),
    (o.style.height = "100%");
  for (let p of Array.from(e.attributes)) o.setAttribute(p.name, p.value);
  o.appendChild(a);
  let l = fe(c.length, n, r, void 0, i, !n),
    u = Se(l, !1);
  u.$observeRoot(o);
  let f = be(l, !1);
  f.$observe(o);
  let d = {
      container: a,
      store: l,
      resizer: u,
      scroller: f,
      itemTag: s,
      state: { childData: [], children: c },
    },
    m = l.$subscribe(C, (p) => {
      j(d);
    });
  return {
    context: d,
    dispose: () => {
      m(), u.$dispose(), f.$dispose();
      for (let p of d.state.childData) p.unobserve();
    },
    root: o,
    container: a,
  };
}
function j(e) {
  requestAnimationFrame(() => {
    Ke(e);
  });
}
function Ke(e) {
  let { store: t, scroller: n, state: r, container: i } = e,
    s = t.$getJumpCount();
  r.jumpCount !== s && (n.$fixScrollJump(), (r.jumpCount = s));
  let c = `${t.$getTotalSize()}px`;
  r.containerHeight !== c && ((i.style.height = c), (r.containerHeight = c));
  let [a, o] = t.$getRange(),
    l = [];
  for (let u = a, f = o; u <= f; u++) {
    let d = r.childData[0],
      m = `${t.$getItemOffset(u)}px`;
    if (d === void 0) {
      let p = he(e, u, m, l);
      i.appendChild(p), r.childData.shift();
      continue;
    }
    let b = d;
    for (; u > b.idx; ) {
      b.element.remove(), b.unobserve(), r.childData.shift();
      let p = r.childData[0];
      if (p === void 0) {
        let I = he(e, u, m, l);
        i.appendChild(I), r.childData.shift();
        break;
      }
      b = p;
    }
    if (u < b.idx) {
      let p = he(e, u, m, l);
      i.insertBefore(p, b.element);
      continue;
    }
    if (b.idx === u) {
      let p = b.hide,
        I = t.$isUnmeasuredItem(u);
      I !== p &&
        ((b.element.style.position = I ? "" : "absolute"),
        (b.element.style.visibility = I ? "hidden" : "visible"),
        (b.hide = I));
      let S = b.top;
      m !== S && ((b.element.style.top = m), (b.top = m)),
        l.push(b),
        r.childData.shift();
    }
  }
  for (let u of r.childData) u.element.remove(), u.unobserve();
  r.childData = l;
}
function ke(e, t, n, r) {
  let i = new IntersectionObserver((s) =>
    M(this, null, function* () {
      if (s.every((m) => !m.isIntersecting)) return;
      i.disconnect();
      let a = yield (yield fetch(n.href)).text(),
        o = new DOMParser().parseFromString(a, "text/html"),
        l = o.querySelector(`[data-infinite-root="${e}"]`);
      if (l === null) return;
      for (let m of Array.from(r)) m.removeAttribute("data-infinite-trigger");
      let u = l.querySelectorAll(`[data-infinite-trigger="${e}"]`),
        f = Array.from(l.children);
      window.dispatchEvent(
        new CustomEvent("infinite", { detail: { children: f } }),
      ),
        He(t, f);
      let d = o.querySelector(`a[data-infinite-next="${e}"]`);
      if (d === null) {
        n.remove();
        return;
      }
      n.replaceWith(d), ke(e, t, d, u);
    }),
  );
  for (let s of Array.from(r)) i.observe(s);
}
function Ue() {
  return new Promise((e) => requestAnimationFrame(() => e()));
}
function Ye(e) {
  return M(this, null, function* () {
    let t = document.body.querySelector("[data-infinite-root]");
    if (!(t instanceof HTMLElement)) return;
    let n = t.dataset.infiniteRoot;
    if (n === void 0) throw new Error("List ID not found");
    let r = document.body.querySelector(`a[data-infinite-next="${n}"]`);
    if (r === null) throw new Error("Next not found");
    let i = t.querySelectorAll(`[data-infinite-trigger="${n}"]`),
      s = We({ root: t, cache: e == null ? void 0 : e.virtuaSnapshot });
    yield Ue(), j(s.context);
    for (let c of Array.from(t.attributes))
      s.root.setAttribute(c.name, c.value);
    t.replaceWith(s.root),
      e != null &&
        e.scrollOffset &&
        (yield Ue(), s.context.scroller.$scrollTo(e.scrollOffset)),
      ke(n, s.context, r, i),
      window.dispatchEvent(
        new CustomEvent("infinite", {
          detail: { type: "newChildren", children: s.context.state.children },
        }),
      ),
      window.addEventListener("beforeunload", () => {
        let c = s.context.store.$getCacheSnapshot(),
          a = s.context.store.$getScrollOffset();
        for (let l of s.context.state.children) s.root.appendChild(l);
        s.container.remove();
        let o = { virtuaSnapshot: c, scrollOffset: a };
        sessionStorage.setItem(`cache-${n}`, JSON.stringify(o));
      });
  });
}
Ye();
export { Ye as initInfinite };
