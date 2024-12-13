import * as stream from "node:stream";
import type * as streamWeb from "node:stream/web";

// @ts-expect-error - no types
import RSD from "@jacob-ebey/react-server-dom-vite/client";
import { renderToPipeableStream } from "react-dom/server";
import { injectRSCPayload } from "rsc-html-stream/server";

import {
	bootstrapModules,
	callServer,
	manifest,
	// @ts-expect-error - virtual module with no types
} from "virtual:@jacob-ebey/vite-react-server-dom/client-api";

import type { ServerPayload } from "./entry.server.js";

export async function handleFetch(request: Request) {
	const serverResponse: Response = await callServer(request);

	if (request.headers.get("Accept")?.match(/\btext\/x-component\b/)) {
		return serverResponse;
	}

	if (!serverResponse.body) {
		throw new Error("Expected response body");
	}

	const [rscA, rscB] = serverResponse.body.tee();

	const payload: ServerPayload = await RSD.createFromNodeStream(
		stream.Readable.fromWeb(rscA as streamWeb.ReadableStream),
		manifest,
	);

	const { abort, pipe } = renderToPipeableStream(payload.root, {
		bootstrapModules,
		// @ts-expect-error - no types yet
		formState: payload.formState,
	});

	request.signal.addEventListener("abort", () => abort());

	const body = stream.Readable.toWeb(
		pipe(new stream.PassThrough()),
	) as ReadableStream<Uint8Array>;

	const headers = new Headers(serverResponse.headers);
	headers.set("Content-Type", "text/html; charset=utf-8");

	return new Response(body.pipeThrough(injectRSCPayload(rscB)), {
		headers,
		status: serverResponse.status,
		statusText: serverResponse.statusText,
	});
}
