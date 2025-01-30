import { init as indexInit } from "./index.ts";

type InitResult = {
	readonly root: HTMLElement;
};

export function init({
	children,
	style,
}: {
	readonly children?: HTMLElement[];
	readonly style?: Partial<CSSStyleDeclaration>;
}): InitResult {
	const container = document.createElement("div");
	for (const child of children ?? []) {
		container.appendChild(child);
	}

	const root = document.createElement("div");
	root.appendChild(container);

	if (style !== undefined) {
		Object.assign(root.style, style);
	}

	indexInit({ container });

	return { root };
}
