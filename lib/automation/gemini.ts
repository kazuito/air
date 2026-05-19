import type { AutomationFn } from "./types";

export const automateGemini: AutomationFn = async ({
	prompt,
	mode,
	followUp,
	send,
}) => {
	const SELECTORS = {
		modelTrigger: '[data-test-id="bard-mode-menu-button"]',
		modelItemInstant:
			'[data-test-id="gem-mode-menu"] > gem-menu-item:nth-child(2)',
		modelItemThinking:
			'[data-test-id="gem-mode-menu"] > gem-menu-item:nth-child(3)',
		editor:
			'rich-textarea [contenteditable="true"], .ql-editor[contenteditable="true"]',
		sendButton:
			'button[aria-label="Send message"]:not([disabled]):not([aria-disabled="true"]), button.send-button:not([disabled]):not([aria-disabled="true"])',
	} as const;

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
				? SELECTORS.modelItemInstant
				: SELECTORS.modelItemThinking;

		const trigger = await waitForElement<HTMLElement>(SELECTORS.modelTrigger);
		trigger.click();
		const item = await waitForElement<HTMLElement>(itemSelector);
		item.click();
	}

	// 2. Input prompt into rich-textarea / Quill editor
	const editor = await waitForElement<HTMLElement>(SELECTORS.editor);
	editor.focus();
	const inserted = document.execCommand("insertText", false, prompt);
	if (!inserted) {
		editor.textContent = prompt;
		editor.dispatchEvent(new InputEvent("input", { bubbles: true }));
	}

	// 3. Send (skip when send=false; prompt is left staged in the editor)
	if (!send) return;
	const sendBtn = await waitForElement<HTMLButtonElement>(SELECTORS.sendButton);
	sendBtn.click();
};
