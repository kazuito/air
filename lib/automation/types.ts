export type Mode = "instant" | "thinking";

export type AutomationArgs = {
	prompt: string;
	mode?: Mode;
	followUp?: boolean;
	send: boolean;
};

export type AutomationFn = (args: AutomationArgs) => Promise<void>;

export type ProviderConfig = {
	origin: string;
	automate: AutomationFn;
};
