import { defineConfig } from "vite";

import reactServerDom from "@jacob-ebey/vite-react-server-dom";

export default defineConfig({
	plugins: [
		reactServerDom({
			browserReferences: "src/browser-references.ts",
			callServerPrerender: "src/call-server-prerender.ts",
			entries: {
				browser: "src/entry.browser.tsx",
				prerender: "src/entry.prerender.tsx",
				server: "src/entry.server.tsx",
			},
		}),
	],
});
