import type { AutomationFn } from "./types";

export const automateGemini: AutomationFn = async ({
	prompt,
	mode,
	followUp,
}) => {
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

	// 1. Select model (skip when mode is unspecified, or for follow-up — model is locked to existing chat)
	if (mode && !followUp) {
		const itemSelector =
			mode === "instant"
				? '[data-test-id="bard-mode-option-fast"]'
				: '[data-test-id="bard-mode-option-pro"]';

		const trigger = await waitForElement<HTMLElement>(
			'[data-test-id="bard-mode-menu-button"]',
		);
		trigger.click();
		const item = await waitForElement<HTMLElement>(itemSelector);
		item.click();
	}

	// 2. Input prompt into rich-textarea / Quill editor
	const editor = await waitForElement<HTMLElement>(
		'rich-textarea [contenteditable="true"], .ql-editor[contenteditable="true"]',
	);
	editor.focus();
	const inserted = document.execCommand("insertText", false, prompt);
	if (!inserted) {
		editor.textContent = prompt;
		editor.dispatchEvent(new InputEvent("input", { bubbles: true }));
	}

	// 3. Send
	const sendBtn = await waitForElement<HTMLButtonElement>(
		'button[aria-label="Send message"]:not([disabled]):not([aria-disabled="true"]), button.send-button:not([disabled]):not([aria-disabled="true"])',
	);
	sendBtn.click();
};
