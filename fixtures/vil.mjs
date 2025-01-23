var P = (e, t, n) =>
  new Promise((o, s) => {
    var i = (r) => {
        try {
          a(n.next(r));
        } catch (l) {
          s(l);
        }
      },
      u = (r) => {
        try {
          a(n.throw(r));
        } catch (l) {
          s(l);
        }
      },
      a = (r) => (r.done ? o(r.value) : Promise.resolve(r.value).then(i, u));
    a((n = n.apply(e, t)).next());
  });
var { min: v, max: $, abs: te, floor: ge } = Math,
  J = (e, t, n) => v(n, $(t, e)),
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
  M = (e, t, n) => {
    let o = n ? "unshift" : "push";
    for (let s = 0; s < t; s++) e[o](x);
    return e;
  },
  N = (e, t) => {
    let n = e._sizes[t];
    return n === x ? e._defaultItemSize : n;
  },
  Ee = (e, t, n) => {
    let o = e._sizes[t] === x;
    return (e._sizes[t] = n), (e._computedOffsetIndex = v(t, e._computedOffsetIndex)), o;
  },
  D = (e, t) => {
    if (!e._length) return 0;
    if (e._computedOffsetIndex >= t) return e._offsets[t];
    e._computedOffsetIndex < 0 && ((e._offsets[0] = 0), (e._computedOffsetIndex = 0));
    let n = e._computedOffsetIndex,
      o = e._offsets[n];
    for (; n < t; ) (o += N(e, n)), (e._offsets[++n] = o);
    return (e._computedOffsetIndex = t), o;
  },
  ve = (e) => (e._length ? D(e, e._length - 1) + N(e, e._length - 1) : 0),
  R = (e, t, n = 0, o = e._length - 1) => {
    for (; n <= o; ) {
      let s = ge((n + o) / 2),
        i = D(e, s);
      if (i <= t) {
        if (i + N(e, s) > t) return s;
        n = s + 1;
      } else o = s - 1;
    }
    return J(n, 0, e._length - 1);
  },
  Ce = (e, t, n, o) => {
    if (((o = v(o, e._length - 1)), D(e, o) <= t)) {
      let s = R(e, t + n, o);
      return [R(e, t, o, s), s];
    } else {
      let s = R(e, t, void 0, o);
      return [s, R(e, t + n, s)];
    }
  },
  Le = (e, t) => {
    let n = 0,
      o = [];
    e._sizes.forEach((l, c) => {
      l !== x && (o.push(l), c < t && n++);
    }),
      (e._computedOffsetIndex = -1);
    let s = ye(o),
      i = s.length,
      u = (i / 2) | 0,
      a = i % 2 === 0 ? (s[u - 1] + s[u]) / 2 : s[u],
      r = e._defaultItemSize;
    return ((e._defaultItemSize = a) - r) * $(t - n, 0);
  },
  Oe = (e, t, n) => ({
    _defaultItemSize: n ? n[1] : t,
    _sizes: n && n[0] ? M(n[0].slice(0, v(e, n[0].length)), $(0, e - n[0].length)) : M([], e),
    _length: e,
    _computedOffsetIndex: -1,
    _offsets: M([], e),
  }),
  Re = (e) => [e._sizes.slice(), e._defaultItemSize],
  ne = (e, t, n) => {
    let o = t - e._length;
    return (
      (e._computedOffsetIndex = n ? -1 : v(t - 1, e._computedOffsetIndex)),
      (e._length = t),
      o > 0
        ? (M(e._offsets, o), M(e._sizes, o, n), e._defaultItemSize * o)
        : (e._offsets.splice(o),
          (n ? e._sizes.splice(0, -o) : e._sizes.splice(o)).reduce((s, i) => s - (i === x ? e._defaultItemSize : i), 0))
    );
  };
var Ue = typeof window != "undefined",
  xe = () => document.documentElement,
  re = (e) => e.ownerDocument,
  oe = (e) => e.defaultView,
  ze = F(() => (Ue ? getComputedStyle(xe()).direction === "rtl" : !1)),
  B = F(() => /iP(hone|od|ad)/.test(navigator.userAgent)),
  we = F(() => "scrollBehavior" in xe().style);
var w = 0,
  Ae = 1,
  Me = 2,
  G = 0,
  ke = 1,
  se = 2,
  Y = 1,
  ie = 2,
  le = 3,
  ue = 4,
  ce = 5,
  q = 6,
  ae = 7,
  me = 8,
  C = 1,
  K = 2,
  Ne = 4,
  De = 8;
var Ve = (e) => !!e.$getViewportSize(),
  de = (e, t = 40, n = 4, o = 0, s, i = !1) => {
    let u = !!o,
      a = [],
      r = 0,
      l = 0,
      c = 0,
      f = 0,
      m = 0,
      d = 0,
      b = 0,
      p = w,
      I = G,
      S = u ? [0, $(o - 1, 0)] : null,
      L = [0, 0],
      _e = 0,
      _ = Oe(e, t, s),
      X = new Set(),
      V = () => c - l,
      H = () => V() + d + m,
      Ie = (h) => Ce(_, h, r, L[0]),
      j = () => ve(_),
      Te = (h) => D(_, h) - d,
      W = (h) => N(_, h),
      Q = (h) => {
        h && (B() && p !== w ? (d += h) : ((m += h), f++));
      };
    return {
      $getStateVersion: () => a,
      $getCacheSnapshot: () => Re(_),
      $getRange: () => {
        if (b) return L;
        let [h, T] = Ie($(0, H()));
        return (
          S && ((h = v(h, S[0])), (T = $(T, S[1]))),
          p !== Ae && (h -= $(0, n)),
          p !== Me && (T += $(0, n)),
          (L = [$(h, 0), v(T, _._length - 1)])
        );
      },
      $findStartIndex: () => R(_, H()),
      $findEndIndex: () => R(_, H() + r),
      $isUnmeasuredItem: (h) => _._sizes[h] === x,
      _hasUnmeasuredItemsInFrozenRange: () =>
        S ? _._sizes.slice($(0, S[0] - 1), v(_._length - 1, S[1] + 1) + 1).includes(x) : !1,
      $getItemOffset: Te,
      $getItemSize: W,
      $getItemsLength: () => _._length,
      $getScrollOffset: () => c,
      $isScrolling: () => p !== w,
      $getViewportSize: () => r,
      $getStartSpacerSize: () => l,
      $getTotalSize: j,
      $getJumpCount: () => f,
      _flushJump: () => ((b = m), (m = 0), [b, I === se || V() + r >= j()]),
      $subscribe: (h, T) => {
        let A = [h, T];
        return (
          X.add(A),
          () => {
            X.delete(A);
          }
        );
      },
      $update: (h, T) => {
        let A,
          ee,
          E = 0;
        switch (h) {
          case Y: {
            let O = b;
            b = 0;
            let y = T - c,
              g = te(y);
            !(O && g < te(O) + 1) && I === G && (p = y < 0 ? Me : Ae), u && ((S = null), (u = !1)), (c = T), (E = Ne);
            let k = V();
            k >= -r && k <= j() && ((E += C), (ee = g > r));
            break;
          }
          case ie: {
            (E = De), p !== w && ((A = !0), (E += C)), (p = w), (I = G), (S = null);
            break;
          }
          case le: {
            let O = T.filter(([y, g]) => _._sizes[y] !== g);
            if (!O.length) break;
            Q(
              O.reduce(
                (y, [g, U]) => (
                  (I === se || (S ? !u && g < S[0] : Te(g) + (p === w && I === G ? W(g) : 0) < V())) && (y += U - W(g)),
                  y
                ),
                0,
              ),
            );
            for (let [y, g] of O) {
              let U = W(y),
                k = Ee(_, y, g);
              i && (_e += k ? g : g - U);
            }
            i && r && _e > r && (Q(Le(_, R(_, H()))), (i = !1)), (E = C + K), (ee = !0);
            break;
          }
          case ue: {
            r !== T && ((r = T), (E = C + K));
            break;
          }
          case ce: {
            T[1] ? (Q(ne(_, T[0], !0)), (I = se), (E = C)) : (ne(_, T[0]), (E = C));
            break;
          }
          case q: {
            l = T;
            break;
          }
          case ae: {
            I = ke;
            break;
          }
          case me: {
            (S = Ie(T)), (E = C);
            break;
          }
        }
        E &&
          ((a = []),
          A && d && ((m += d), (d = 0), f++),
          X.forEach(([O, y]) => {
            E & O && y(ee);
          }));
      },
    };
  };
var fe = setTimeout,
  Pe = (e, t) => {
    let n,
      o = () => {
        n != null && clearTimeout(n);
      },
      s = () => {
        o(),
          (n = fe(() => {
            (n = null), e();
          }, t));
      };
    return (s._cancel = o), s;
  },
  Z = (e, t) => (t && ze() ? -e : e),
  Je = (e, t, n, o, s, i) => {
    let u = Date.now,
      a = 0,
      r = !1,
      l = !1,
      c = !1,
      f = !1,
      m = Pe(() => {
        if (r || l) {
          (r = !1), m();
          return;
        }
        (c = !1), e.$update(ie);
      }, 150),
      d = () => {
        (a = u()), c && (f = !0), i && e.$update(q, i()), e.$update(Y, o()), m();
      },
      b = (S) => {
        if (r || !e.$isScrolling() || S.ctrlKey) return;
        let L = u() - a;
        150 > L && 50 < L && (n ? S.deltaX : S.deltaY) && (r = !0);
      },
      p = () => {
        (l = !0), (c = f = !1);
      },
      I = () => {
        (l = !1), B() && (c = !0);
      };
    return (
      t.addEventListener("scroll", d),
      t.addEventListener("wheel", b, { passive: !0 }),
      t.addEventListener("touchstart", p, { passive: !0 }),
      t.addEventListener("touchend", I, { passive: !0 }),
      {
        _dispose: () => {
          t.removeEventListener("scroll", d),
            t.removeEventListener("wheel", b),
            t.removeEventListener("touchstart", p),
            t.removeEventListener("touchend", I),
            m._cancel();
        },
        _fixScrollJump: () => {
          let [S, L] = e._flushJump();
          S && (s(Z(S, n), L, f), (f = !1), L && e.$getViewportSize() > e.$getTotalSize() && e.$update(Y, o()));
        },
      }
    );
  },
  pe = (e, t) => {
    let n,
      o,
      s,
      i = t ? "scrollLeft" : "scrollTop",
      u = t ? "overflowX" : "overflowY",
      a = (r, l) =>
        P(void 0, null, function* () {
          if (!n) {
            $e(() => a(r, l));
            return;
          }
          s && s();
          let c = () => {
            let f;
            return [
              new Promise((m, d) => {
                (f = m), (s = d), Ve(e) && fe(d, 150);
              }),
              e.$subscribe(K, () => {
                f && f();
              }),
            ];
          };
          if (l && we()) {
            for (; e.$update(me, r()), !!e._hasUnmeasuredItemsInFrozenRange(); ) {
              let [f, m] = c();
              try {
                yield f;
              } catch (d) {
                return;
              } finally {
                m();
              }
            }
            n.scrollTo({ [t ? "left" : "top"]: Z(r(), t), behavior: "smooth" });
          } else
            for (;;) {
              let [f, m] = c();
              try {
                (n[i] = Z(r(), t)), e.$update(ae), yield f;
              } catch (d) {
                return;
              } finally {
                m();
              }
            }
        });
    return {
      $observe(r) {
        (n = r),
          (o = Je(
            e,
            r,
            t,
            () => Z(r[i], t),
            (l, c, f) => {
              if (f) {
                let m = r.style,
                  d = m[u];
                (m[u] = "hidden"),
                  fe(() => {
                    m[u] = d;
                  });
              }
              c ? ((r[i] = e.$getScrollOffset() + l), s && s()) : (r[i] += l);
            },
          ));
      },
      $dispose() {
        o && o._dispose();
      },
      $scrollTo(r) {
        a(() => r);
      },
      $scrollBy(r) {
        (r += e.$getScrollOffset()), a(() => r);
      },
      $scrollToIndex(r, { align: l, smooth: c, offset: f = 0 } = {}) {
        if (((r = J(r, 0, e.$getItemsLength() - 1)), l === "nearest")) {
          let m = e.$getItemOffset(r),
            d = e.$getScrollOffset();
          if (m < d) l = "start";
          else if (m + e.$getItemSize(r) > d + e.$getViewportSize()) l = "end";
          else return;
        }
        a(
          () =>
            f +
            e.$getStartSpacerSize() +
            e.$getItemOffset(r) +
            (l === "end"
              ? e.$getItemSize(r) - e.$getViewportSize()
              : l === "center"
                ? (e.$getItemSize(r) - e.$getViewportSize()) / 2
                : 0),
          c,
        );
      },
      $fixScrollJump: () => {
        o && o._fixScrollJump();
      },
    };
  };
var Fe = (e) => {
    let t;
    return {
      _observe(n) {
        (t || (t = new (oe(re(n)).ResizeObserver)(e))).observe(n);
      },
      _unobserve(n) {
        t.unobserve(n);
      },
      _dispose() {
        t && t.disconnect();
      },
    };
  },
  be = (e, t) => {
    let n,
      o = t ? "width" : "height",
      s = new WeakMap(),
      i = Fe((u) => {
        let a = [];
        for (let { target: r, contentRect: l } of u)
          if (r.offsetParent)
            if (r === n) e.$update(ue, l[o]);
            else {
              let c = s.get(r);
              c != null && a.push([c, l[o]]);
            }
        a.length && e.$update(le, a);
      });
    return {
      $observeRoot(u) {
        i._observe((n = u));
      },
      $observeItem: (u, a) => (
        s.set(u, a),
        i._observe(u),
        () => {
          s.delete(u), i._unobserve(u);
        }
      ),
      $dispose: i._dispose,
    };
  };
function Se(e, t, n, o) {
  var u;
  let s = e.state.children[t];
  if (s === void 0) throw new Error(`Absurd: child is undefined at index ${t}`);
  let i = document.createElement((u = e.itemTag) != null ? u : "div");
  return (
    (i.style.position = "absolute"),
    (i.style.visibility = "visible"),
    (i.style.top = n),
    (i.style.width = "100%"),
    (i.style.left = "0"),
    i.appendChild(s),
    o.push({
      idx: t,
      hide: !1,
      top: n,
      element: i,
      unobserve: e.resizer.$observeItem(i, t),
    }),
    i
  );
}
function He({ root: e, as: t, itemSize: n, overscan: o, cache: s, item: i }) {
  let u = Array.from(e.children),
    a = document.createElement(t != null ? t : "div");
  (a.style.overflowAnchor = "none"),
    (a.style.flex = "none"),
    (a.style.position = "relative"),
    (a.style.visibility = "hidden"),
    (a.style.width = "100%");
  let r = document.createElement(e.tagName);
  (r.style.display = "block"),
    (r.style.overflowY = "auto"),
    (r.style.contain = "strict"),
    (r.style.width = "100%"),
    (r.style.height = "100%");
  for (let p of Array.from(e.attributes)) r.setAttribute(p.name, p.value);
  r.appendChild(a);
  let l = de(u.length, n, o, void 0, s, !n),
    c = be(l, !1);
  c.$observeRoot(r);
  let f = pe(l, !1);
  f.$observe(r);
  let m = {
      container: a,
      store: l,
      resizer: c,
      scroller: f,
      itemTag: i,
      state: { childData: [], children: u },
    },
    d = l.$subscribe(C, (p) => {
      he(m);
    });
  return {
    context: m,
    dispose: () => {
      d(), c.$dispose(), f.$dispose();
      for (let p of m.state.childData) p.unobserve();
    },
    root: r,
    container: a,
  };
}
function he(e) {
  requestAnimationFrame(() => {
    Be(e);
  });
}
function Be(e) {
  let { store: t, scroller: n, state: o, container: s } = e,
    i = t.$getJumpCount();
  o.jumpCount !== i && (n.$fixScrollJump(), (o.jumpCount = i));
  let u = `${t.$getTotalSize()}px`;
  o.containerHeight !== u && ((s.style.height = u), (o.containerHeight = u));
  let [a, r] = t.$getRange(),
    l = [];
  for (let c = a, f = r; c <= f; c++) {
    let m = o.childData[0],
      d = `${t.$getItemOffset(c)}px`;
    if (m === void 0) {
      let p = Se(e, c, d, l);
      s.appendChild(p), o.childData.shift();
      continue;
    }
    let b = m;
    for (; c > b.idx; ) {
      b.element.remove(), b.unobserve(), o.childData.shift();
      let p = o.childData[0];
      if (p === void 0) {
        let I = Se(e, c, d, l);
        s.appendChild(I), o.childData.shift();
        break;
      }
      b = p;
    }
    if (c < b.idx) {
      let p = Se(e, c, d, l);
      s.insertBefore(p, b.element);
      continue;
    }
    if (b.idx === c) {
      let p = b.hide,
        I = t.$isUnmeasuredItem(c);
      I !== p &&
        ((b.element.style.position = I ? "" : "absolute"),
        (b.element.style.visibility = I ? "hidden" : "visible"),
        (b.hide = I));
      let S = b.top;
      d !== S && ((b.element.style.top = d), (b.top = d)), l.push(b), o.childData.shift();
    }
  }
  for (let c of o.childData) c.element.remove(), c.unobserve();
  o.childData = l;
}
function We() {
  return new Promise((e) => requestAnimationFrame(() => e()));
}
function $t(e) {
  return P(this, null, function* () {
    let t = document.body.querySelector("[data-infinite-root]");
    if (!(t instanceof HTMLElement)) return;
    let n = t.dataset.infiniteRoot;
    if (n === void 0) throw new Error("List ID not found");
    if (document.body.querySelector(`a[data-infinite-next="${n}"]`) === null) throw new Error("Next not found");
    let s = t.querySelectorAll(`[data-infinite-trigger="${n}"]`),
      i = He({ root: t, cache: e == null ? void 0 : e.virtuaSnapshot });
    yield We(), he(i.context);
    for (let u of Array.from(t.attributes)) i.root.setAttribute(u.name, u.value);
    return (
      t.replaceWith(i.root),
      e != null && e.scrollOffset && (yield We(), i.context.scroller.$scrollTo(e.scrollOffset)),
      () => {
        console.log("unsub");
        let u = i.context.store.$getCacheSnapshot(),
          a = i.context.store.$getScrollOffset();
        for (let l of i.context.state.children) i.root.appendChild(l);
        i.container.remove();
        let r = { virtuaSnapshot: u, scrollOffset: a };
        sessionStorage.setItem(`cache-${n}`, JSON.stringify(r));
      }
    );
  });
}
export { $t as freezePageLoad };
