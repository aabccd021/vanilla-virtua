import type { CacheSnapshot } from "../src/index.ts";
import { init as vListInit } from "../src/vList.ts";

const createRows = (num: number) => {
  const heights = [20, 40, 80, 77];
  return Array.from({ length: num }).map((_, i) => {
    const div = document.createElement("div");
    div.style.height = `${heights[i % 4]}px`;
    div.style.borderBottom = "solid 1px #ccc";
    div.style.background = "#fff";
    div.textContent = `${i}`;
    return div;
  });
};

type ResList = {
  root: HTMLElement;
  unsub: () => void;
};

const restorableList = ({ id }: { id: string }): ResList => {
  const cacheKey = `list-cache-${id}`;

  let offset: number | undefined;
  let cache: CacheSnapshot | undefined;

  const serialized = sessionStorage.getItem(cacheKey);
  if (serialized) {
    try {
      [offset, cache] = JSON.parse(serialized) as [number, CacheSnapshot];
    } catch (e) {
      // ignore
    }
  }
  console.log({ offset, cache });

  const vList = vListInit({
    cache,
    style: { height: "100vh" },
    children: createRows(1000),
  });

  const root = vList.root;

  if (offset !== undefined) {
    vList.context.scroller.$scrollTo(offset);
  }

  const unsub = () => {
    console.log("unsub");
    sessionStorage.setItem(
      cacheKey,
      JSON.stringify([vList.context.store.$getScrollOffset(), vList.context.store.$getCacheSnapshot()]),
    );
  };

  return { root, unsub };
};

let selectedId = "1";
let show = true;
let resList: ResList | undefined;

const lists = ["1", "2", "3"].map((id) => {
  const input = document.createElement("input");
  input.type = "radio";
  input.checked = id === selectedId;
  input.addEventListener("change", () => {
    selectedId = id;
    for (const list of lists) {
      list.input.checked = list.id === selectedId;
    }
    const newResList = restorableList({ id: selectedId });
    resList?.unsub();
    resList?.root.replaceWith(newResList.root);
    resList = newResList;
  });
  input.textContent = id;

  const label = document.createElement("label");
  label.appendChild(input);
  return { label, id, input };
});

const button = document.createElement("button");
button.addEventListener("click", () => {
  show = !show;
  button.textContent = show ? "hide" : "show";
  if (show) {
    resList = restorableList({ id: selectedId });
    div.appendChild(resList.root);
  } else {
    resList?.unsub();
    resList?.root.remove();
  }
});
button.textContent = "hide";

const div = document.createElement("div");
div.appendChild(button);
for (const list of lists) {
  div.appendChild(list.label);
}

if (show) {
  resList = restorableList({ id: selectedId });
  div.appendChild(resList.root);
}

const storyBookRoot = document.getElementById("storybook-root");
if (storyBookRoot === null) {
  throw new Error("Root element not found");
}

storyBookRoot.appendChild(div);
