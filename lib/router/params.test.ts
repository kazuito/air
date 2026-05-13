import { describe, expect, it } from "vitest";
import {
	normalizeKey,
	readMode,
	readParam,
	readSend,
	readSession,
	resolveProvider,
} from "./params";

const u = (qs: string) => new URL(`https://ai.router/chatgpt${qs}`);
const provider = (path: string) => new URL(`https://ai.router/${path}`);

describe("normalizeKey", () => {
	it("lowercases and strips dashes/underscores", () => {
		expect(normalizeKey("NEW_TAB")).toBe("newtab");
		expect(normalizeKey("new-tab")).toBe("newtab");
		expect(normalizeKey("newTab")).toBe("newtab");
		expect(normalizeKey("--new__TAB--")).toBe("newtab");
	});
});

describe("readParam", () => {
	it("returns null when no alias matches", () => {
		expect(readParam(u("?other=1"), "q", "prompt")).toBeNull();
		expect(readParam(u(""), "q")).toBeNull();
	});

	it("returns the value of the first alias seen in the URL", () => {
		expect(readParam(u("?q=hello"), "q", "p", "prompt")).toBe("hello");
		expect(readParam(u("?prompt=hi"), "q", "p", "prompt")).toBe("hi");
	});

	it("matches aliases after normalization", () => {
		expect(readParam(u("?NEW_TAB=1"), "newTab")).toBe("1");
		expect(readParam(u("?new-tab=2"), "newtab")).toBe("2");
		expect(readParam(u("?newTab=3"), "new_tab")).toBe("3");
	});

	it("preserves the original value verbatim (no trim, no decode beyond URL)", () => {
		const url = u(`?q=${encodeURIComponent("  hi there\nyo  ")}`);
		expect(readParam(url, "q")).toBe("  hi there\nyo  ");
	});

	it("returns the first matching parameter when multiple aliases are present", () => {
		// URLSearchParams iterates in order; first hit wins.
		expect(readParam(u("?p=second&q=first"), "q", "p")).toBe("second");
	});
});

describe("readMode", () => {
	it("returns undefined when unset (keep current model)", () => {
		expect(readMode(u(""))).toBeUndefined();
	});

	it("returns instant / thinking for valid values, case-insensitive", () => {
		expect(readMode(u("?mode=instant"))).toBe("instant");
		expect(readMode(u("?mode=THINKING"))).toBe("thinking");
		expect(readMode(u("?m=Instant"))).toBe("instant");
	});

	it("accepts the short alias `m`", () => {
		expect(readMode(u("?m=thinking"))).toBe("thinking");
	});

	it("returns undefined for unknown values rather than falling back", () => {
		expect(readMode(u("?mode=fast"))).toBeUndefined();
		expect(readMode(u("?mode="))).toBeUndefined();
	});
});

describe("readSession", () => {
	it("defaults to replace", () => {
		expect(readSession(u(""))).toBe("replace");
	});

	it("accepts new / replace / append, case-insensitive", () => {
		expect(readSession(u("?session=new"))).toBe("new");
		expect(readSession(u("?session=REPLACE"))).toBe("replace");
		expect(readSession(u("?session=Append"))).toBe("append");
	});

	it("falls back to replace for unknown values", () => {
		expect(readSession(u("?session=bogus"))).toBe("replace");
		expect(readSession(u("?session="))).toBe("replace");
	});
});

describe("readSend", () => {
	it("defaults to true when unset", () => {
		expect(readSend(u(""))).toBe(true);
	});

	it("returns false for false / 0 / no, case-insensitive", () => {
		expect(readSend(u("?send=false"))).toBe(false);
		expect(readSend(u("?send=FALSE"))).toBe(false);
		expect(readSend(u("?send=0"))).toBe(false);
		expect(readSend(u("?send=No"))).toBe(false);
	});

	it("returns true for true / 1 / anything else", () => {
		expect(readSend(u("?send=true"))).toBe(true);
		expect(readSend(u("?send=1"))).toBe(true);
		expect(readSend(u("?send=yes"))).toBe(true);
		expect(readSend(u("?send=whatever"))).toBe(true);
	});
});

describe("resolveProvider", () => {
	it("resolves known providers (case-insensitive)", () => {
		expect(resolveProvider(provider("chatgpt"))).toBe("chatgpt");
		expect(resolveProvider(provider("Claude"))).toBe("claude");
		expect(resolveProvider(provider("GEMINI"))).toBe("gemini");
	});

	it("ignores leading slashes in the path", () => {
		expect(resolveProvider(provider("//chatgpt"))).toBe("chatgpt");
	});

	it("returns null for unknown providers", () => {
		expect(resolveProvider(provider("unknown"))).toBeNull();
		expect(resolveProvider(provider(""))).toBeNull();
	});
});
