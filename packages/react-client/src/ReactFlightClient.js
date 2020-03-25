/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {BlockComponent, BlockRenderFunction} from 'react/src/ReactBlock';
import type {LazyComponent} from 'react/src/ReactLazy';

import type {
  ModuleReference,
  ModuleMetaData,
} from './ReactFlightClientHostConfig';

import {
  resolveModuleReference,
  preloadModule,
  requireModule,
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
  | {[key: string]: JSONValue}
  | Array<JSONValue>;

const PENDING = 0;
const RESOLVED = 1;
const ERRORED = 2;

const CHUNK_TYPE = Symbol('flight.chunk');

type PendingChunk = {|
  $$typeof: Symbol,
  status: 0,
  value: Promise<void>,
  resolve: () => void,
|};
type ResolvedChunk<T> = {|
  $$typeof: Symbol,
  status: 1,
  value: T,
  resolve: null,
|};
type ErroredChunk = {|
  $$typeof: Symbol,
  status: 2,
  value: Error,
  resolve: null,
|};
type Chunk<T> = PendingChunk | ResolvedChunk<T> | ErroredChunk;

export type Response<T> = {
  partialRow: string,
  rootChunk: Chunk<T>,
  chunks: Map<number, Chunk<any>>,
  readRoot(): T,
};

function readRoot<T>(): T {
  let response: Response<T> = this;
  let rootChunk = response.rootChunk;
  if (rootChunk.status === RESOLVED) {
    return rootChunk.value;
  } else {
    throw rootChunk.value;
  }
}

export function createResponse<T>(): Response<T> {
  let rootChunk: Chunk<any> = createPendingChunk();
  let chunks: Map<number, Chunk<any>> = new Map();
  chunks.set(0, rootChunk);
  let response = {
    partialRow: '',
    rootChunk,
    chunks: chunks,
    readRoot: readRoot,
  };
  return response;
}

function createPendingChunk(): PendingChunk {
  let resolve: () => void = (null: any);
  let promise = new Promise(r => (resolve = r));
  return {
    $$typeof: CHUNK_TYPE,
    status: PENDING,
    value: promise,
    resolve: resolve,
  };
}

function createErrorChunk(error: Error): ErroredChunk {
  return {
    $$typeof: CHUNK_TYPE,
    status: ERRORED,
    value: error,
    resolve: null,
  };
}

function triggerErrorOnChunk<T>(chunk: Chunk<T>, error: Error): void {
  if (chunk.status !== PENDING) {
    // We already resolved. We didn't expect to see this.
    return;
  }
  let resolve = chunk.resolve;
  let erroredChunk: ErroredChunk = (chunk: any);
  erroredChunk.status = ERRORED;
  erroredChunk.value = error;
  erroredChunk.resolve = null;
  resolve();
}

function createResolvedChunk<T>(value: T): ResolvedChunk<T> {
  return {
    $$typeof: CHUNK_TYPE,
    status: RESOLVED,
    value: value,
    resolve: null,
  };
}

function resolveChunk<T>(chunk: Chunk<T>, value: T): void {
  if (chunk.status !== PENDING) {
    // We already resolved. We didn't expect to see this.
    return;
  }
  let resolve = chunk.resolve;
  let resolvedChunk: ResolvedChunk<T> = (chunk: any);
  resolvedChunk.status = RESOLVED;
  resolvedChunk.value = value;
  resolvedChunk.resolve = null;
  resolve();
}

// Report that any missing chunks in the model is now going to throw this
// error upon read. Also notify any pending promises.
export function reportGlobalError<T>(
  response: Response<T>,
  error: Error,
): void {
  response.chunks.forEach(chunk => {
    // If this chunk was already resolved or errored, it won't
    // trigger an error but if it wasn't then we need to
    // because we won't be getting any new data to resolve it.
    triggerErrorOnChunk(chunk, error);
  });
}

function readMaybeChunk<T>(maybeChunk: Chunk<T> | T): T {
  if (maybeChunk == null || (maybeChunk: any).$$typeof !== CHUNK_TYPE) {
    // $FlowFixMe
    return maybeChunk;
  }
  let chunk: Chunk<T> = (maybeChunk: any);
  if (chunk.status === RESOLVED) {
    return chunk.value;
  } else {
    throw chunk.value;
  }
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
  ModuleMetaData | Chunk<ModuleMetaData>,
  Data | Chunk<Data>,
];

type Thenable<T> = {
  then(resolve: (T) => mixed, reject?: (mixed) => mixed): Thenable<any>,
};

function initializeBlock<Props, Data>(
  tuple: UninitializedBlockPayload<Data>,
): BlockComponent<Props, Data> {
  // Require module first and then data. The ordering matters.
  let moduleMetaData: ModuleMetaData = readMaybeChunk(tuple[1]);
  let moduleReference: ModuleReference<
    BlockRenderFunction<Props, Data>,
  > = resolveModuleReference(moduleMetaData);
  // TODO: Do this earlier, as the chunk is resolved.
  preloadModule(moduleReference);

  let moduleExport = requireModule(moduleReference);

  // The ordering here is important because this call might suspend.
  // We don't want that to prevent the module graph for being initialized.
  let data: Data = readMaybeChunk(tuple[2]);

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
  let lazyType: LazyComponent<
    BlockComponent<Props, Data>,
    UninitializedBlockPayload<Data>,
  > = {
    $$typeof: REACT_LAZY_TYPE,
    _payload: tuple,
    _init: initializeBlock,
  };
  return lazyType;
}

export function parseModelFromJSON<T>(
  response: Response<T>,
  targetObj: Object,
  key: string,
  value: JSONValue,
): mixed {
  if (typeof value === 'string') {
    if (value[0] === '$') {
      if (value === '$') {
        return REACT_ELEMENT_TYPE;
      } else if (value[1] === '$' || value[1] === '@') {
        // This was an escaped string value.
        return value.substring(1);
      } else {
        let id = parseInt(value.substring(1), 16);
        let chunks = response.chunks;
        let chunk = chunks.get(id);
        if (!chunk) {
          chunk = createPendingChunk();
          chunks.set(id, chunk);
        }
        return chunk;
      }
    }
    if (value === '@') {
      return REACT_BLOCK_TYPE;
    }
  }
  if (typeof value === 'object' && value !== null) {
    let tuple: [mixed, mixed, mixed, mixed] = (value: any);
    switch (tuple[0]) {
      case REACT_ELEMENT_TYPE: {
        // TODO: Consider having React just directly accept these arrays as elements.
        // Or even change the ReactElement type to be an array.
        return createElement(tuple[1], tuple[2], tuple[3]);
      }
      case REACT_BLOCK_TYPE: {
        // TODO: Consider having React just directly accept these arrays as blocks.
        return createLazyBlock((tuple: any));
      }
    }
  }
  return value;
}

export function resolveModelChunk<T, M>(
  response: Response<T>,
  id: number,
  model: M,
): void {
  let chunks = response.chunks;
  let chunk = chunks.get(id);
  if (!chunk) {
    chunks.set(id, createResolvedChunk(model));
  } else {
    resolveChunk(chunk, model);
  }
}

export function resolveErrorChunk<T>(
  response: Response<T>,
  id: number,
  message: string,
  stack: string,
): void {
  let error = new Error(message);
  error.stack = stack;
  let chunks = response.chunks;
  let chunk = chunks.get(id);
  if (!chunk) {
    chunks.set(id, createErrorChunk(error));
  } else {
    triggerErrorOnChunk(chunk, error);
  }
}

export function close<T>(response: Response<T>): void {
  // In case there are any remaining unresolved chunks, they won't
  // be resolved now. So we need to issue an error to those.
  // Ideally we should be able to early bail out if we kept a
  // ref count of pending chunks.
  reportGlobalError(response, new Error('Connection closed.'));
}
