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
			pending.set(details.tabId, { provider, args: { prompt, mode } });

			const target = providers[provider].origin;
			console.log("[ai-router] redirect", details.url, "->", target);
			browser.tabs.update(details.tabId, { url: target });
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

		browser.scripting.executeScript({
			target: { tabId: details.tabId },
			func: providers[entry.provider].automate,
			args: [entry.args],
			world: "MAIN",
		});
	});

	browser.tabs.onRemoved.addListener((tabId) => {
		pending.delete(tabId);
	});
});

function resolveProvider(url: URL): Provider | null {
	const path = url.pathname.replace(/^\/+/, "").toLowerCase();
	return path in providers ? (path as Provider) : null;
}
