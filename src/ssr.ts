import { init, appendChildren } from "./index.ts";

const container = document.getElementById("container")!;
const vlist = init({ container });

const heights = [20, 40, 80, 77];

document.getElementById("append-button")?.addEventListener("click", () => {
	const newRows = Array.from({ length: 30 }).map((_, i) => {
		const item = document.createElement("div");
		const height = heights[i % 4];
		item.style.height = `${height}px`;
		item.style.borderBottom = "solid 1px #ccc";
		item.textContent = `Height: ${height}px`;
		return item;
	});
	appendChildren(vlist.context, newRows);
});
