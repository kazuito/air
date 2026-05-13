import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
	manifest: {
		name: "AIR — AI Router for Browser",
		short_name: "AIR",
		description: "Route prompts to ChatGPT / Claude / Gemini from a single URL.",
		permissions: ["webNavigation", "tabs", "scripting"],
		host_permissions: [
			"*://ai.router/*",
			"https://chatgpt.com/*",
			"https://claude.ai/*",
			"https://gemini.google.com/*",
		],
	},
});
