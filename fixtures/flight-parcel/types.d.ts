// TODO: move these into their respective packages.

declare module 'react-server-dom-parcel/client' {
  export function createFromFetch<T>(res: Promise<Response>): Promise<T>;
  export function createFromReadableStream<T>(stream: ReadableStream): Promise<T>;
  export function encodeReply(value: any): Promise<string | URLSearchParams | FormData>;

  type CallServerCallback = <T>(id: string, args: any[]) => Promise<T>;
  export function setServerCallback(cb: CallServerCallback): void;
}

declare module 'react-server-dom-parcel/server.edge' {
  export function renderToReadableStream(value: any): ReadableStream;
  export function loadServerAction(id: string): Promise<(...args: any[]) => any>;
  export function decodeReply<T>(body: string | FormData): Promise<T>;
  export function decodeAction(body: FormData): Promise<(...args: any[]) => any>;
}

declare module '@parcel/runtime-rsc' {
  export function Resources(): JSX.Element;
}
