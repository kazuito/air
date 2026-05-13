import type { AutomationFn } from "./types";

export const automateChatGPT: AutomationFn = async ({
	prompt,
	mode,
	followUp,
	send,
}) => {
	const SELECTORS = {
		modelTrigger:
			'[data-testid="model-switcher-dropdown-button"], button.__composer-pill',
		modelItemInstant:
			".__menu-item[data-testid^='model-switcher-']:not([data-testid*='thinking'])",
		modelItemThinking:
			".__menu-item[data-testid^='model-switcher-'][data-testid*='thinking']",
		editor: "#prompt-textarea",
		sendButton:
			'[data-testid="send-button"]:not([disabled]):not([aria-disabled="true"])',
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

	// 1. Select model (skip when mode is unspecified, or for follow-up — model is locked to existing chat)
	if (mode && !followUp) {
		const itemSelector =
			mode === "instant"
				? SELECTORS.modelItemInstant
				: SELECTORS.modelItemThinking;

		const trigger = await waitForElement<HTMLElement>(SELECTORS.modelTrigger);
		if (trigger.getAttribute("data-state") !== "open") {
			simulatePointerClick(trigger);
		}
		const item = await waitForElement(itemSelector);
		simulatePointerClick(item);
	}

	// 2. Input prompt into ProseMirror editor
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
	simulatePointerClick(sendBtn);
};
