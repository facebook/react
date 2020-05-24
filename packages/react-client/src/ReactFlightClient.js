/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Wakeable} from 'shared/ReactTypes';
import type {BlockComponent, BlockRenderFunction} from 'react/src/ReactBlock';
import type {LazyComponent} from 'react/src/ReactLazy';

import type {
  ModuleReference,
  ModuleMetaData,
  UninitializedModel,
  Response,
} from './ReactFlightClientHostConfig';

import {
  resolveModuleReference,
  preloadModule,
  requireModule,
  parseModel,
} from './ReactFlightClientHostConfig';

import {
  REACT_LAZY_TYPE,
  REACT_BLOCK_TYPE,
  REACT_ELEMENT_TYPE,
} from 'shared/ReactSymbols';

export type JSONValue =
  | number
  | null
  | boolean
  | string
  | {+[key: string]: JSONValue}
  | $ReadOnlyArray<JSONValue>;

const PENDING = 0;
const RESOLVED_MODEL = 1;
const INITIALIZED = 2;
const ERRORED = 3;

type PendingChunk = {
  _status: 0,
  _value: null | Array<() => mixed>,
  _response: Response,
  then(resolve: () => mixed): void,
};
type ResolvedModelChunk = {
  _status: 1,
  _value: UninitializedModel,
  _response: Response,
  then(resolve: () => mixed): void,
};
type InitializedChunk<T> = {
  _status: 2,
  _value: T,
  _response: Response,
  then(resolve: () => mixed): void,
};
type ErroredChunk = {
  _status: 3,
  _value: Error,
  _response: Response,
  then(resolve: () => mixed): void,
};
type SomeChunk<T> =
  | PendingChunk
  | ResolvedModelChunk
  | InitializedChunk<T>
  | ErroredChunk;

function Chunk(status: any, value: any, response: Response) {
  this._status = status;
  this._value = value;
  this._response = response;
}
Chunk.prototype.then = function<T>(resolve: () => mixed) {
  const chunk: SomeChunk<T> = this;
  if (chunk._status === PENDING) {
    if (chunk._value === null) {
      chunk._value = [];
    }
    chunk._value.push(resolve);
  } else {
    resolve();
  }
};

export type ResponseBase = {
  _chunks: Map<number, SomeChunk<any>>,
  readRoot<T>(): T,
  ...
};

export type {Response};

function readChunk<T>(chunk: SomeChunk<T>): T {
  switch (chunk._status) {
    case INITIALIZED:
      return chunk._value;
    case RESOLVED_MODEL:
      return initializeModelChunk(chunk);
    case PENDING:
      // eslint-disable-next-line no-throw-literal
      throw (chunk: Wakeable);
    default:
      throw chunk._value;
  }
}

function readRoot<T>(): T {
  const response: Response = this;
  const chunk = getChunk(response, 0);
  return readChunk(chunk);
}

function createPendingChunk(response: Response): PendingChunk {
  return new Chunk(PENDING, null, response);
}

function createErrorChunk(response: Response, error: Error): ErroredChunk {
  return new Chunk(ERRORED, error, response);
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
  if (chunk._status !== PENDING) {
    // We already resolved. We didn't expect to see this.
    return;
  }
  const listeners = chunk._value;
  const erroredChunk: ErroredChunk = (chunk: any);
  erroredChunk._status = ERRORED;
  erroredChunk._value = error;
  wakeChunk(listeners);
}

function createResolvedModelChunk(
  response: Response,
  value: UninitializedModel,
): ResolvedModelChunk {
  return new Chunk(RESOLVED_MODEL, value, response);
}

function resolveModelChunk<T>(
  chunk: SomeChunk<T>,
  value: UninitializedModel,
): void {
  if (chunk._status !== PENDING) {
    // We already resolved. We didn't expect to see this.
    return;
  }
  const listeners = chunk._value;
  const resolvedChunk: ResolvedModelChunk = (chunk: any);
  resolvedChunk._status = RESOLVED_MODEL;
  resolvedChunk._value = value;
  wakeChunk(listeners);
}

function initializeModelChunk<T>(chunk: ResolvedModelChunk): T {
  const value: T = parseModel(chunk._response, chunk._value);
  const initializedChunk: InitializedChunk<T> = (chunk: any);
  initializedChunk._status = INITIALIZED;
  initializedChunk._value = value;
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

function readMaybeChunk<T>(maybeChunk: SomeChunk<T> | T): T {
  if (maybeChunk == null || !(maybeChunk instanceof Chunk)) {
    // $FlowFixMe
    return maybeChunk;
  }
  const chunk: SomeChunk<T> = (maybeChunk: any);
  return readChunk(chunk);
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

type UninitializedBlockPayload<Data> = [
  mixed,
  ModuleMetaData | SomeChunk<ModuleMetaData>,
  Data | SomeChunk<Data>,
  Response,
];

function initializeBlock<Props, Data>(
  tuple: UninitializedBlockPayload<Data>,
): BlockComponent<Props, Data> {
  // Require module first and then data. The ordering matters.
  const moduleMetaData: ModuleMetaData = readMaybeChunk(tuple[1]);
  const moduleReference: ModuleReference<
    BlockRenderFunction<Props, Data>,
  > = resolveModuleReference(moduleMetaData);
  // TODO: Do this earlier, as the chunk is resolved.
  preloadModule(moduleReference);

  const moduleExport = requireModule(moduleReference);

  // The ordering here is important because this call might suspend.
  // We don't want that to prevent the module graph for being initialized.
  const data: Data = readMaybeChunk(tuple[2]);

  return {
    $$typeof: REACT_BLOCK_TYPE,
    _status: -1,
    _data: data,
    _render: moduleExport,
  };
}

function createLazyBlock<Props, Data>(
  tuple: UninitializedBlockPayload<Data>,
): LazyComponent<BlockComponent<Props, Data>, UninitializedBlockPayload<Data>> {
  const lazyType: LazyComponent<
    BlockComponent<Props, Data>,
    UninitializedBlockPayload<Data>,
  > = {
    $$typeof: REACT_LAZY_TYPE,
    _payload: tuple,
    _init: initializeBlock,
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
  if (value[0] === '$') {
    if (value === '$') {
      return REACT_ELEMENT_TYPE;
    } else if (value[1] === '$' || value[1] === '@') {
      // This was an escaped string value.
      return value.substring(1);
    } else {
      const id = parseInt(value.substring(1), 16);
      const chunk = getChunk(response, id);
      if (parentObject[0] === REACT_BLOCK_TYPE) {
        // Block types know how to deal with lazy values.
        return chunk;
      }
      // For anything else we must Suspend this block if
      // we don't yet have the value.
      return readChunk(chunk);
    }
  }
  if (value === '@') {
    return REACT_BLOCK_TYPE;
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
  } else if (tuple[0] === REACT_BLOCK_TYPE) {
    // TODO: Consider having React just directly accept these arrays as blocks.
    return createLazyBlock((tuple: any));
  }
  return value;
}

export function createResponse(): ResponseBase {
  const chunks: Map<number, SomeChunk<any>> = new Map();
  const response = {
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

export function resolveError(
  response: Response,
  id: number,
  message: string,
  stack: string,
): void {
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
