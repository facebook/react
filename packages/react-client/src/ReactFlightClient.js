/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Wakeable} from 'shared/ReactTypes';
import type {LazyComponent} from 'react/src/ReactLazy';

import type {
  ModuleReference,
  ModuleMetaData,
  UninitializedModel,
  Response,
  BundlerConfig,
} from './ReactFlightClientHostConfig';

import {
  resolveModuleReference,
  preloadModule,
  requireModule,
  parseModel,
} from './ReactFlightClientHostConfig';

import {REACT_LAZY_TYPE, REACT_ELEMENT_TYPE} from 'shared/ReactSymbols';

import {getOrCreateServerContext} from 'shared/ReactServerContextRegistry';

export type JSONValue =
  | number
  | null
  | boolean
  | string
  | {+[key: string]: JSONValue}
  | $ReadOnlyArray<JSONValue>;

const PENDING = 'pending';
const RESOLVED_MODEL = 'resolved_model';
const RESOLVED_MODULE = 'resolved_module';
const INITIALIZED = 'fulfilled';
const ERRORED = 'rejected';

type PendingChunk = {
  status: 'pending',
  value: null | Array<() => mixed>,
  reason: null,
  _response: Response,
  then(resolve: () => mixed): void,
};
type ResolvedModelChunk = {
  status: 'resolved_model',
  value: UninitializedModel,
  reason: null,
  _response: Response,
  then(resolve: () => mixed): void,
};
type ResolvedModuleChunk<T> = {
  status: 'resolved_module',
  value: ModuleReference<T>,
  reason: null,
  _response: Response,
  then(resolve: () => mixed): void,
};
type InitializedChunk<T> = {
  status: 'fulfilled',
  value: T,
  reason: null,
  _response: Response,
  then(resolve: () => mixed): void,
};
type ErroredChunk = {
  status: 'rejected',
  value: null,
  reason: Error,
  _response: Response,
  then(resolve: () => mixed): void,
};
type SomeChunk<T> =
  | PendingChunk
  | ResolvedModelChunk
  | ResolvedModuleChunk<T>
  | InitializedChunk<T>
  | ErroredChunk;

function Chunk(status: any, value: any, reason: any, response: Response) {
  this.status = status;
  this.value = value;
  this.reason = reason;
  this._response = response;
}
Chunk.prototype.then = function<T>(resolve: () => mixed) {
  const chunk: SomeChunk<T> = this;
  if (chunk.status === PENDING) {
    if (chunk.value === null) {
      chunk.value = [];
    }
    chunk.value.push(resolve);
  } else {
    resolve();
  }
};

export type ResponseBase = {
  _bundlerConfig: BundlerConfig,
  _chunks: Map<number, SomeChunk<any>>,
  readRoot<T>(): T,
  ...
};

export type {Response};

function readChunk<T>(chunk: SomeChunk<T>): T {
  switch (chunk.status) {
    case INITIALIZED:
      return chunk.value;
    case RESOLVED_MODEL:
      return initializeModelChunk(chunk);
    case RESOLVED_MODULE:
      return initializeModuleChunk(chunk);
    case PENDING:
      // eslint-disable-next-line no-throw-literal
      throw (chunk: Wakeable);
    default:
      throw chunk.reason;
  }
}

function readRoot<T>(): T {
  const response: Response = this;
  const chunk = getChunk(response, 0);
  return readChunk(chunk);
}

function createPendingChunk(response: Response): PendingChunk {
  // $FlowFixMe Flow doesn't support functions as constructors
  return new Chunk(PENDING, null, null, response);
}

function createErrorChunk(response: Response, error: Error): ErroredChunk {
  // $FlowFixMe Flow doesn't support functions as constructors
  return new Chunk(ERRORED, null, error, response);
}

function createInitializedChunk<T>(
  response: Response,
  value: T,
): InitializedChunk<T> {
  // $FlowFixMe Flow doesn't support functions as constructors
  return new Chunk(INITIALIZED, value, null, response);
}

function wakeChunk(listeners: null | Array<() => mixed>) {
  if (listeners !== null) {
    for (let i = 0; i < listeners.length; i++) {
      const listener = listeners[i];
      listener();
    }
  }
}

function triggerErrorOnChunk<T>(chunk: SomeChunk<T>, error: Error): void {
  if (chunk.status !== PENDING) {
    // We already resolved. We didn't expect to see this.
    return;
  }
  const listeners = chunk.value;
  const erroredChunk: ErroredChunk = (chunk: any);
  erroredChunk.status = ERRORED;
  erroredChunk.reason = error;
  wakeChunk(listeners);
}

function createResolvedModelChunk(
  response: Response,
  value: UninitializedModel,
): ResolvedModelChunk {
  // $FlowFixMe Flow doesn't support functions as constructors
  return new Chunk(RESOLVED_MODEL, value, null, response);
}

function createResolvedModuleChunk<T>(
  response: Response,
  value: ModuleReference<T>,
): ResolvedModuleChunk<T> {
  // $FlowFixMe Flow doesn't support functions as constructors
  return new Chunk(RESOLVED_MODULE, value, null, response);
}

function resolveModelChunk<T>(
  chunk: SomeChunk<T>,
  value: UninitializedModel,
): void {
  if (chunk.status !== PENDING) {
    // We already resolved. We didn't expect to see this.
    return;
  }
  const listeners = chunk.value;
  const resolvedChunk: ResolvedModelChunk = (chunk: any);
  resolvedChunk.status = RESOLVED_MODEL;
  resolvedChunk.value = value;
  wakeChunk(listeners);
}

function resolveModuleChunk<T>(
  chunk: SomeChunk<T>,
  value: ModuleReference<T>,
): void {
  if (chunk.status !== PENDING) {
    // We already resolved. We didn't expect to see this.
    return;
  }
  const listeners = chunk.value;
  const resolvedChunk: ResolvedModuleChunk<T> = (chunk: any);
  resolvedChunk.status = RESOLVED_MODULE;
  resolvedChunk.value = value;
  wakeChunk(listeners);
}

function initializeModelChunk<T>(chunk: ResolvedModelChunk): T {
  const value: T = parseModel(chunk._response, chunk.value);
  const initializedChunk: InitializedChunk<T> = (chunk: any);
  initializedChunk.status = INITIALIZED;
  initializedChunk.value = value;
  return value;
}

function initializeModuleChunk<T>(chunk: ResolvedModuleChunk<T>): T {
  const value: T = requireModule(chunk.value);
  const initializedChunk: InitializedChunk<T> = (chunk: any);
  initializedChunk.status = INITIALIZED;
  initializedChunk.value = value;
  return value;
}

// Report that any missing chunks in the model is now going to throw this
// error upon read. Also notify any pending promises.
export function reportGlobalError(response: Response, error: Error): void {
  response._chunks.forEach(chunk => {
    // If this chunk was already resolved or errored, it won't
    // trigger an error but if it wasn't then we need to
    // because we won't be getting any new data to resolve it.
    triggerErrorOnChunk(chunk, error);
  });
}

function createElement(type, key, props): React$Element<any> {
  const element: any = {
    // This tag allows us to uniquely identify this as a React Element
    $$typeof: REACT_ELEMENT_TYPE,

    // Built-in properties that belong on the element
    type: type,
    key: key,
    ref: null,
    props: props,

    // Record the component responsible for creating this element.
    _owner: null,
  };
  if (__DEV__) {
    // We don't really need to add any of these but keeping them for good measure.
    // Unfortunately, _store is enumerable in jest matchers so for equality to
    // work, I need to keep it or make _store non-enumerable in the other file.
    element._store = {};
    Object.defineProperty(element._store, 'validated', {
      configurable: false,
      enumerable: false,
      writable: true,
      value: true, // This element has already been validated on the server.
    });
    Object.defineProperty(element, '_self', {
      configurable: false,
      enumerable: false,
      writable: false,
      value: null,
    });
    Object.defineProperty(element, '_source', {
      configurable: false,
      enumerable: false,
      writable: false,
      value: null,
    });
  }
  return element;
}

function createLazyChunkWrapper<T>(
  chunk: SomeChunk<T>,
): LazyComponent<T, SomeChunk<T>> {
  const lazyType: LazyComponent<T, SomeChunk<T>> = {
    $$typeof: REACT_LAZY_TYPE,
    _payload: chunk,
    _init: readChunk,
  };
  return lazyType;
}

function getChunk(response: Response, id: number): SomeChunk<any> {
  const chunks = response._chunks;
  let chunk = chunks.get(id);
  if (!chunk) {
    chunk = createPendingChunk(response);
    chunks.set(id, chunk);
  }
  return chunk;
}

export function parseModelString(
  response: Response,
  parentObject: Object,
  value: string,
): any {
  switch (value[0]) {
    case '$': {
      if (value === '$') {
        return REACT_ELEMENT_TYPE;
      } else if (value[1] === '$' || value[1] === '@') {
        // This was an escaped string value.
        return value.substring(1);
      } else {
        const id = parseInt(value.substring(1), 16);
        const chunk = getChunk(response, id);
        return readChunk(chunk);
      }
    }
    case '@': {
      const id = parseInt(value.substring(1), 16);
      const chunk = getChunk(response, id);
      // We create a React.lazy wrapper around any lazy values.
      // When passed into React, we'll know how to suspend on this.
      return createLazyChunkWrapper(chunk);
    }
  }
  return value;
}

export function parseModelTuple(
  response: Response,
  value: {+[key: string]: JSONValue} | $ReadOnlyArray<JSONValue>,
): any {
  const tuple: [mixed, mixed, mixed, mixed] = (value: any);

  if (tuple[0] === REACT_ELEMENT_TYPE) {
    // TODO: Consider having React just directly accept these arrays as elements.
    // Or even change the ReactElement type to be an array.
    return createElement(tuple[1], tuple[2], tuple[3]);
  }
  return value;
}

export function createResponse(bundlerConfig: BundlerConfig): ResponseBase {
  const chunks: Map<number, SomeChunk<any>> = new Map();
  const response = {
    _bundlerConfig: bundlerConfig,
    _chunks: chunks,
    readRoot: readRoot,
  };
  return response;
}

export function resolveModel(
  response: Response,
  id: number,
  model: UninitializedModel,
): void {
  const chunks = response._chunks;
  const chunk = chunks.get(id);
  if (!chunk) {
    chunks.set(id, createResolvedModelChunk(response, model));
  } else {
    resolveModelChunk(chunk, model);
  }
}

export function resolveProvider(
  response: Response,
  id: number,
  contextName: string,
): void {
  const chunks = response._chunks;
  chunks.set(
    id,
    createInitializedChunk(
      response,
      getOrCreateServerContext(contextName).Provider,
    ),
  );
}

export function resolveModule(
  response: Response,
  id: number,
  model: UninitializedModel,
): void {
  const chunks = response._chunks;
  const chunk = chunks.get(id);
  const moduleMetaData: ModuleMetaData = parseModel(response, model);
  const moduleReference = resolveModuleReference(
    response._bundlerConfig,
    moduleMetaData,
  );

  // TODO: Add an option to encode modules that are lazy loaded.
  // For now we preload all modules as early as possible since it's likely
  // that we'll need them.
  preloadModule(moduleReference);

  if (!chunk) {
    chunks.set(id, createResolvedModuleChunk(response, moduleReference));
  } else {
    resolveModuleChunk(chunk, moduleReference);
  }
}

export function resolveSymbol(
  response: Response,
  id: number,
  name: string,
): void {
  const chunks = response._chunks;
  // We assume that we'll always emit the symbol before anything references it
  // to save a few bytes.
  chunks.set(id, createInitializedChunk(response, Symbol.for(name)));
}

export function resolveError(
  response: Response,
  id: number,
  message: string,
  stack: string,
): void {
  // eslint-disable-next-line react-internal/prod-error-codes
  const error = new Error(message);
  error.stack = stack;
  const chunks = response._chunks;
  const chunk = chunks.get(id);
  if (!chunk) {
    chunks.set(id, createErrorChunk(response, error));
  } else {
    triggerErrorOnChunk(chunk, error);
  }
}

export function close(response: Response): void {
  // In case there are any remaining unresolved chunks, they won't
  // be resolved now. So we need to issue an error to those.
  // Ideally we should be able to early bail out if we kept a
  // ref count of pending chunks.
  reportGlobalError(response, new Error('Connection closed.'));
}
