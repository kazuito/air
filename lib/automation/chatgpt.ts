import type { AutomationFn } from "./types";

export const automateChatGPT: AutomationFn = async ({ prompt, mode }) => {
	const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

	const waitForElement = async <T extends Element = Element>(
		selector: string,
		timeout = 15000,
	): Promise<T> => {
		const start = Date.now();
		while (Date.now() - start < timeout) {
			const el = document.querySelector<T>(selector);
			if (el) return el;
			await sleep(50);
		}
		throw new Error(`Element not found: ${selector}`);
	};

	const simulatePointerClick = (el: Element) => {
		const types = [
			"pointerdown",
			"mousedown",
			"pointerup",
			"mouseup",
			"click",
		] as const;
		for (const type of types) {
			const Ctor = type.startsWith("pointer") ? PointerEvent : MouseEvent;
			el.dispatchEvent(
				new Ctor(type, {
					bubbles: true,
					cancelable: true,
					view: window,
					button: 0,
					buttons: 1,
					pointerId: 1,
					isPrimary: true,
				}),
			);
		}
	};

	// 1. Select model
	const itemSelector =
		mode === "instant"
			? ".__menu-item[data-testid^='model-switcher-']:not([data-testid*='thinking'])"
			: ".__menu-item[data-testid^='model-switcher-'][data-testid*='thinking']";

	const trigger = await waitForElement<HTMLElement>(
		'[data-testid="model-switcher-dropdown-button"], button.__composer-pill',
	);
	if (trigger.getAttribute("data-state") !== "open") {
		simulatePointerClick(trigger);
	}
	const item = await waitForElement(itemSelector);
	simulatePointerClick(item);

	// 2. Input prompt into ProseMirror editor
	const editor = await waitForElement<HTMLElement>("#prompt-textarea");
	editor.focus();
	const inserted = document.execCommand("insertText", false, prompt);
	if (!inserted) {
		editor.textContent = prompt;
		editor.dispatchEvent(new InputEvent("input", { bubbles: true }));
	}

	// 3. Send
	const sendBtn = await waitForElement<HTMLButtonElement>(
		'[data-testid="send-button"]:not([disabled]):not([aria-disabled="true"])',
	);
	simulatePointerClick(sendBtn);
};
