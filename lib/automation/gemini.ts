import type { AutomationFn } from "./types";

export const automateGemini: AutomationFn = async ({
	prompt,
	mode,
	followUp,
	send,
}) => {
	const getters = {
		modelTrigger: () =>
			document.querySelector<HTMLElement>(
				'[data-test-id="bard-mode-menu-button"]',
			),
		modelItemInstant: () =>
			Array.from(
				document.querySelectorAll<HTMLElement>(
					'[data-test-id="gem-mode-menu"] > gem-menu-item',
				),
			).find(
				(el) =>
					el.textContent.includes("Flash") && !el.textContent.includes("Lite"),
			),
		modelItemThinking: () =>
			Array.from(
				document.querySelectorAll<HTMLElement>(
					'[data-test-id="gem-mode-menu"] > gem-menu-item',
				),
			).find((el) => el.textContent.includes("Pro")),
		editor: () =>
			document.querySelector<HTMLElement>(
				'rich-textarea [contenteditable="true"], .ql-editor[contenteditable="true"]',
			),
		sendButton: () =>
			document.querySelector<HTMLButtonElement>(
				'button[aria-label="Send message"]:not([disabled]):not([aria-disabled="true"]), button.send-button:not([disabled]):not([aria-disabled="true"])',
			),
	};

	const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

	const waitForElement = async <T extends Element = Element>(
		getter: () => T | null | undefined,
		timeout = 15000,
	): Promise<T> => {
		const start = Date.now();
		while (Date.now() - start < timeout) {
			const el = getter();
			if (el) return el;
			await sleep(50);
		}
		throw new Error(`Element not found: ${getter.name}`);
	};

	// 1. Select model (skip when mode is unspecified, or for follow-up — model is locked to existing chat)
	if (mode && !followUp) {
		const itemGetter =
			mode === "instant" ? getters.modelItemInstant : getters.modelItemThinking;

		const trigger = await waitForElement<HTMLElement>(getters.modelTrigger);
		trigger.click();
		const item = await waitForElement<HTMLElement>(itemGetter);
		item.click();
		trigger.click();
	}

	// 2. Input prompt into rich-textarea / Quill editor
	const editor = await waitForElement<HTMLElement>(getters.editor);
	editor.focus();
	const inserted = document.execCommand("insertText", false, prompt);
	if (!inserted) {
		editor.textContent = prompt;
		editor.dispatchEvent(new InputEvent("input", { bubbles: true }));
	}

	// 3. Send (skip when send=false; prompt is left staged in the editor)
	if (!send) return;
	const sendBtn = await waitForElement<HTMLButtonElement>(getters.sendButton);
	sendBtn.click();
};
