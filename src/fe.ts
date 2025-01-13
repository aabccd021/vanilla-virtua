document.addEventListener(
  "infinite-new-children",
  (e: CustomEventInit<{ children: Element[] }>) => {
    if (e.detail === undefined) {
      return;
    }
    for (const el of e.detail.children) {
      el.addEventListener("click", () => {
        console.warn("Hello from click");
      });
    }
  },
);
