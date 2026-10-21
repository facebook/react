/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Thenable, ReactKey} from 'shared/ReactTypes';
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
} from 'shared/ReactFlightResult';
import {subscribeToHints} from 'shared/ReactFlightRenderContext';

import {
  REACT_ELEMENT_TYPE,
  REACT_FRAGMENT_TYPE,
  REACT_LAZY_TYPE,
  REACT_MEMO_TYPE,
  REACT_FORWARD_REF_TYPE,
  REACT_OPTIMISTIC_KEY,
  getIteratorFn,
} from 'shared/ReactSymbols';
import isArray from 'shared/isArray';

// Reads a Result in process, for the renderer that consumes the Server
// Component output on the same server, e.g. Fizz for the HTML of a page.
// The model is walked once. Server Components are replaced by their expansion
// from the Result's ledger, Client References are resolved through the
// consumer's module map, and everything else is returned as is: the data is
// already in this process, so unlike the wire path nothing is copied unless
// something inside it changed.

export type ResultResponse = {
  _result: Result<any>,
  _bundlerConfig: ServerConsumerModuleMap,
  _moduleLoading: ModuleLoading,
  _nonce: ?string,
  _resolveClientReferenceMetadata: (reference: any) => ClientReferenceMetadata,
  // Runs a callback in the async context the consumer was created in, so
  // resource hints reach the renderer consuming this Result even when another
  // consumer's expansion emitted them.
  _bindToConsumer: null | (<R>(callback: () => R) => R),
  // Server object → what the consumer gets for it, so shared references stay
  // shared and cycles terminate.
  _models: Map<any, any>,
  // Client Reference id → the module it resolved to, or the chunk loading it.
  _modules: Map<string, any>,
  _onError: (error: mixed) => ?string,
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
}
// $FlowFixMe[prop-missing]
ResultChunk.prototype = Object.create(Promise.prototype) as any;
// $FlowFixMe[prop-missing]
ResultChunk.prototype.then = function (
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
      let listeners = this._listeners;
      if (listeners === null) {
        this._listeners = listeners = [];
      }
      listeners.push([resolve, reject]);
    }
  }
};

type SomeChunk<T> = {
  status: 'pending' | 'fulfilled' | 'rejected',
  value: T,
  reason: mixed,
  _listeners: null | Array<[(value: T) => mixed, (reason: mixed) => mixed]>,
  then(resolve: (value: T) => mixed, reject: (reason: mixed) => mixed): void,
};

function createPendingChunk(): SomeChunk<any> {
  // $FlowFixMe[invalid-constructor]
  return new ResultChunk(PENDING, undefined, undefined);
}

function createRejectedChunk(reason: mixed): SomeChunk<any> {
  // $FlowFixMe[invalid-constructor]
  return new ResultChunk(REJECTED, undefined, reason);
}

function fulfillChunk<T>(chunk: SomeChunk<T>, value: T): void {
  if (chunk.status !== PENDING) {
    return;
  }
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

function rejectChunk<T>(chunk: SomeChunk<T>, reason: mixed): void {
  if (chunk.status !== PENDING) {
    return;
  }
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
      throw chunk;
  }
}

function createLazyChunkWrapper<T>(
  chunk: SomeChunk<T>,
): LazyComponent<T, SomeChunk<T>> {
  return {
    $$typeof: REACT_LAZY_TYPE,
    _payload: chunk,
    _init: readChunk,
  };
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
): any {
  if (value === null || typeof value !== 'object') {
    return value;
  }
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
  return readData(response, value, descendContext);
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

function readArray(
  response: ResultResponse,
  array: Array<any>,
  context: KeyContext,
): Array<any> {
  const models = response._models;
  const existing = models.get(array);
  if (existing !== undefined) {
    return existing;
  }
  let copy: null | Array<any> = null;
  for (let i = 0; i < array.length; i++) {
    const child = array[i];
    const read = readNode(response, child, context, context);
    if (copy === null) {
      if (read === child) {
        continue;
      }
      copy = array.slice(0, i);
      models.set(array, copy);
    }
    copy.push(read);
  }
  if (copy === null) {
    models.set(array, array);
    return array;
  }
  return copy;
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
      const chunk = createPendingChunk();
      thrown.then(
        () => {
          try {
            fulfillChunk(
              chunk,
              readNode(response, lazy, context, descendContext),
            );
          } catch (error) {
            rejectChunk(chunk, error);
          }
        },
        (reason: mixed) => rejectChunk(chunk, reason),
      );
      return createLazyChunkWrapper(chunk);
    }
    throw thrown;
  }
  return readNode(response, resolved, context, descendContext);
}

function readElement(
  response: ResultResponse,
  element: any,
  context: KeyContext,
  descendContext: KeyContext,
): any {
  const result = response._result;
  let expansion: null | Expansion;
  try {
    expansion = result.expand(element);
  } catch (thrown) {
    // A pending lazy type; read the element again once it resolves.
    if (
      thrown !== null &&
      typeof thrown === 'object' &&
      typeof thrown.then === 'function'
    ) {
      const chunk = createPendingChunk();
      thrown.then(
        () => {
          try {
            fulfillChunk(
              chunk,
              readElement(response, element, context, descendContext),
            );
          } catch (error) {
            rejectChunk(chunk, error);
          }
        },
        (reason: mixed) => rejectChunk(chunk, reason),
      );
      return createLazyChunkWrapper(chunk);
    }
    throw thrown;
  }
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
      const chunk = createPendingChunk();
      expansion.then(
        (value: mixed) => {
          try {
            fulfillChunk(
              chunk,
              readServerComponentOutput(
                response,
                value,
                context,
                descendContext,
              ),
            );
          } catch (error) {
            rejectChunk(chunk, error);
          }
        },
        (reason: mixed) => {
          rejectChunk(
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
    const chunk = createPendingChunk();
    thenable.then(
      (value: mixed) => {
        try {
          fulfillChunk(
            chunk,
            readServerComponentOutput(response, value, context, descendContext),
          );
        } catch (error) {
          rejectChunk(chunk, error);
        }
      },
      (reason: mixed) => {
        rejectChunk(
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
    // An iterator in return position renders as its items.
    return readFragment(
      response,
      Array.from(output as any),
      context,
      descendContext,
    );
  }
  return readNode(response, output, context, descendContext);
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
  const props = readData(response, element.props, descendContext);
  if (result.isClientReference(type)) {
    return readClientReferenceElement(response, type, key, props, context);
  }
  let read;
  if (key === element.key && props === element.props && type === element.type) {
    // Nothing about the element changes for this consumer.
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
  const resolvedType = readClientReference(response, reference);
  if (
    resolvedType !== null &&
    typeof resolvedType === 'object' &&
    resolvedType.$$typeof === REACT_LAZY_TYPE
  ) {
    // The module is still loading.
    const moduleChunk: SomeChunk<any> = resolvedType._payload;
    const chunk = createPendingChunk();
    moduleChunk.then(
      (type: mixed) => {
        const element = createElement(type, key, props);
        fulfillChunk(
          chunk,
          context.implicitSlot && key !== null ? [element] : element,
        );
      },
      (reason: mixed) => rejectChunk(chunk, reason),
    );
    return createLazyChunkWrapper(chunk);
  }
  const element = createElement(resolvedType, key, props);
  if (context.implicitSlot && key !== null) {
    return [element];
  }
  return element;
}

// Resolves a server-side Client Reference to the consumer's module export,
// or to a lazy wrapper while its chunks load.
function readClientReference(response: ResultResponse, reference: any): any {
  const id: string = reference.$$id;
  const modules = response._modules;
  const existing = modules.get(id);
  if (existing !== undefined) {
    if (
      existing !== null &&
      typeof existing === 'object' &&
      existing.$$typeof === REACT_LAZY_TYPE &&
      existing._payload.status === FULFILLED
    ) {
      return existing._payload.value;
    }
    return existing;
  }
  const metadata = response._resolveClientReferenceMetadata(reference);
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
  const promise = preloadModule(clientReference);
  if (promise) {
    const chunk = createPendingChunk();
    const lazy = createLazyChunkWrapper(chunk);
    modules.set(id, lazy);
    promise.then(
      () => {
        try {
          fulfillChunk(chunk, requireModule(clientReference));
        } catch (error) {
          rejectChunk(chunk, error);
        }
      },
      (reason: mixed) => rejectChunk(chunk, reason),
    );
    return lazy;
  }
  const moduleExport = requireModule(clientReference);
  modules.set(id, moduleExport);
  return moduleExport;
}

// Reads a value in a data position: props and anything inside them. Nodes
// inside data see the enclosing key context.
function readData(
  response: ResultResponse,
  value: any,
  context: KeyContext,
): any {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  const models = response._models;
  const existing = models.get(value);
  if (existing !== undefined) {
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
  if (isArray(value)) {
    return readArray(response, value, context);
  }
  if (typeof value.then === 'function') {
    if (response._result.isClientReference(value)) {
      return value;
    }
    return readThenable(response, value, context);
  }
  if (value instanceof Map) {
    return readMap(response, value, context);
  }
  if (value instanceof Set) {
    return readSet(response, value, context);
  }
  if (value instanceof Date || ArrayBuffer.isView(value)) {
    models.set(value, value);
    return value;
  }
  return readObject(response, value, context);
}

function readObject(
  response: ResultResponse,
  object: {[key: string]: any},
  context: KeyContext,
): any {
  const models = response._models;
  let copy: null | {[key: string]: any} = null;
  const keys = Object.keys(object);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const child = object[key];
    // The wire path drops a property whose value is undefined.
    const read =
      child === undefined ? undefined : readData(response, child, context);
    if (copy === null) {
      if (read === child && child !== undefined) {
        continue;
      }
      copy = {} as {[key: string]: any};
      for (let j = 0; j < i; j++) {
        copy[keys[j]] = object[keys[j]];
      }
      models.set(object, copy);
    }
    if (read !== undefined) {
      copy[key] = read;
    }
  }
  if (copy === null) {
    models.set(object, object);
    return object;
  }
  return copy;
}

function readMap(
  response: ResultResponse,
  map: Map<any, any>,
  context: KeyContext,
): Map<any, any> {
  const models = response._models;
  const entries = Array.from(map);
  let changed = false;
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const key = readData(response, entry[0], context);
    const value = readData(response, entry[1], context);
    if (key !== entry[0] || value !== entry[1]) {
      changed = true;
      entries[i] = [key, value];
    }
  }
  const read = changed ? new Map(entries) : map;
  models.set(map, read);
  return read;
}

function readSet(
  response: ResultResponse,
  set: Set<any>,
  context: KeyContext,
): Set<any> {
  const models = response._models;
  const items = Array.from(set);
  let changed = false;
  for (let i = 0; i < items.length; i++) {
    const read = readData(response, items[i], context);
    if (read !== items[i]) {
      changed = true;
      items[i] = read;
    }
  }
  const read = changed ? new Set(items) : set;
  models.set(set, read);
  return read;
}

// A promise in the model is handed out as a chunk, the way the wire path
// does, so use() can read it and the consumer sees the read value.
function readThenable(
  response: ResultResponse,
  thenable: Thenable<any>,
  context: KeyContext,
): any {
  const models = response._models;
  const chunk = createPendingChunk();
  models.set(thenable, chunk);
  thenable.then(
    (value: mixed) => {
      try {
        fulfillChunk(chunk, readData(response, value, context));
      } catch (error) {
        rejectChunk(chunk, error);
      }
    },
    (reason: mixed) => {
      rejectChunk(
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
  resolveClientReferenceMetadata: (reference: any) => ClientReferenceMetadata,
  bindToConsumer: null | (<R>(callback: () => R) => R),
  nonce: ?string,
  onError: void | ((error: mixed) => ?string),
): ResultResponse {
  const response: ResultResponse = {
    _result: result,
    _bundlerConfig: bundlerConfig,
    _moduleLoading: moduleLoading,
    _nonce: nonce,
    _resolveClientReferenceMetadata: resolveClientReferenceMetadata,
    _bindToConsumer: bindToConsumer,
    _models: new Map(),
    _modules: new Map(),
    _onError: onError === undefined ? result.onError : onError,
    _closed: false,
    _cleanup: [],
  };
  retainResult(result);
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
function settleRoot(chunk: SomeChunk<any>, value: any): void {
  if (
    value !== null &&
    typeof value === 'object' &&
    value.$$typeof === REACT_LAZY_TYPE &&
    value._init === readChunk
  ) {
    const payload: SomeChunk<any> = value._payload;
    payload.then(
      (resolved: mixed) => settleRoot(chunk, resolved),
      (reason: mixed) => rejectChunk(chunk, reason),
    );
    return;
  }
  fulfillChunk(chunk, value);
}

export function readRoot<T>(response: ResultResponse): Thenable<T> {
  const result = response._result;
  const chunk = createPendingChunk();
  // Expansions this walk starts, and their continuations after an await,
  // run with the Result's render context.
  result.run(() => {
    try {
      settleRoot(
        chunk,
        readNode(response, result.model, rootKeyContext, rootKeyContext),
      );
    } catch (error) {
      rejectChunk(chunk, error);
    }
  });
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
