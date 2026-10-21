/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactElement} from './ReactElementType';
import type {RenderContext} from './ReactFlightRenderContext';
import type {TemporaryReferenceSet} from 'react-server/src/ReactFlightServerTemporaryReferences';
import noop from './noop';

// A Result is a model whose Server Components get executed at most once, by
// whichever consumer reaches them first. It keeps the caller's model as is
// and records each Server Component element's expansion in a ledger keyed by
// element identity. Serializing the Result to Flight rows and reading it in
// process both consult the ledger instead of calling the component again.

// Expansion status
export const PENDING = 0;
export const FULFILLED = 1;
export const REJECTED = 2;

export type Expansion = {
  status: 0 | 1 | 2,
  // The raw return value of the component. Consumers apply their own
  // conventions for thenables and iterators in return position.
  value: mixed,
  reason: mixed,
  digest: ?string,
  element: ReactElement,
  listeners: null | Array<[(value: mixed) => mixed, (reason: mixed) => mixed]>,
  // Server-owned: the hooks state across use() retries.
  thenableState: mixed,
  then(
    resolve: (value: mixed) => mixed,
    reject: (reason: mixed) => mixed,
  ): void,
};

function expansionThen(
  this: Expansion,
  resolve: (value: mixed) => mixed,
  reject: (reason: mixed) => mixed,
): void {
  switch (this.status) {
    case FULFILLED:
      resolve(this.value);
      break;
    case REJECTED:
      reject(this.reason);
      break;
    default: {
      let listeners = this.listeners;
      if (listeners === null) {
        this.listeners = listeners = [];
      }
      listeners.push([resolve, reject]);
    }
  }
}

export function createExpansion(element: ReactElement): Expansion {
  return {
    status: PENDING,
    value: undefined,
    reason: undefined,
    digest: null,
    element,
    listeners: null,
    thenableState: null,
    then: expansionThen,
  };
}

export function fulfillExpansion(expansion: Expansion, value: mixed): void {
  if (expansion.status !== PENDING) {
    return;
  }
  expansion.status = FULFILLED;
  expansion.value = value;
  const listeners = expansion.listeners;
  if (listeners !== null) {
    expansion.listeners = null;
    for (let i = 0; i < listeners.length; i++) {
      listeners[i][0](value);
    }
  }
}

export function rejectExpansion(
  expansion: Expansion,
  reason: mixed,
  digest: ?string,
): void {
  if (expansion.status !== PENDING) {
    return;
  }
  expansion.status = REJECTED;
  expansion.reason = reason;
  expansion.digest = digest;
  const listeners = expansion.listeners;
  if (listeners !== null) {
    expansion.listeners = null;
    for (let i = 0; i < listeners.length; i++) {
      listeners[i][1](reason);
    }
  }
}

const RESULT_TYPE = Symbol.for('react.flight.result');

export type Result<T> = {
  $$typeof: symbol,
  model: T,
  context: RenderContext,
  expansions: WeakMap<ReactElement, Expansion>,
  // Server-owned: runs the element's Server Component under this Result.
  // Returns null for elements that are not Server Components.
  expand: (element: ReactElement) => null | Expansion,
  // Server-owned: distinguishes Client References from Server Components.
  isClientReference: (type: mixed) => boolean,
  // Server-owned: runs a callback with this Result's render context active,
  // so that cache(), useId() and resource hints inside Server Components it
  // expands resolve to it, including after an await.
  run: <R>(callback: () => R) => R,
  // Server-owned: throws if a value was tainted, as the serializer would.
  checkTainted: (value: mixed) => void,
  // A single-shot iterator is drained once; every consumer reads the items.
  iteratorEntries: null | WeakMap<Object, Array<mixed>>,
  // Streams and async iterables, pulled once and replayed to every consumer.
  replays: null | WeakMap<Object, Replay>,
  aborted: boolean,
  abortReason: mixed,
  abortListeners: null | Array<(reason: mixed) => void>,
  // Expansions still running, to reject on abort.
  pendingExpansions: Set<Expansion>,
  // Each consumer holds the cache signal open until it is done.
  consumers: number,
  onError: (error: mixed) => ?string,
  // Digests already assigned, so a consumer that sees the same error does
  // not report it a second time.
  errorDigests: WeakMap<Object, string>,
  temporaryReferences: void | TemporaryReferenceSet,
  // DEV-only
  environmentName: () => string,
  filterStackFrame: (
    url: string,
    functionName: string,
    lineNumber: number,
    columnNumber: number,
  ) => boolean,
};

export function isResult(value: mixed): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as any).$$typeof === RESULT_TYPE
  );
}

export function createResultObject<T>(
  model: T,
  context: RenderContext,
  isClientReference: (type: mixed) => boolean,
  onError: (error: mixed) => ?string,
  temporaryReferences: void | TemporaryReferenceSet,
): Result<T> {
  return {
    $$typeof: RESULT_TYPE,
    model,
    context,
    expansions: new WeakMap(),
    expand: null as any,
    isClientReference,
    run: null as any,
    checkTainted: null as any,
    iteratorEntries: null,
    replays: null,
    aborted: false,
    abortReason: undefined,
    abortListeners: null,
    pendingExpansions: new Set(),
    consumers: 0,
    onError,
    errorDigests: new WeakMap(),
    temporaryReferences,
    environmentName: null as any,
    filterStackFrame: null as any,
  };
}

export function getIteratorEntries(
  result: Result<any>,
  iterator: Object,
): Array<mixed> {
  let entries = result.iteratorEntries;
  if (entries === null) {
    result.iteratorEntries = entries = new WeakMap();
  }
  let items = entries.get(iterator);
  if (items === undefined) {
    items = Array.from(iterator as any);
    entries.set(iterator, items);
  }
  return items;
}

export function getExpansion(
  result: Result<any>,
  element: ReactElement,
): void | Expansion {
  return result.expansions.get(element);
}

export function retainResult(result: Result<any>): void {
  result.consumers++;
}

// Aborts the shared cache signal once the last consumer is done. Aborting an
// already aborted controller is a no-op, so an explicit abort may precede it.
export function releaseResult(result: Result<any>, reason: mixed): void {
  if (--result.consumers === 0) {
    result.context.cacheController.abort(reason);
  }
}

export function subscribeToAbort(
  result: Result<any>,
  listener: (reason: mixed) => void,
): () => void {
  if (result.aborted) {
    listener(result.abortReason);
    return () => {};
  }
  let listeners = result.abortListeners;
  if (listeners === null) {
    result.abortListeners = listeners = [];
  }
  listeners.push(listener);
  const subscribed = listeners;
  return () => {
    // Once the Result has aborted, the listeners already ran.
    if (result.abortListeners !== subscribed) {
      return;
    }
    const index = subscribed.indexOf(listener);
    if (index !== -1) {
      subscribed.splice(index, 1);
    }
  };
}

// A ReadableStream or async iterable in the model can be read once, but every
// consumer of the Result needs its values. The first consumer to reach one
// starts pulling it into a replay buffer the Result owns; each consumer then
// reads a fresh stream or iterable fed from that buffer. The original is
// cancelled when the Result's cache signal aborts, as the serializer does.

export type ReplayEntry = {+value: mixed, +done: boolean};

// Replay status
export const REPLAY_OPEN = 0;
export const REPLAY_CLOSED = 1;
export const REPLAY_ERRORED = 2;

export type Replay = {
  entries: Array<ReplayEntry>,
  status: 0 | 1 | 2,
  error: mixed,
  // Streams: BYOB on the original. Async iterables: the original was its own
  // iterator, so single-shot.
  isByteStream: boolean,
  isIterator: boolean,
  listeners: null | Array<() => void>,
};

function createReplay(isByteStream: boolean, isIterator: boolean): Replay {
  return {
    entries: [],
    status: REPLAY_OPEN,
    error: undefined,
    isByteStream,
    isIterator,
    listeners: null,
  };
}

function notifyReplay(replay: Replay): void {
  const listeners = replay.listeners;
  if (listeners !== null) {
    replay.listeners = null;
    for (let i = 0; i < listeners.length; i++) {
      listeners[i]();
    }
  }
}

// Calls back once the replay has moved past `index`: a new entry, a close or
// an error.
export function waitForReplay(
  replay: Replay,
  index: number,
  listener: () => void,
): void {
  if (index < replay.entries.length || replay.status !== REPLAY_OPEN) {
    listener();
    return;
  }
  let listeners = replay.listeners;
  if (listeners === null) {
    replay.listeners = listeners = [];
  }
  listeners.push(listener);
}

function pushReplayEntry(replay: Replay, value: mixed, done: boolean): void {
  if (replay.status !== REPLAY_OPEN) {
    return;
  }
  replay.entries.push({value, done});
  if (done) {
    replay.status = REPLAY_CLOSED;
  }
  notifyReplay(replay);
}

function errorReplay(replay: Replay, error: mixed): void {
  if (replay.status !== REPLAY_OPEN) {
    return;
  }
  replay.status = REPLAY_ERRORED;
  replay.error = error;
  notifyReplay(replay);
}

export function getStreamReplay(
  result: Result<any>,
  stream: ReadableStream,
): Replay {
  let replays = result.replays;
  if (replays === null) {
    result.replays = replays = new WeakMap();
  }
  const existing = replays.get(stream);
  if (existing !== undefined) {
    return existing;
  }
  // A BYOB stream reads as bytes on the other side, and the chunks may be
  // split or merged, unlike a stream that happens to carry Uint8Arrays.
  // $FlowFixMe[prop-missing]: This is a Node.js extension.
  let supportsBYOB: void | boolean = stream.supportsBYOB;
  if (supportsBYOB === undefined) {
    try {
      // $FlowFixMe[extra-arg]: This argument is accepted.
      stream.getReader({mode: 'byob'}).releaseLock();
      supportsBYOB = true;
    } catch (x) {
      supportsBYOB = false;
    }
  }
  const replay = createReplay(supportsBYOB === true, false);
  replays.set(stream, replay);
  const reader = stream.getReader();
  const signal = result.context.cacheController.signal;
  function progress(entry: {done: boolean, value: mixed, ...}) {
    if (replay.status !== REPLAY_OPEN) {
      return;
    }
    pushReplayEntry(replay, entry.value, entry.done);
    if (entry.done) {
      signal.removeEventListener('abort', abortStream);
    } else {
      reader.read().then(progress, error);
    }
  }
  function error(reason: mixed) {
    if (replay.status !== REPLAY_OPEN) {
      return;
    }
    signal.removeEventListener('abort', abortStream);
    errorReplay(replay, reason);
    reader.cancel(reason as any).then(noop, noop);
  }
  function abortStream() {
    error(signal.reason);
  }
  signal.addEventListener('abort', abortStream);
  reader.read().then(progress, error);
  return replay;
}

export function getAsyncIterableReplay(
  result: Result<any>,
  iterable: Object,
  getAsyncIterator: () => $AsyncIterator<any, any, any>,
): Replay {
  let replays = result.replays;
  if (replays === null) {
    result.replays = replays = new WeakMap();
  }
  const existing = replays.get(iterable);
  if (existing !== undefined) {
    return existing;
  }
  const iterator = getAsyncIterator.call(iterable);
  const replay = createReplay(false, iterator === iterable);
  replays.set(iterable, replay);
  const signal = result.context.cacheController.signal;
  function progress(
    entry: {done: false, +value: mixed, ...} | {done: true, +value: mixed, ...},
  ) {
    if (replay.status !== REPLAY_OPEN) {
      return;
    }
    pushReplayEntry(replay, entry.value, entry.done);
    if (entry.done) {
      signal.removeEventListener('abort', abortIterable);
    } else {
      iterator.next().then(progress, error);
    }
  }
  function error(reason: mixed) {
    if (replay.status !== REPLAY_OPEN) {
      return;
    }
    signal.removeEventListener('abort', abortIterable);
    errorReplay(replay, reason);
    if (typeof (iterator as any).throw === 'function') {
      // $FlowFixMe[prop-missing] should be able to pass mixed
      iterator.throw(reason).then(noop, noop);
    }
  }
  function abortIterable() {
    error(signal.reason);
  }
  signal.addEventListener('abort', abortIterable);
  iterator.next().then(progress, error);
  return replay;
}

// A fresh ReadableStream over the replay. `read` maps each chunk for the
// consumer; the serializer passes values through, a reader reads them. A
// chunk that fails to read errors the stream, as a row that fails to
// serialize errors it on the wire.
export function createReplayReadableStream(
  replay: Replay,
  read: (value: mixed) => mixed,
): ReadableStream {
  let index = 0;
  function pull(controller: any): Promise<void> {
    return new Promise(resolve => {
      waitForReplay(replay, index, () => {
        if (index < replay.entries.length) {
          const entry = replay.entries[index++];
          if (entry.done) {
            controller.close();
          } else {
            let chunk;
            try {
              chunk = read(entry.value);
              if (replay.isByteStream) {
                // Enqueuing into a byte stream detaches the buffer, and the
                // other consumers hold the same view.
                const view: $ArrayBufferView = chunk as any;
                chunk = new Uint8Array(
                  view.buffer.slice(
                    view.byteOffset,
                    view.byteOffset + view.byteLength,
                  ),
                );
              }
            } catch (error) {
              if (isThenable(error)) {
                // The chunk waits on something, like a loading module.
                index--;
                (error as any).then(resolve, resolve);
                return;
              }
              controller.error(error);
              resolve();
              return;
            }
            controller.enqueue(chunk);
          }
        } else if (replay.status === REPLAY_ERRORED) {
          controller.error(replay.error);
        } else {
          controller.close();
        }
        resolve();
      });
    });
  }
  if (replay.isByteStream) {
    // $FlowFixMe[incompatible-call]
    return new ReadableStream({type: 'bytes', pull});
  }
  return new ReadableStream({pull});
}

function asyncIterator(this: $AsyncIterator<any, any, void>) {
  return this;
}

function isThenable(value: mixed): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as any).then === 'function'
  );
}

// Whether an iterator is its own iterable, like a generator object, and so
// single-shot.
export function isSelfIterator(iterator: any): boolean {
  if (typeof iterator.next !== 'function') {
    return false;
  }
  const iteratorFn =
    typeof Symbol === 'function' ? iterator[Symbol.iterator] : undefined;
  return (
    typeof iteratorFn === 'function' && iteratorFn.call(iterator) === iterator
  );
}

// A fresh async iterable over the replay, or an iterator when the original
// was its own iterator and so single-shot. In the return position of a
// Server Component the serializer treats an iterator as multi-shot, which
// `asIterable` mirrors.
export function createReplayAsyncIterable(
  replay: Replay,
  read: (value: mixed) => mixed,
  asIterable: boolean = false,
): $AsyncIterable<any, any, void> {
  const iterable: any = {};
  iterable[Symbol.asyncIterator] = () => {
    let index = 0;
    // An entry that fails to read errors this iteration from then on.
    let readError = null;
    const iterator: any = {
      next(arg: void): Promise<IteratorResult<any, any>> {
        if (arg !== undefined) {
          throw new Error(
            'Values cannot be passed to next() of AsyncIterables passed to Client Components.',
          );
        }
        return new Promise((resolve, reject) => {
          if (readError !== null) {
            reject(readError.error);
            return;
          }
          waitForReplay(replay, index, () => {
            if (index < replay.entries.length) {
              const entry = replay.entries[index++];
              let value;
              try {
                value = read(entry.value);
              } catch (error) {
                if (isThenable(error)) {
                  // The value waits on something, like a loading module.
                  index--;
                  const retry = () => iterator.next().then(resolve, reject);
                  (error as any).then(retry, retry);
                  return;
                }
                readError = {error};
                reject(error);
                return;
              }
              resolve({done: entry.done, value} as any);
            } else if (replay.status === REPLAY_ERRORED) {
              reject(replay.error);
            } else {
              resolve({done: true, value: undefined});
            }
          });
        });
      },
    };
    iterator[Symbol.asyncIterator] = asyncIterator;
    return iterator;
  };
  return replay.isIterator && !asIterable
    ? iterable[Symbol.asyncIterator]()
    : iterable;
}
