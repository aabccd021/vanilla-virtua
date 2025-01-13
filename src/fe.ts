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
    el.addEventListener("click", () => {
      console.warn("fe");
    });
  }
}

window.addEventListener("infinite", onInfiniteEvent);

window.dispatchEvent(
  new CustomEvent<string>("infsub", { detail: import.meta.url }),
);

console.log("fe done");
