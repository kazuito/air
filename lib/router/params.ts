import { type Mode, type Provider, providers } from "@/lib/automation";

export const ROUTER_HOST = "air";

export type Session = "new" | "replace" | "append";
const SESSION_VALUES = new Set<Session>(["new", "replace", "append"]);

export function normalizeKey(key: string): string {
	return key.toLowerCase().replace(/[-_]/g, "");
}

export function readParam(url: URL, ...aliases: string[]): string | null {
	const wanted = new Set(aliases.map(normalizeKey));
	for (const [key, value] of url.searchParams) {
		if (wanted.has(normalizeKey(key))) return value;
	}
	return null;
}

export function readSession(url: URL): Session {
	const raw = readParam(url, "session")?.toLowerCase();
	if (raw && SESSION_VALUES.has(raw as Session)) return raw as Session;
	return "replace";
}

export function readMode(url: URL): Mode | undefined {
	const raw = readParam(url, "m", "mode")?.toLowerCase();
	if (raw === "instant" || raw === "thinking") return raw;
	return undefined;
}

export function readSend(url: URL): boolean {
	const raw = readParam(url, "send")?.toLowerCase();
	if (raw === "false" || raw === "0" || raw === "no") return false;
	return true;
}

export function resolveProvider(url: URL): Provider | null {
	const path = url.pathname.replace(/^\/+/, "").toLowerCase();
	return path in providers ? (path as Provider) : null;
}
