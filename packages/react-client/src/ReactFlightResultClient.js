/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Thenable, ReactKey} from 'shared/ReactTypes';
import type {
  CallServerCallback,
  EncodeFormActionCallback,
} from './ReactFlightReplyClient';
import type {TemporaryReferenceSet} from './ReactFlightTemporaryReferences';
import type {LazyComponent} from 'react/src/ReactLazy';
import type {Result, Expansion} from 'shared/ReactFlightResult';
import type {
  ClientReference,
  ClientReferenceMetadata,
  ServerConsumerModuleMap,
  ModuleLoading,
} from './ReactFlightClientConfig';

import {
  resolveClientReference,
  preloadModule,
  requireModule,
  dispatchHint,
  prepareDestinationForModule,
} from './ReactFlightClientConfig';

import {
  PENDING as EXPANSION_PENDING,
  FULFILLED as EXPANSION_FULFILLED,
  retainResult,
  releaseResult,
  subscribeToAbort,
  markPureData,
  isPureData,
} from 'shared/ReactFlightResult';
import {subscribeToHints} from 'shared/ReactFlightRenderContext';
import {createBoundServerReference} from './ReactFlightReplyClient';
import {readTemporaryReference} from './ReactFlightTemporaryReferences';

import {
  REACT_ELEMENT_TYPE,
  REACT_FRAGMENT_TYPE,
  REACT_LAZY_TYPE,
  REACT_MEMO_TYPE,
  REACT_FORWARD_REF_TYPE,
  REACT_OPTIMISTIC_KEY,
  ASYNC_ITERATOR,
  getIteratorFn,
} from 'shared/ReactSymbols';
import isArray from 'shared/isArray';
import getPrototypeOf from 'shared/getPrototypeOf';
import {describeObjectForErrorMessage} from 'shared/ReactSerializationErrors';
import {
  getIteratorEntries,
  getStreamReplay,
  getAsyncIterableReplay,
  createReplayReadableStream,
  createReplayAsyncIterable,
  isSelfIterator,
} from 'shared/ReactFlightResult';

const ObjectPrototype = Object.prototype;

// Reads a Result in process, for the renderer that consumes the Server
// Component output on the same server, e.g. Fizz for the HTML of a page.
// The model is walked once. Server Components are replaced by their expansion
// from the Result's ledger, Client References are resolved through the
// consumer's module map, and everything else is returned as is: the data is
// already in this process, so unlike the wire path nothing is copied unless
// something inside it changed.

// What the bundler's server config knows about the references in the model.
// The server render that produced the Result used the same config.
export type ReferenceBundler = {
  resolveClientReferenceMetadata: (reference: any) => ClientReferenceMetadata,
  isServerReference: (reference: any) => boolean,
  getServerReferenceId: (reference: any) => string,
  getServerReferenceBoundArguments: (reference: any) => null | Array<any>,
  resolveTemporaryReference: (value: any) => void | string,
};

export type ResultResponse = {
  _result: Result<any>,
  _bundlerConfig: ServerConsumerModuleMap,
  _moduleLoading: ModuleLoading,
  _nonce: ?string,
  _bundler: ReferenceBundler,
  _callServer: CallServerCallback,
  _encodeFormAction: void | EncodeFormActionCallback,
  _temporaryReferences: void | TemporaryReferenceSet,
  // Server Reference → the proxy handed out for it, created once.
  _serverReferences: Map<any, any>,
  // Runs a callback in the async context the consumer was created in, so
  // resource hints reach the renderer consuming this Result even when another
  // consumer's expansion emitted them.
  _bindToConsumer: null | (<R>(callback: () => R) => R),
  // Server object → what the consumer gets for it, when that is a different
  // object. Pure data is returned as is and not recorded: a page can hold
  // tens of thousands of plain objects.
  _models: Map<any, any>,
  // Containers being read, outermost first, to close cycles.
  _visiting: Array<Object>,
  // Containers read so far, to recognize a large one worth recording.
  _visits: number,
  // Whether the object the last read returned is pure data (see
  // Result.pureData). A read that returns an object as is after reading
  // inside it must set this for that object, not leave what the inner read
  // set.
  _childPure: boolean,
  // Client Reference id → the module it resolved to, or the chunk loading it.
  _modules: Map<string, any>,
  _onError: (error: mixed) => ?string,
  // The first invalid value met while reading the current element's props.
  // The wire reports every invalid value in a row and fails the row once;
  // siblings keep being read and the element fails after.
  _readError: null | Error,
  // Errors this reader already reported and shaped for the consumer.
  _consumerErrors: WeakSet<Error>,
  // Chunks waiting on something, to reject when the Result is aborted.
  _pendingChunks: Set<SomeChunk<any>>,
  _closed: boolean,
  _cleanup: Array<() => void>,
};

// Chunk status
const PENDING = 'pending';
const FULFILLED = 'fulfilled';
const REJECTED = 'rejected';

// A thenable with a readable status, as React's use() expects and as the
// Flight client hands out for pending values.
function ResultChunk(this: any, status: string, value: any, reason: any) {
  this.status = status;
  this.value = value;
  this.reason = reason;
  this._listeners = null;
  this._deferred = null;
}
// $FlowFixMe[prop-missing]
ResultChunk.prototype = Object.create(Promise.prototype) as any;
function resultChunkThen(
  this: any,
  resolve: (value: any) => mixed,
  reject: (reason: mixed) => mixed,
) {
  switch (this.status) {
    case FULFILLED:
      if (typeof resolve === 'function') {
        resolve(this.value);
      }
      break;
    case REJECTED:
      if (typeof reject === 'function') {
        reject(this.reason);
      }
      break;
    default: {
      if (this._deferred !== null) {
        initializeDeferredChunk(this);
        resultChunkThen.call(this, resolve, reject);
        return;
      }
      let listeners = this._listeners;
      if (listeners === null) {
        this._listeners = listeners = [];
      }
      listeners.push([resolve, reject]);
    }
  }
}
// Promise.prototype.then may be non-writable, so define rather than assign.
Object.defineProperty(ResultChunk.prototype, 'then', {
  writable: true,
  enumerable: true,
  configurable: true,
  value: resultChunkThen,
});

type SomeChunk<T> = {
  status: 'pending' | 'fulfilled' | 'rejected',
  value: T,
  reason: mixed,
  _listeners: null | Array<[(value: T) => mixed, (reason: mixed) => mixed]>,
  // Settles the chunk, run on first read. A value that arrives when no one
  // is waiting is read then, as the wire client parses a row when it is
  // first read, so a subtree the consumer never renders loads nothing.
  _deferred: null | (() => void),
  then(resolve: (value: T) => mixed, reject: (reason: mixed) => mixed): void,
};

function createPendingChunk(response: ResultResponse): SomeChunk<any> {
  // $FlowFixMe[invalid-constructor]
  const chunk = new ResultChunk(PENDING, undefined, undefined);
  response._pendingChunks.add(chunk);
  return chunk;
}

function createRejectedChunk(reason: mixed): SomeChunk<any> {
  // $FlowFixMe[invalid-constructor]
  return new ResultChunk(REJECTED, undefined, reason);
}

function fulfillChunk<T>(
  response: ResultResponse,
  chunk: SomeChunk<T>,
  value: T,
): void {
  if (chunk.status !== PENDING) {
    return;
  }
  response._pendingChunks.delete(chunk);
  chunk.status = FULFILLED;
  chunk.value = value;
  const listeners = chunk._listeners;
  if (listeners !== null) {
    chunk._listeners = null;
    for (let i = 0; i < listeners.length; i++) {
      const resolve = listeners[i][0];
      if (typeof resolve === 'function') {
        resolve(value);
      }
    }
  }
}

function rejectChunk<T>(
  response: ResultResponse,
  chunk: SomeChunk<T>,
  reason: mixed,
): void {
  if (chunk.status !== PENDING) {
    return;
  }
  response._pendingChunks.delete(chunk);
  chunk.status = REJECTED;
  chunk.reason = reason;
  const listeners = chunk._listeners;
  if (listeners !== null) {
    chunk._listeners = null;
    for (let i = 0; i < listeners.length; i++) {
      const reject = listeners[i][1];
      if (typeof reject === 'function') {
        reject(reason);
      }
    }
  }
}

function readChunk<T>(chunk: SomeChunk<T>): T {
  switch (chunk.status) {
    case FULFILLED:
      return chunk.value;
    case REJECTED:
      throw chunk.reason;
    default:
      if (chunk._deferred !== null) {
        initializeDeferredChunk(chunk);
        return readChunk(chunk);
      }
      throw chunk;
  }
}

function initializeDeferredChunk<T>(chunk: SomeChunk<T>): void {
  const deferred = chunk._deferred;
  if (deferred !== null) {
    chunk._deferred = null;
    deferred();
  }
}

// Settles a pending chunk with what `read` produces. Read now if something
// waits on the chunk, otherwise when it is first read.
function settleChunk<T>(
  response: ResultResponse,
  chunk: SomeChunk<T>,
  read: () => T,
): void {
  if (chunk.status !== PENDING || chunk._deferred !== null) {
    return;
  }
  const settle = () => {
    let value;
    try {
      value = read();
    } catch (error) {
      rejectChunk(response, chunk, readError(response, error));
      return;
    }
    fulfillChunk(response, chunk, value);
  };
  if (chunk._listeners !== null) {
    settle();
    return;
  }
  // No longer rejected by an abort: its value is here.
  response._pendingChunks.delete(chunk);
  chunk._deferred = settle;
}

function createLazyChunkWrapper<T>(
  chunk: SomeChunk<T>,
): LazyComponent<T, SomeChunk<T>> {
  const lazyType: LazyComponent<T, SomeChunk<T>> = {
    $$typeof: REACT_LAZY_TYPE,
    _payload: chunk,
    _init: readChunk,
  };
  if (__DEV__) {
    // Key validation already happened where the element was created.
    lazyType._store = {validated: 1};
  }
  return lazyType;
}

// The error the wire path would have produced for a Server Component error:
// the digest travels, the message only in development.
function createConsumerError(response: ResultResponse, reason: mixed): Error {
  let error: Error;
  if (__DEV__) {
    if (reason instanceof Error) {
      // eslint-disable-next-line react-internal/prod-error-codes
      error = new Error(reason.message);
      error.name = reason.name;
      error.stack = reason.stack;
    } else {
      // eslint-disable-next-line react-internal/prod-error-codes, react-internal/safe-string-coercion
      error = new Error(String(reason));
    }
  } else {
    error = new Error(
      'An error occurred in the Server Components render. The specific message is omitted in production' +
        ' builds to avoid leaking sensitive details. A digest property is included on this error instance which' +
        ' may provide additional details about the nature of the error.',
    );
    error.stack = 'Error: ' + error.message;
  }
  return error;
}

function errorWithDigest(error: Error, digest: ?string): Error {
  (error as any).digest = digest;
  return error;
}

function isThenable(value: mixed): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as any).then === 'function'
  );
}

// An error raised while reading, such as an invalid value. The wire would
// have reported it through onError and sent its digest.
function readError(response: ResultResponse, error: mixed): Error {
  if (error instanceof Error && response._consumerErrors.has(error)) {
    return error;
  }
  const consumerError = errorWithDigest(
    createConsumerError(response, error),
    logConsumerError(response, error),
  );
  response._consumerErrors.add(consumerError);
  return consumerError;
}

// Reads one value inside a container. An invalid value is recorded for the
// enclosing element and reading continues with its siblings.
function readChild(
  response: ResultResponse,
  value: any,
  context: KeyContext,
  parent: Object,
  parentPropertyName: string,
): any {
  try {
    return readData(response, value, context, parent, parentPropertyName);
  } catch (thrown) {
    if (isThenable(thrown)) {
      throw thrown;
    }
    const error = readError(response, thrown);
    if (response._readError === null) {
      response._readError = error;
    }
    return undefined;
  }
}

// Deeper than a cycle-free model is expected to nest. From here on each
// container is checked against the ones being read.
const CYCLE_CHECK_DEPTH = 64;
// A container whose read visited this many containers is recorded even when
// returned as is, so a second reference to it does not read it again.
const LARGE_CONTAINER_VISITS = 32;

// Starts reading a container. When it is already being read, returns what
// the inner reference resolves to: the consumer's copy, as on the wire,
// since a value that holds itself cannot be returned as is.
function enterContainer(
  response: ResultResponse,
  container: Object,
  createCopy: () => any,
): any {
  const visiting = response._visiting;
  response._visits++;
  if (
    visiting.length >= CYCLE_CHECK_DEPTH &&
    visiting.indexOf(container) !== -1
  ) {
    return copyOf(response, container, createCopy);
  }
  visiting.push(container);
  return null;
}

// The copy the consumer gets for a container, created on first use so an
// inner cycle and the outer read that finds a changed value share it.
function copyOf(
  response: ResultResponse,
  container: Object,
  createCopy: () => any,
): any {
  const models = response._models;
  let copy = models.get(container);
  if (copy === undefined) {
    copy = createCopy();
    models.set(container, copy);
  }
  return copy;
}

function exitContainer(
  response: ResultResponse,
  container: Object,
  visitsBefore: number,
  read: any,
  pure: boolean,
): any {
  response._visiting.pop();
  if (read === container) {
    if (response._visits - visitsBefore >= LARGE_CONTAINER_VISITS) {
      response._models.set(container, container);
      if (pure) {
        markPureData(response._result, container);
      }
    }
    response._childPure = pure;
  } else {
    response._childPure = false;
  }
  return read;
}

// Whether a value JSON-encodes exactly as Flight would encode it. Containers
// report through response._childPure after they are read.
function isPureLeaf(response: ResultResponse, child: any, read: any): boolean {
  if (read !== child) {
    return false;
  }
  switch (typeof child) {
    case 'string':
      return child.charCodeAt(0) !== 36; // '$'
    case 'number':
      return isFinite(child) && (child !== 0 || 1 / child > 0);
    case 'boolean':
      return true;
    case 'object':
      return child === null || response._childPure;
    default:
      return false;
  }
}

// Fails the element being read if any value inside it was invalid.
function throwReadError(response: ResultResponse, prevError: null | Error) {
  const error = response._readError;
  response._readError = prevError;
  if (error !== null) {
    throw error;
  }
}

// Key context, mirroring the serializer: the keys of enclosing Server
// Components prefix the key of the terminal they render to.
type KeyContext = {+keyPath: ReactKey, +implicitSlot: boolean};
const rootKeyContext: KeyContext = {keyPath: null, implicitSlot: false};

function enterServerComponent(context: KeyContext, key: ReactKey): KeyContext {
  if (key !== null) {
    if (
      key === REACT_OPTIMISTIC_KEY ||
      context.keyPath === REACT_OPTIMISTIC_KEY
    ) {
      return {
        keyPath: REACT_OPTIMISTIC_KEY,
        implicitSlot: context.implicitSlot,
      };
    }
    return {
      keyPath:
        context.keyPath === null ? key : context.keyPath + ',' + (key as any),
      implicitSlot: context.implicitSlot,
    };
  }
  if (context.keyPath === null && !context.implicitSlot) {
    return {keyPath: null, implicitSlot: true};
  }
  return context;
}

function terminalKey(context: KeyContext, key: ReactKey): ReactKey {
  const keyPath = context.keyPath;
  if (key === null) {
    return keyPath;
  }
  if (keyPath === null) {
    return key;
  }
  if (keyPath === REACT_OPTIMISTIC_KEY || key === REACT_OPTIMISTIC_KEY) {
    return REACT_OPTIMISTIC_KEY;
  }
  return keyPath + ',' + (key as any);
}

function createElement(type: any, key: ReactKey, props: any): any {
  let element: any;
  if (__DEV__) {
    element = {
      $$typeof: REACT_ELEMENT_TYPE,
      type,
      key,
      props,
      _owner: null,
    } as any;
    Object.defineProperty(element, 'ref', {
      enumerable: false,
      get: nullRefGetter,
    });
    element._store = {} as {validated?: number};
    Object.defineProperty(element._store, 'validated', {
      configurable: false,
      enumerable: false,
      writable: true,
      value: 1,
    });
    Object.defineProperty(element, '_debugInfo', {
      configurable: false,
      enumerable: false,
      writable: true,
      value: null,
    });
    Object.defineProperty(element, '_debugStack', {
      configurable: false,
      enumerable: false,
      writable: true,
      value: null,
    });
    Object.defineProperty(element, '_debugTask', {
      configurable: false,
      enumerable: false,
      writable: true,
      value: null,
    });
  } else {
    element = {
      $$typeof: REACT_ELEMENT_TYPE,
      type,
      key,
      ref: null,
      props,
    };
  }
  return element;
}

function nullRefGetter() {
  if (__DEV__) {
    return null;
  }
}

// Reads a value in a position that may hold React nodes. `context` applies to
// a terminal rendered directly here; `descendContext` is what the children
// and props of that terminal see, as the serializer restores the enclosing
// context once a terminal is emitted.
function readNode(
  response: ResultResponse,
  value: any,
  context: KeyContext,
  descendContext: KeyContext,
  parent: Object,
  parentPropertyName: string,
): any {
  if (value === null || typeof value !== 'object') {
    return readData(
      response,
      value,
      descendContext,
      parent,
      parentPropertyName,
    );
  }
  response._childPure = false;
  const models = response._models;
  // Like the serializer, an element is only reused by identity outside any
  // Server Component key context, since the context changes what it reads as.
  const reusable = context.keyPath === null && !context.implicitSlot;
  if (reusable) {
    const existing = models.get(value);
    if (existing !== undefined) {
      return existing;
    }
  }
  switch (value.$$typeof) {
    case REACT_ELEMENT_TYPE: {
      const read = readElement(response, value, context, descendContext);
      if (reusable) {
        models.set(value, read);
      }
      return read;
    }
    case REACT_LAZY_TYPE: {
      const read = readLazy(response, value, context, descendContext);
      if (reusable) {
        models.set(value, read);
      }
      return read;
    }
  }
  if (isArray(value)) {
    return readFragment(response, value, context, descendContext);
  }
  if (
    // A Client Reference proxy throws on reading a Symbol, so it is
    // recognized before the iterator probe, as the serializer does.
    !response._result.isClientReference(value) &&
    typeof value[ASYNC_ITERATOR] === 'function' &&
    !(typeof ReadableStream === 'function' && value instanceof ReadableStream)
  ) {
    return readAsyncFragment(response, value, context, descendContext);
  }
  return readData(response, value, descendContext, parent, parentPropertyName);
}

// An async iterable in a node position is a fragment, keyed like an array.
function readAsyncFragment(
  response: ResultResponse,
  iterable: Object,
  context: KeyContext,
  descendContext: KeyContext,
): any {
  const replayed = readAsyncIterable(
    response,
    iterable,
    value => readStreamedNode(response, value, descendContext),
    false,
  );
  if (context.keyPath !== null) {
    const fragment = createElement(REACT_FRAGMENT_TYPE, context.keyPath, {
      children: replayed,
    });
    return context.implicitSlot ? [fragment] : fragment;
  }
  return replayed;
}

// Each value a stream or async iterable yields is its own row on the wire,
// so it is read like one: an element at its root that fails synchronously
// or an invalid value inside it fails the value itself, and with it the
// stream, rather than becoming a lazy error.
function readStreamedValue(
  response: ResultResponse,
  value: any,
  read: () => mixed,
): mixed {
  const prevReadError = response._readError;
  response._readError = null;
  let result;
  try {
    result = read();
    throwReadError(response, prevReadError);
  } catch (thrown) {
    response._readError = prevReadError;
    if (isThenable(thrown)) {
      throw thrown;
    }
    throw readError(response, thrown);
  }
  return result;
}

function readStreamedNode(
  response: ResultResponse,
  value: any,
  context: KeyContext,
): mixed {
  return readStreamedValue(response, value, () =>
    value !== null &&
    typeof value === 'object' &&
    value.$$typeof === REACT_ELEMENT_TYPE
      ? readElementImpl(response, value, context, context)
      : readNode(response, value, context, context, {}, ''),
  );
}

function readAsyncIterable(
  response: ResultResponse,
  iterable: Object,
  read: (value: mixed) => mixed,
  asIterable: boolean,
): any {
  const models = response._models;
  const existing = models.get(iterable);
  if (existing !== undefined) {
    return existing;
  }
  const replay = getAsyncIterableReplay(
    response._result,
    iterable,
    iterable[ASYNC_ITERATOR],
  );
  const replayed = createReplayAsyncIterable(replay, read, asIterable);
  models.set(iterable, replayed);
  return replayed;
}

function readFragment(
  response: ResultResponse,
  children: Array<any>,
  context: KeyContext,
  descendContext: KeyContext,
): any {
  if (context.keyPath !== null) {
    const fragment = createElement(REACT_FRAGMENT_TYPE, context.keyPath, {
      children: readArray(response, children, descendContext),
    });
    return context.implicitSlot ? [fragment] : fragment;
  }
  return readArray(response, children, descendContext);
}

function createArrayCopy(): Array<any> {
  return [];
}

function readArray(
  response: ResultResponse,
  array: Array<any>,
  context: KeyContext,
): Array<any> {
  const existing = response._models.get(array);
  if (existing !== undefined) {
    response._childPure =
      existing === array && isPureData(response._result, array);
    return existing;
  }
  const visitsBefore = response._visits;
  const cycle = enterContainer(response, array, createArrayCopy);
  if (cycle !== null) {
    return cycle;
  }
  let copy: null | Array<any> = null;
  let pure = true;
  try {
    for (let i = 0; i < array.length; i++) {
      const child = array[i];
      let read;
      try {
        read = readNode(response, child, context, context, array, '' + i);
      } catch (thrown) {
        if (isThenable(thrown)) {
          throw thrown;
        }
        const error = readError(response, thrown);
        if (response._readError === null) {
          response._readError = error;
        }
        read = undefined;
      }
      if (pure && (!(i in array) || !isPureLeaf(response, child, read))) {
        pure = false;
      }
      if (copy === null) {
        if (read === child) {
          continue;
        }
        copy = copyOf(response, array, createArrayCopy);
        for (let j = 0; j < i; j++) {
          copy[j] = array[j];
        }
      }
      copy[i] = read;
    }
  } catch (thrown) {
    response._visiting.pop();
    throw thrown;
  }
  return exitContainer(
    response,
    array,
    visitsBefore,
    copy === null ? array : copy,
    pure,
  );
}

function readLazy(
  response: ResultResponse,
  lazy: LazyComponent<any, any>,
  context: KeyContext,
  descendContext: KeyContext,
): any {
  let resolved;
  try {
    const payload = lazy._payload;
    const init = lazy._init;
    resolved = init(payload);
  } catch (thrown) {
    if (
      thrown !== null &&
      typeof thrown === 'object' &&
      typeof thrown.then === 'function'
    ) {
      const chunk = createPendingChunk(response);
      thrown.then(
        () =>
          // Read the lazy itself again, not through readNode: the memo holds
          // the wrapper being returned below for it, which would make the
          // chunk resolve to a lazy for itself.
          settleChunk(response, chunk, () =>
            readLazy(response, lazy, context, descendContext),
          ),
        (reason: mixed) =>
          rejectChunk(response, chunk, readError(response, reason)),
      );
      return createLazyChunkWrapper(chunk);
    }
    throw thrown;
  }
  return readNode(response, resolved, context, descendContext, lazy, '');
}

// Like the wire, where a row that fails to decode makes its innermost element
// a lazy that throws, an element whose own props cannot be read becomes a
// lazy error, and one that waits on something, a pending lazy type or a
// loading module, becomes a lazy that reads again once it settles.
function readElement(
  response: ResultResponse,
  element: any,
  context: KeyContext,
  descendContext: KeyContext,
): any {
  try {
    return readElementImpl(response, element, context, descendContext);
  } catch (thrown) {
    if (isThenable(thrown)) {
      const chunk = createPendingChunk(response);
      (thrown as any).then(
        () =>
          settleChunk(response, chunk, () =>
            readElement(response, element, context, descendContext),
          ),
        (reason: mixed) =>
          rejectChunk(response, chunk, readError(response, reason)),
      );
      return createLazyChunkWrapper(chunk);
    }
    return createLazyChunkWrapper(
      createRejectedChunk(readError(response, thrown)),
    );
  }
}

function readElementImpl(
  response: ResultResponse,
  element: any,
  context: KeyContext,
  descendContext: KeyContext,
): any {
  const expansion = response._result.expand(element);
  if (expansion !== null) {
    return readExpansion(
      response,
      expansion,
      enterServerComponent(context, element.key),
      descendContext,
    );
  }
  return readTerminalElement(response, element, context, descendContext);
}

function readExpansion(
  response: ResultResponse,
  expansion: Expansion,
  context: KeyContext,
  descendContext: KeyContext,
): any {
  switch (expansion.status) {
    case EXPANSION_FULFILLED:
      return readServerComponentOutput(
        response,
        expansion.value,
        context,
        descendContext,
      );
    case EXPANSION_PENDING: {
      const chunk = createPendingChunk(response);
      expansion.then(
        (value: mixed) =>
          settleChunk(response, chunk, () =>
            readServerComponentOutput(response, value, context, descendContext),
          ),
        (reason: mixed) => {
          rejectChunk(
            response,
            chunk,
            errorWithDigest(
              createConsumerError(response, reason),
              expansion.digest,
            ),
          );
        },
      );
      return createLazyChunkWrapper(chunk);
    }
    default:
      return createLazyChunkWrapper(
        createRejectedChunk(
          errorWithDigest(
            createConsumerError(response, expansion.reason),
            expansion.digest,
          ),
        ),
      );
  }
}

// The return position of a Server Component has the same special cases as
// processServerComponentReturnValue on the serializer.
function readServerComponentOutput(
  response: ResultResponse,
  output: any,
  context: KeyContext,
  descendContext: KeyContext,
): any {
  if (output === null || typeof output !== 'object') {
    return output;
  }
  if (__DEV__) {
    if (output.$$typeof === REACT_ELEMENT_TYPE && output._store) {
      // The return position of a component is a static position, so the
      // element needs no key even if a consumer ends up placing it in a
      // list. The serializer marks it the same way.
      output._store.validated = 1;
    }
  }
  if (
    typeof output.then === 'function' &&
    !response._result.isClientReference(output)
  ) {
    const thenable: Thenable<any> = output;
    if (thenable.status === 'fulfilled') {
      return readServerComponentOutput(
        response,
        thenable.value,
        context,
        descendContext,
      );
    }
    const chunk = createPendingChunk(response);
    thenable.then(
      (value: mixed) =>
        settleChunk(response, chunk, () =>
          readServerComponentOutput(response, value, context, descendContext),
        ),
      (reason: mixed) => {
        rejectChunk(
          response,
          chunk,
          errorWithDigest(
            createConsumerError(response, reason),
            logConsumerError(response, reason),
          ),
        );
      },
    );
    return createLazyChunkWrapper(chunk);
  }
  const iteratorFn = getIteratorFn(output);
  if (iteratorFn && !isArray(output)) {
    // An iterator in return position renders as its items, drained into the
    // Result once since the serializer reads them too.
    const iterator = iteratorFn.call(output);
    return readFragment(
      response,
      // $FlowFixMe[invalid-compare]
      iterator === output
        ? getIteratorEntries(response._result, iterator)
        : Array.from(iterator as any),
      context,
      descendContext,
    );
  }
  if (
    typeof output[ASYNC_ITERATOR] === 'function' &&
    !(typeof ReadableStream === 'function' && output instanceof ReadableStream)
  ) {
    // An async iterator in return position is treated as multi-shot.
    const replayed = readAsyncIterable(
      response,
      output,
      value => readStreamedNode(response, value, descendContext),
      true,
    );
    if (context.keyPath !== null) {
      const fragment = createElement(REACT_FRAGMENT_TYPE, context.keyPath, {
        children: replayed,
      });
      return context.implicitSlot ? [fragment] : fragment;
    }
    return replayed;
  }
  return readNode(response, output, context, descendContext, {}, '');
}

function readTerminalElement(
  response: ResultResponse,
  element: any,
  context: KeyContext,
  descendContext: KeyContext,
): any {
  const result = response._result;
  let type = element.type;
  if (type === REACT_FRAGMENT_TYPE && element.key === null) {
    // Keyless fragments are not emitted; their children take the slot.
    const childContext =
      context.keyPath === null && !context.implicitSlot
        ? {keyPath: null, implicitSlot: true}
        : context;
    return readNode(
      response,
      element.props.children,
      childContext,
      descendContext,
      element.props,
      'children',
    );
  }
  if (
    type !== null &&
    typeof type === 'object' &&
    !result.isClientReference(type)
  ) {
    switch (type.$$typeof) {
      case REACT_MEMO_TYPE:
        type = type.type;
        break;
      case REACT_FORWARD_REF_TYPE:
        type = type.render;
        break;
    }
  }
  const key = terminalKey(context, element.key);
  if (element.props.ref !== undefined && element.props.ref !== null) {
    throw new Error(
      'Refs cannot be used in Server Components, nor passed to Client Components.',
    );
  }
  const prevReadError = response._readError;
  response._readError = null;
  const props = readData(
    response,
    element.props,
    descendContext,
    element,
    'props',
  );
  throwReadError(response, prevReadError);
  if (result.isClientReference(type)) {
    return readClientReferenceElement(response, type, key, props, context);
  }
  let read;
  if (key === element.key && props === element.props && type === element.type) {
    // Nothing about the element changes for this consumer. Reading its props
    // set the pure-data flag for them; an element is not data.
    response._childPure = false;
    read = element;
  } else {
    read = createElement(type, key, props);
  }
  if (context.implicitSlot && key !== null) {
    return [read];
  }
  return read;
}

function readClientReferenceElement(
  response: ResultResponse,
  reference: any,
  key: ReactKey,
  props: any,
  context: KeyContext,
): any {
  // The type is a lazy that requires the module when the renderer first
  // reads it, as a client element's type is on the wire.
  const element = createElement(
    readClientReference(response, reference),
    key,
    props,
  );
  if (context.implicitSlot && key !== null) {
    return [element];
  }
  return element;
}

// A Server Reference becomes the same callable proxy the wire gives the
// client: it calls the server through callServer and carries the form action
// metadata. Bound arguments are read like any other value.
function readServerReference(
  response: ResultResponse,
  reference: any,
  context: KeyContext,
): any {
  const serverReferences = response._serverReferences;
  const existing = serverReferences.get(reference);
  if (existing !== undefined) {
    return existing;
  }
  const bundler = response._bundler;
  const id = bundler.getServerReferenceId(reference);
  const boundArgs = bundler.getServerReferenceBoundArguments(reference);
  const bound =
    boundArgs === null
      ? null
      : Promise.resolve(readArray(response, boundArgs, context));
  const proxy = createBoundServerReference<Array<any>, any>(
    {id, bound},
    response._callServer,
    response._encodeFormAction,
  );
  serverReferences.set(reference, proxy);
  return proxy;
}

// A value registered as a temporary reference on the server reads back as
// the value the consumer registered under that id, as on the wire.
function readTemporaryReferenceValue(
  response: ResultResponse,
  value: any,
): void | any {
  const id = response._bundler.resolveTemporaryReference(value);
  if (id === undefined) {
    return undefined;
  }
  const temporaryReferences = response._temporaryReferences;
  if (temporaryReferences === undefined) {
    throw new Error(
      'Missing a temporary reference set but the RSC response returned a temporary reference. ' +
        'Pass a temporaryReference option with the set that was used with the reply.',
    );
  }
  return readTemporaryReference(temporaryReferences, id);
}

// A Client Reference in a data position is its module export. While the
// module loads, the enclosing element waits, as the row would on the wire.
function readClientReferenceValue(response: ResultResponse, reference: any) {
  // Throws the chunk while the module loads, which makes the enclosing
  // element wait on it.
  return readChunk(readClientReference(response, reference)._payload);
}

// Resolves a server-side Client Reference to a lazy over the consumer's
// module export, required when first read, as the wire client requires a
// module when the first row that needs it is read. The same reference gives
// the same lazy, so an element type is stable across reads.
function readClientReference(
  response: ResultResponse,
  reference: any,
): LazyComponent<any, SomeChunk<any>> {
  const id: string = reference.$$id;
  const modules = response._modules;
  const existing = modules.get(id);
  if (existing !== undefined) {
    return existing;
  }
  const metadata = response._bundler.resolveClientReferenceMetadata(reference);
  const clientReference: ClientReference<any> = resolveClientReference(
    response._bundlerConfig,
    metadata,
  );
  const bind = response._bindToConsumer;
  if (bind !== null) {
    bind(() =>
      prepareDestinationForModule(
        response._moduleLoading,
        response._nonce,
        metadata,
      ),
    );
  } else {
    prepareDestinationForModule(
      response._moduleLoading,
      response._nonce,
      metadata,
    );
  }
  const chunk = createPendingChunk(response);
  const lazy = createLazyChunkWrapper(chunk);
  modules.set(id, lazy);
  const promise = preloadModule(clientReference);
  const require = () => requireModule(clientReference);
  if (promise) {
    promise.then(
      () => settleChunk(response, chunk, require),
      (reason: mixed) => rejectChunk(response, chunk, reason),
    );
  } else {
    settleChunk(response, chunk, require);
  }
  return lazy;
}

// Reads a value in a data position: props and anything inside them. Nodes
// inside data see the enclosing key context. The checks are the
// serializer's: what it rejects is rejected here, with the same message, so
// an invalid value fails this consumer as it fails the wire. `parent` and
// `parentPropertyName` only describe the location in that message.
function readData(
  response: ResultResponse,
  value: any,
  context: KeyContext,
  parent: Object,
  parentPropertyName: string,
): any {
  const result = response._result;
  if (value === null) {
    return null;
  }
  if (typeof value === 'object') {
    response._childPure = false;
    const models = response._models;
    const existing = models.get(value);
    if (existing !== undefined) {
      response._childPure =
        existing === value && isPureData(response._result, value);
      return existing;
    }
    switch (value.$$typeof) {
      case REACT_ELEMENT_TYPE: {
        const read = readElement(response, value, context, context);
        models.set(value, read);
        return read;
      }
      case REACT_LAZY_TYPE: {
        const read = readLazy(response, value, context, context);
        models.set(value, read);
        return read;
      }
    }
    if (result.isClientReference(value)) {
      return readClientReferenceValue(response, value);
    }
    const temporaryReference = readTemporaryReferenceValue(response, value);
    if (temporaryReference !== undefined) {
      return temporaryReference;
    }
    result.checkTainted(value);
    if (typeof value.then === 'function') {
      return readThenable(response, value, context);
    }
    const proto = getPrototypeOf(value);
    if (proto === ObjectPrototype) {
      // Nearly every value is a plain object; the built-ins are checked
      // only for the rest.
      const iteratorFn = getIteratorFn(value);
      if (iteratorFn) {
        return readIterable(response, value, iteratorFn, context);
      }
      if (typeof value[ASYNC_ITERATOR] === 'function') {
        return readAsyncIterableValue(response, value, context);
      }
      return readObject(response, value, context);
    }
    if (isArray(value)) {
      return readArray(response, value, context);
    }
    if (value instanceof Map) {
      return readMap(response, value, context);
    }
    if (value instanceof Set) {
      return readSet(response, value, context);
    }
    if (value instanceof Error) {
      // The wire carries no details about an Error value in production.
      const read = createConsumerError(response, value);
      models.set(value, read);
      return read;
    }
    if (
      value instanceof Date ||
      value instanceof ArrayBuffer ||
      ArrayBuffer.isView(value) ||
      (typeof Blob === 'function' && value instanceof Blob) ||
      (typeof FormData === 'function' && value instanceof FormData)
    ) {
      // The wire copies these; the copy is indistinguishable from the original.
      return value;
    }
    const iteratorFn = getIteratorFn(value);
    if (iteratorFn) {
      return readIterable(response, value, iteratorFn, context);
    }
    if (
      typeof ReadableStream === 'function' &&
      value instanceof ReadableStream
    ) {
      const replayed = createReplayReadableStream(
        getStreamReplay(result, value),
        chunk =>
          readStreamedValue(response, chunk, () =>
            readData(response, chunk, context, {}, ''),
          ),
      );
      models.set(value, replayed);
      return replayed;
    }
    if (typeof value[ASYNC_ITERATOR] === 'function') {
      return readAsyncIterableValue(response, value, context);
    }
    if (proto === null || getPrototypeOf(proto) !== null) {
      throw new Error(
        'Only plain objects, and a few built-ins, can be passed to Client Components ' +
          'from Server Components. Classes or null prototypes are not supported.' +
          describeObjectForErrorMessage(parent, parentPropertyName),
      );
    }
    return readObject(response, value, context);
  }
  if (typeof value === 'string') {
    result.checkTainted(value);
    return value;
  }
  if (typeof value === 'function') {
    if (result.isClientReference(value)) {
      return readClientReferenceValue(response, value);
    }
    if (response._bundler.isServerReference(value)) {
      return readServerReference(response, value, context);
    }
    const temporaryReference = readTemporaryReferenceValue(response, value);
    if (temporaryReference !== undefined) {
      return temporaryReference;
    }
    result.checkTainted(value);
    if (/^on[A-Z]/.test(parentPropertyName)) {
      throw new Error(
        'Event handlers cannot be passed to Client Component props.' +
          describeObjectForErrorMessage(parent, parentPropertyName) +
          '\nIf you need interactivity, consider converting part of this to a Client Component.',
      );
    }
    throw new Error(
      'Functions cannot be passed directly to Client Components ' +
        'unless you explicitly expose it by marking it with "use server". ' +
        'Or maybe you meant to call this function rather than return it.' +
        describeObjectForErrorMessage(parent, parentPropertyName),
    );
  }
  if (typeof value === 'symbol') {
    // $FlowFixMe[incompatible-type] `description` might be undefined
    const name: string = value.description;
    // $FlowFixMe[invalid-compare]
    if (Symbol.for(name) !== value) {
      throw new Error(
        'Only global symbols received from Symbol.for(...) can be passed to Client Components. ' +
          `The symbol Symbol.for(${
            // $FlowFixMe[incompatible-type] `description` might be undefined
            value.description
          }) cannot be found among global symbols.` +
          describeObjectForErrorMessage(parent, parentPropertyName),
      );
    }
    return value;
  }
  if (typeof value === 'bigint') {
    result.checkTainted(value);
    return value;
  }
  return value;
}

function readIterable(
  response: ResultResponse,
  value: Object,
  iteratorFn: () => ?Iterator<any>,
  context: KeyContext,
): any {
  const result = response._result;
  const iterator: any = iteratorFn.call(value);
  // $FlowFixMe[invalid-compare]
  if (iterator === value) {
    // A single-shot iterator is drained into the Result once and handed
    // to every consumer as an iterator over the items.
    const items = readArray(
      response,
      getIteratorEntries(result, iterator),
      context,
    );
    // $FlowFixMe[incompatible-use]: This uses raw Symbols because we're extracting from a native array.
    const read = items[Symbol.iterator]();
    response._models.set(value, read);
    return read;
  }
  // An iterable renders as its items. One that yields a self-iterator,
  // such as a generator, is drained into the Result once.
  return readArray(
    response,
    isSelfIterator(iterator)
      ? getIteratorEntries(result, iterator)
      : Array.from(iterator as any),
    context,
  );
}

function readAsyncIterableValue(
  response: ResultResponse,
  value: Object,
  context: KeyContext,
): any {
  return readAsyncIterable(
    response,
    value,
    item =>
      readStreamedValue(response, item, () =>
        readData(response, item, context, {}, ''),
      ),
    false,
  );
}

function createObjectCopy(): {[key: string]: any} {
  return {};
}

function readObject(
  response: ResultResponse,
  object: {[key: string]: any},
  context: KeyContext,
): any {
  const visitsBefore = response._visits;
  const cycle = enterContainer(response, object, createObjectCopy);
  if (cycle !== null) {
    return cycle;
  }
  let copy: null | {[key: string]: any} = null;
  let pure = true;
  try {
    const keys = Object.keys(object);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const child = object[key];
      // The wire drops a property whose value is undefined, and the client
      // never assigns __proto__.
      const read =
        child === undefined || key === '__proto__'
          ? undefined
          : readChild(response, child, context, object, key);
      if (
        pure &&
        (key === '__proto__' ||
          (child !== undefined && !isPureLeaf(response, child, read)))
      ) {
        pure = false;
      }
      if (copy === null) {
        if (read === child && child !== undefined) {
          continue;
        }
        copy = copyOf(response, object, createObjectCopy);
        for (let j = 0; j < i; j++) {
          copy[keys[j]] = object[keys[j]];
        }
      }
      if (read !== undefined) {
        copy[key] = read;
      }
    }
  } catch (thrown) {
    response._visiting.pop();
    throw thrown;
  }
  return exitContainer(
    response,
    object,
    visitsBefore,
    copy === null ? object : copy,
    pure,
  );
}

function createMapCopy(): Map<any, any> {
  return new Map();
}

function readMap(
  response: ResultResponse,
  map: Map<any, any>,
  context: KeyContext,
): Map<any, any> {
  const visitsBefore = response._visits;
  const cycle = enterContainer(response, map, createMapCopy);
  if (cycle !== null) {
    return cycle;
  }
  let copy: null | Map<any, any> = null;
  try {
    const entries = Array.from(map);
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const key = readChild(response, entry[0], context, entries, '' + i);
      const value = readChild(response, entry[1], context, entries, '' + i);
      if (copy === null) {
        if (key === entry[0] && value === entry[1]) {
          continue;
        }
        copy = copyOf(response, map, createMapCopy);
        for (let j = 0; j < i; j++) {
          copy.set(entries[j][0], entries[j][1]);
        }
      }
      copy.set(key, value);
    }
  } catch (thrown) {
    response._visiting.pop();
    throw thrown;
  }
  return exitContainer(
    response,
    map,
    visitsBefore,
    copy === null ? map : copy,
    false,
  );
}

function createSetCopy(): Set<any> {
  return new Set();
}

function readSet(
  response: ResultResponse,
  set: Set<any>,
  context: KeyContext,
): Set<any> {
  const visitsBefore = response._visits;
  const cycle = enterContainer(response, set, createSetCopy);
  if (cycle !== null) {
    return cycle;
  }
  let copy: null | Set<any> = null;
  try {
    const items = Array.from(set);
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const read = readChild(response, item, context, items, '' + i);
      if (copy === null) {
        if (read === item) {
          continue;
        }
        copy = copyOf(response, set, createSetCopy);
        for (let j = 0; j < i; j++) {
          copy.add(items[j]);
        }
      }
      copy.add(read);
    }
  } catch (thrown) {
    response._visiting.pop();
    throw thrown;
  }
  return exitContainer(
    response,
    set,
    visitsBefore,
    copy === null ? set : copy,
    false,
  );
}

// A promise in the model is handed out as a chunk, the way the wire path
// does, so use() can read it and the consumer sees the read value.
function readThenable(
  response: ResultResponse,
  thenable: Thenable<any>,
  context: KeyContext,
): any {
  const models = response._models;
  const chunk = createPendingChunk(response);
  models.set(thenable, chunk);
  thenable.then(
    (value: mixed) => {
      try {
        fulfillChunk(
          response,
          chunk,
          readData(response, value, context, {}, ''),
        );
      } catch (error) {
        rejectChunk(response, chunk, readError(response, error));
      }
    },
    (reason: mixed) => {
      rejectChunk(
        response,
        chunk,
        errorWithDigest(
          createConsumerError(response, reason),
          logConsumerError(response, reason),
        ),
      );
    },
  );
  return chunk;
}

// Errors the Result did not already assign a digest to, such as a rejected
// promise in the model, are reported through its onError once.
function logConsumerError(response: ResultResponse, error: mixed): string {
  const result = response._result;
  if (typeof error === 'object' && error !== null) {
    const existing = result.errorDigests.get(error);
    if (existing !== undefined) {
      return existing;
    }
  }
  const errorDigest = result.onError(error);
  if (errorDigest != null && typeof errorDigest !== 'string') {
    // eslint-disable-next-line react-internal/prod-error-codes
    throw new Error(
      `onError returned something with a type other than "string". onError should return a string and may return null or undefined but must not return anything else. It received something of type "${typeof errorDigest}" instead`,
    );
  }
  const digest = errorDigest || '';
  if (typeof error === 'object' && error !== null) {
    result.errorDigests.set(error, digest);
  }
  return digest;
}

export function createResponse(
  result: Result<any>,
  bundlerConfig: ServerConsumerModuleMap,
  moduleLoading: ModuleLoading,
  bundler: ReferenceBundler,
  callServer: CallServerCallback,
  encodeFormAction: void | EncodeFormActionCallback,
  temporaryReferences: void | TemporaryReferenceSet,
  bindToConsumer: null | (<R>(callback: () => R) => R),
  nonce: ?string,
  onError: void | ((error: mixed) => ?string),
): ResultResponse {
  const response: ResultResponse = {
    _result: result,
    _bundlerConfig: bundlerConfig,
    _moduleLoading: moduleLoading,
    _nonce: nonce,
    _bundler: bundler,
    _callServer: callServer,
    _encodeFormAction: encodeFormAction,
    _temporaryReferences: temporaryReferences,
    _serverReferences: new Map(),
    _bindToConsumer: bindToConsumer,
    _models: new Map(),
    _visiting: [],
    _visits: 0,
    _childPure: false,
    _modules: new Map(),
    _onError: onError === undefined ? result.onError : onError,
    _readError: null,
    _consumerErrors: new WeakSet(),
    _pendingChunks: new Set(),
    _closed: false,
    _cleanup: [],
  };
  retainResult(result);
  // Aborting the Result rejects everything this consumer still waits for,
  // as aborting a stream request errors its pending rows.
  response._cleanup.push(
    subscribeToAbort(result, reason => {
      const pending = Array.from(response._pendingChunks);
      response._pendingChunks.clear();
      if (pending.length > 0) {
        const error = readError(response, reason);
        for (let i = 0; i < pending.length; i++) {
          rejectChunk(response, pending[i], error);
        }
      }
    }),
  );
  response._cleanup.push(
    subscribeToHints(result.context, hint => {
      if (bindToConsumer !== null) {
        bindToConsumer(() => dispatchHint(hint.code, hint.model));
      } else {
        dispatchHint(hint.code, hint.model);
      }
    }),
  );
  return response;
}

// The wire path's root row waits for the root model to resolve rather than
// referring to it lazily, so pending output at the root settles the root
// chunk itself.
function settleRoot(
  response: ResultResponse,
  chunk: SomeChunk<any>,
  value: any,
): void {
  if (
    value !== null &&
    typeof value === 'object' &&
    value.$$typeof === REACT_LAZY_TYPE &&
    value._init === readChunk
  ) {
    const payload: SomeChunk<any> = value._payload;
    payload.then(
      (resolved: mixed) => settleRoot(response, chunk, resolved),
      (reason: mixed) => rejectChunk(response, chunk, reason),
    );
    return;
  }
  fulfillChunk(response, chunk, value);
}

export function readRoot<T>(response: ResultResponse): Thenable<T> {
  const result = response._result;
  const chunk = createPendingChunk(response);
  // Expansions this walk starts, and their continuations after an await,
  // run with the Result's render context.
  const attempt = () => {
    result.run(() => {
      try {
        const root = readNode(
          response,
          result.model,
          rootKeyContext,
          rootKeyContext,
          {},
          '',
        );
        throwReadError(response, null);
        settleRoot(response, chunk, root);
      } catch (thrown) {
        if (isThenable(thrown)) {
          // The root waits on a loading module, as the root row would.
          (thrown as any).then(attempt, (reason: mixed) =>
            rejectChunk(response, chunk, readError(response, reason)),
          );
          return;
        }
        rejectChunk(response, chunk, readError(response, thrown));
      }
    });
  };
  attempt();
  return chunk as any;
}

export function close(response: ResultResponse, reason: mixed): void {
  if (response._closed) {
    return;
  }
  response._closed = true;
  const cleanup = response._cleanup;
  for (let i = 0; i < cleanup.length; i++) {
    cleanup[i]();
  }
  releaseResult(response._result, reason);
}
