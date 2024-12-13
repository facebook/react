import * as path from "node:path";
import { pathToFileURL } from "node:url";

import { createRequestListener } from "@mjackson/node-fetch-server";
import compression from "compression";
import express from "express";

const app = express();
app.disable("x-powered-by");

app.use(compression());

const entry = pathToFileURL(path.resolve(process.cwd(), process.argv[2])).href;
const mod = await import(entry);

const fetchFunction =
	mod.fetch ??
	mod.handleFetch ??
	mod.default?.fetch ??
	mod.default?.handleFetch ??
	mod.default;

if (typeof fetchFunction !== "function") {
	throw new Error(`No fetch handler function found in '${entry}'.`);
}

const browserDir = path.resolve(process.argv[4] || "dist/browser");

app.use(
	express.static(path.join(browserDir, "assets"), {
		immutable: true,
		maxAge: "1y",
	}),
);

app.use(
	express.static(browserDir, {
		maxAge: "5m",
	}),
);

app.use(createRequestListener(fetchFunction));

const port = Number.parseInt(process.env.PORT || "3000", 10);
app.listen(port, () => {
	console.log(`Listening on http://localhost:${port}`);
});
