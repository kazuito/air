const ROUTER_HOST = "ai.router";

type PendingPrompt = {
	target: string;
	prompt: string;
};

const pending = new Map<number, PendingPrompt>();

export default defineBackground(() => {
	browser.webNavigation.onBeforeNavigate.addListener(
		(details) => {
			if (details.frameId !== 0) return;

			const url = new URL(details.url);
			if (url.hostname !== ROUTER_HOST) return;

			const target = route(url);
			if (!target) return;

			const prompt = url.searchParams.get("q") ?? "";
			pending.set(details.tabId, { target, prompt });

			console.log("[ai-router] redirect", details.url, "->", target);
			browser.tabs.update(details.tabId, { url: target });
		},
		{ url: [{ hostEquals: ROUTER_HOST }] },
	);

	browser.webNavigation.onCompleted.addListener((details) => {
		if (details.frameId !== 0) return;
		const entry = pending.get(details.tabId);
		if (!entry) return;
		if (!details.url.startsWith(entry.target)) return;

		pending.delete(details.tabId);

		browser.scripting.executeScript({
			target: { tabId: details.tabId },
			func: (prompt: string) => {
				alert(prompt);
			},
			args: [entry.prompt],
		});
	});

	browser.tabs.onRemoved.addListener((tabId) => {
		pending.delete(tabId);
	});
});

function route(url: URL): string | null {
	const path = url.pathname.replace(/^\/+/, "").toLowerCase();
	switch (path) {
		case "chatgpt":
			return "https://chatgpt.com/";
		default:
			return null;
	}
}
