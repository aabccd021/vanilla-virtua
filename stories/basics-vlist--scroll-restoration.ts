import type { CacheSnapshot } from "../src/virtualizer.ts";
import { init as vlistInit } from "../src/vlist.ts";

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
    } catch (_e) {
      // ignore
    }
  }

  const vlist = vlistInit({
    cache,
    style: { height: "100vh" },
    children: createRows(1000),
  });

  const root = vlist.root;

  if (offset !== undefined) {
    vlist.virtualizer.scroller.$scrollTo(offset);
  }

  const unsub = () => {
    sessionStorage.setItem(
      cacheKey,
      JSON.stringify([vlist.virtualizer.store.$getScrollOffset(), vlist.virtualizer.store.$getCacheSnapshot()]),
    );
  };

  return { root, unsub };
};

let resList: ResList | undefined;

let selectedId = "1";
function setSelectedId(id: string) {
  selectedId = id;
  selectedId = id;
  for (const list of lists) {
    list.input.checked = list.id === selectedId;
  }
  const newResList = restorableList({ id: selectedId });
  resList?.unsub();
  resList?.root.replaceWith(newResList.root);
  resList = newResList;
}

let show = true;
function setShow() {
  button.textContent = show ? "hide" : "show";
  if (show) {
    resList = restorableList({ id: selectedId });
    div.appendChild(resList.root);
  } else {
    resList?.unsub();
    resList?.root.remove();
  }
}

const lists = ["1", "2", "3"].map((id) => {
  const input = document.createElement("input");
  input.type = "radio";
  input.textContent = id;
  input.addEventListener("change", () => setSelectedId(id));

  const label = document.createElement("label");
  label.appendChild(input);
  return { label, id, input };
});

const button = document.createElement("button");
button.addEventListener("click", () => {
  show = !show;
  setShow();
});

const div = document.createElement("div");
div.appendChild(button);
for (const list of lists) {
  div.appendChild(list.label);
}

setShow();
setSelectedId(selectedId);

const storyBookRoot = document.getElementById("storybook-root");
if (storyBookRoot === null) {
  throw new Error("Root element not found");
}

storyBookRoot.appendChild(div);
