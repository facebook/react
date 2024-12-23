import * as stream from "node:stream";

// @ts-expect-error - no types yet
import RSD from "@jacob-ebey/react-server-dom-vite/server";
import type { ReactFormState } from "react-dom/client";

// @ts-expect-error - no types yet
import { manifest } from "virtual:@jacob-ebey/vite-react-server-dom/server-api";

import { Document } from "./document.js";
import { Router } from "./router.js";
import { RequestContext } from "./server-context.js";

export type ServerPayload = {
	formState?: ReactFormState;
	returnValue?: unknown;
	root: React.JSX.Element;
};

export async function handleFetch(request: Request) {
	const context = new Map<unknown, unknown>();
	let formState: ReactFormState | undefined;
	let returnValue: unknown | undefined;

	return RequestContext.run(
		{
			context,
			headers: request.headers,
			url: request.url,
		},
		async () => {
			const actionId = request.headers.get("rsc-action");
			try {
				if (actionId) {
					const reference = manifest.resolveServerReference(actionId);
					await reference.preload();
					const action = reference.get() as ((
						...args: unknown[]
					) => unknown) & {
						$$typeof: symbol;
					};
					if (action.$$typeof !== Symbol.for("react.server.reference")) {
						throw new Error("Invalid action");
					}

					const args = await RSD.decodeReply(
						await request.formData(),
						manifest,
					);

					returnValue = action.apply(null, args);
					try {
						await returnValue;
					} catch {}
				} else if (request.method === "POST") {
					const formData = await request.formData();
					const action = await RSD.decodeAction(formData, manifest);
					formState = await RSD.decodeFormState(
						await action(),
						formData,
						manifest,
					);
				}
			} catch (error) {
				// TODO: Set server state
			}

			const root = (
				<Document>
					<Router />
				</Document>
			);

			const payload = {
				formState,
				returnValue,
				root,
			} satisfies ServerPayload;

			const { abort, pipe } = RSD.renderToPipeableStream(payload, manifest);

			request.signal.addEventListener("abort", () => abort());

			const body = stream.Readable.toWeb(
				pipe(new stream.PassThrough()),
			) as ReadableStream<Uint8Array>;

			return new Response(body, {
				headers: {
					"Content-Type": "text/x-component",
				},
			});
		},
	);
}
