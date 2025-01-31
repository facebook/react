import type { IncomingMessage, ServerResponse } from "node:http";
import { PassThrough, Readable } from "node:stream";
import type { PipeableStream } from "react-dom/server";

export function createRequest(
	req: IncomingMessage,
	res: ServerResponse,
): Request {
	const abortController = new AbortController();
	res.once("close", () => {
		if (req.destroyed) {
			abortController.abort();
		}
	});

	const headers = new Headers();
	for (const [k, v] of Object.entries(req.headers)) {
		if (k.startsWith(":")) {
			continue;
		}
		if (typeof v === "string") {
			headers.set(k, v);
		} else if (Array.isArray(v)) {
			v.forEach((v) => headers.append(k, v));
		}
	}

	return new Request(
		new URL(
			req.url || "/",
			`${headers.get("x-forwarded-proto") ?? "http"}://${
				req.headers.host || "unknown.local"
			}`,
		),
		{
			method: req.method,
			body:
				req.method === "GET" || req.method === "HEAD"
					? null
					: (Readable.toWeb(req) as any),
			headers,
			signal: abortController.signal,
			// @ts-ignore for undici
			duplex: "half",
		},
	);
}

export function sendResponse(response: Response, res: ServerResponse) {
	const headers = Object.fromEntries(response.headers);
	if (headers["set-cookie"]) {
		delete headers["set-cookie"];
		res.setHeader("set-cookie", response.headers.getSetCookie());
	}
	res.writeHead(response.status, response.statusText, headers);

	if (response.body) {
		const abortController = new AbortController();
		res.once("close", () => abortController.abort());
		res.once("error", () => abortController.abort());
		Readable.fromWeb(response.body as any, {
			signal: abortController.signal,
		}).pipe(res);
	} else {
		res.end();
	}
}

export function fromPipeableToWebReadable(stream: PipeableStream) {
	return Readable.toWeb(
		stream.pipe(new PassThrough()),
	) as ReadableStream<Uint8Array>;
}

export function fromWebToNodeReadable(stream: ReadableStream<Uint8Array>) {
	return Readable.fromWeb(stream as any);
}
