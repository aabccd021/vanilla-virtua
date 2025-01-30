import { init as vListInit } from "../src/vList.ts";

const createRows = (num) => {
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

const vList = vListInit({
	style: { height: "100vh" },
	children: createRows(1000),
});

document.body.appendChild(vList.root);
