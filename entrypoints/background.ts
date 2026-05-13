import {
	type AutomationArgs,
	type Mode,
	type Provider,
	providers,
} from "@/lib/automation";

const ROUTER_HOST = "ai.router";

type PendingEntry = {
	provider: Provider;
	args: AutomationArgs;
};

const pending = new Map<number, PendingEntry>();

export default defineBackground(() => {
	browser.webNavigation.onBeforeNavigate.addListener(
		(details) => {
			if (details.frameId !== 0) return;

			const url = new URL(details.url);
			if (url.hostname !== ROUTER_HOST) return;

			const provider = resolveProvider(url);
			if (!provider) return;

			const prompt = url.searchParams.get("q") ?? "";
			const mode: Mode =
				url.searchParams.get("m") === "thinking" ? "thinking" : "instant";

			console.log("[ai-router] handle", details.url);
			void handleRouterNavigation(details.tabId, provider, { prompt, mode });
		},
		{ url: [{ hostEquals: ROUTER_HOST }] },
	);

	browser.webNavigation.onCompleted.addListener((details) => {
		if (details.frameId !== 0) return;
		const entry = pending.get(details.tabId);
		if (!entry) return;
		const expected = new URL(providers[entry.provider].origin).hostname;
		if (new URL(details.url).hostname !== expected) return;

		pending.delete(details.tabId);
		runAutomation(details.tabId, entry.provider, entry.args);
	});

	browser.tabs.onRemoved.addListener((tabId) => {
		pending.delete(tabId);
	});
});

async function handleRouterNavigation(
	routerTabId: number,
	provider: Provider,
	args: AutomationArgs,
): Promise<void> {
	const expectedHost = new URL(providers[provider].origin).hostname;
	const existing = await findProviderTab(expectedHost, routerTabId);

	if (!existing?.id) {
		pending.set(routerTabId, { provider, args });
		await browser.tabs.update(routerTabId, {
			url: providers[provider].origin,
		});
		return;
	}

	console.log("[ai-router] reuse tab", existing.id);

	await browser.tabs.update(existing.id, { active: true });
	if (existing.windowId != null) {
		await browser.windows.update(existing.windowId, { focused: true });
	}

	try {
		await browser.tabs.remove(routerTabId);
	} catch {
		// router tab may already be gone
	}

	await triggerNewChatShortcut(existing.id);
	await sleep(200);
	runAutomation(existing.id, provider, args);
}

async function findProviderTab(
	hostname: string,
	routerTabId: number,
): Promise<Browser.tabs.Tab | undefined> {
	const tabs = await browser.tabs.query({ url: `*://${hostname}/*` });
	if (tabs.length === 0) return undefined;

	let routerWindowId: number | undefined;
	try {
		routerWindowId = (await browser.tabs.get(routerTabId)).windowId;
	} catch {
		// ignore
	}

	return (
		tabs.find((t) => t.windowId === routerWindowId) ??
		tabs.find((t) => t.active) ??
		tabs[0]
	);
}

function runAutomation(
	tabId: number,
	provider: Provider,
	args: AutomationArgs,
): void {
	browser.scripting.executeScript({
		target: { tabId },
		func: providers[provider].automate,
		args: [args],
		world: "MAIN",
	});
}

async function triggerNewChatShortcut(tabId: number): Promise<void> {
	await browser.scripting.executeScript({
		target: { tabId },
		world: "MAIN",
		func: () => {
			const isMac = navigator.userAgent.includes("Mac");
			const init: KeyboardEventInit = {
				key: "o",
				code: "KeyO",
				metaKey: isMac,
				ctrlKey: !isMac,
				shiftKey: true,
				bubbles: true,
				cancelable: true,
			};
			const dispatch = (target: EventTarget) => {
				target.dispatchEvent(new KeyboardEvent("keydown", init));
				target.dispatchEvent(new KeyboardEvent("keyup", init));
			};
			dispatch(document);
			dispatch(window);
			if (document.activeElement) dispatch(document.activeElement);
		},
	});
}

function sleep(ms: number): Promise<void> {
	return new Promise((r) => setTimeout(r, ms));
}

function resolveProvider(url: URL): Provider | null {
	const path = url.pathname.replace(/^\/+/, "").toLowerCase();
	return path in providers ? (path as Provider) : null;
}
