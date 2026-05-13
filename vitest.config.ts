import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
	resolve: {
		alias: {
			"@": rootDir,
			"~": rootDir,
		},
	},
	test: {
		environment: "node",
		include: ["**/*.{test,spec}.ts"],
		exclude: ["node_modules", ".output", ".wxt"],
	},
});
