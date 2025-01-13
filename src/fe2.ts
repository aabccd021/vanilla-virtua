import type { InfiniteEvent } from "./event.ts";

console.log("fe2");

function onInfiniteEvent(e: CustomEventInit<InfiniteEvent>): void {
  console.log("fe2 event");
  if (e.detail === undefined) {
    return;
  }
  if (e.detail.type === "unsubscribe") {
    window.removeEventListener("infinite", onInfiniteEvent);
    return;
  }
  for (const el of e.detail.children) {
    el.addEventListener("click", () => {
      console.warn("fe2");
    });
  }
}

window.addEventListener("infinite", onInfiniteEvent);
