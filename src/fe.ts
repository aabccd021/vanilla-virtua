function addListener(el: Element): void {
  el.addEventListener("click", () => {
    console.log("Hello from click");
  });
}

const els = document.body.querySelectorAll("[data-click-hello]");

for (const el of els) {
  addListener(el);
}

document.addEventListener(
  "infinite-new-children",
  (e: CustomEventInit<{ children: Element[] }>) => {
    if (e.detail === undefined) {
      return;
    }
    for (const el of e.detail.children) {
      addListener(el);
    }
  },
);
