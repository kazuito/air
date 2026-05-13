import type { AutomationFn } from "./types";

export const automateClaude: AutomationFn = async ({ prompt, mode }) => {
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

	// 1. Select model
	const label = mode === "instant" ? "Sonnet" : "Opus";
	const trigger = await waitForElement<HTMLElement>(
		'[data-testid="model-selector-dropdown"]',
	);
	if (trigger.getAttribute("aria-expanded") !== "true") {
		trigger.click();
	}
	await waitForElement('[role="menuitemradio"]');
	const target = [
		...document.querySelectorAll<HTMLElement>('[role="menuitemradio"]'),
	].find((item) => {
		return item.textContent?.trim().includes(label);
	});
	if (!target) throw new Error(`Claude: menuitem "${label}" not found`);
	target.click();

	// 2. Input prompt into ProseMirror editor
	const editor = await waitForElement<HTMLElement>(
		'div[contenteditable="true"].ProseMirror, div[contenteditable="true"]',
	);
	editor.focus();
	const inserted = document.execCommand("insertText", false, prompt);
	if (!inserted) {
		editor.textContent = prompt;
		editor.dispatchEvent(new InputEvent("input", { bubbles: true }));
	}

	// 3. Send
	const sendBtn = await waitForElement<HTMLButtonElement>(
		'button[aria-label="Send message"]:not([disabled]):not([aria-disabled="true"]), button[aria-label="Send Message"]:not([disabled]):not([aria-disabled="true"])',
	);
	sendBtn.click();
};
