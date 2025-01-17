import type { InfiniteEvent } from "./event.ts";

function onInfiniteEvent(e: CustomEventInit<InfiniteEvent>): void {
  if (e.detail === undefined) {
    return;
  }
  if (e.detail.type === "unsubscribe") {
    window.removeEventListener("infinite", onInfiniteEvent);
    return;
  }
  for (const el of e.detail.children) {
    el.addEventListener("click", () => {});
  }
}

window.addEventListener("infinite", onInfiniteEvent);
