import { appendChildren, init } from "./index.ts";

const heights = [20, 40, 80, 77];

const createRows = () =>
	Array.from({ length: 30 }).map((_, i) => {
		const item = document.createElement("div");
		const height = heights[i % 4];
		item.style.height = `${height}px`;
		item.style.borderBottom = "solid 1px #ccc";
		item.textContent = `Height: ${height}px`;
		return item;
	});

// Initialize list with 30 items

const container = document.createElement("div");
const initialRows = createRows();
for (const row of initialRows) {
	container.appendChild(row);
}

const root = document.getElementById("root")!;
root.style.height = "400px";
root.appendChild(container);

const vlist = init({ container });

// Append 30 items when button is clicked
document.getElementById("append-button")?.addEventListener("click", () => {
	const newRows = createRows();
	appendChildren(vlist.context, newRows);
});
