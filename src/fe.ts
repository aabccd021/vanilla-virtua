import type { InfiniteEvent } from "./event.ts";

console.log("fe");

function onInfiniteEvent(e: CustomEventInit<InfiniteEvent>): void {
  console.log("fe event");
  if (e.detail === undefined) {
    return;
  }
  if (e.detail.type === "unsubscribe") {
    window.removeEventListener("infinite", onInfiniteEvent);
    return;
  }
  for (const el of e.detail.children) {
    el.addEventListener("click", () => {
      console.warn("fe");
    });
  }
}

window.addEventListener("infinite", onInfiniteEvent);
