import type { InfiniteEvent } from "./event.ts";

function onInfiniteEvent(event: CustomEventInit<InfiniteEvent>): void {
  if (event.detail?.type === "unsubscribe") {
    window.removeEventListener("infinite", onInfiniteEvent);
    return;
  }
  if (event.detail?.type === "newChildren") {
    for (const newChild of event.detail.children) {
      newChild.addEventListener("click", () => {});
    }
    return;
  }
}

window.addEventListener("infinite", onInfiniteEvent);

window.dispatchEvent(
  new CustomEvent<string>("infsub", { detail: import.meta.url }),
);
