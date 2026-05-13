import { automateChatGPT } from "./chatgpt";
import type { ProviderConfig } from "./types";

export const providers = {
	chatgpt: {
		origin: "https://chatgpt.com/",
		automate: automateChatGPT,
	},
	// claude: { origin: "https://claude.ai/", automate: automateClaude },
	// gemini: { origin: "https://gemini.google.com/", automate: automateGemini },
} as const satisfies Record<string, ProviderConfig>;

export type Provider = keyof typeof providers;

export type { AutomationArgs, AutomationFn, Mode, ProviderConfig } from "./types";
