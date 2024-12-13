import { AsyncLocalStorage } from "node:async_hooks";

export type RequestContext = {
	context: Map<unknown, unknown>;
	headers: Headers;
	url: string;
};

export const RequestContext = new AsyncLocalStorage<RequestContext>();

function getRequestContext() {
	const store = RequestContext.getStore();
	if (!store) {
		throw new Error("No request context available");
	}
	return store;
}

export function context<T>(key: string): T | undefined;
export function context<T>(key: string, value: T): void;
export function context(...args: unknown[]): unknown {
	if (args.length === 1) {
		return getRequestContext().context.get(args[0]);
	}
	if (args.length === 2) {
		getRequestContext().context.set(args[0], args[1]);
	}
}

export function headers() {
	return new Headers(getRequestContext().headers);
}

export function url(): URL {
	return new URL(getRequestContext().url);
}
