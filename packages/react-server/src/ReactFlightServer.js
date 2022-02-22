/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Dispatcher as DispatcherType} from 'react-reconciler/src/ReactInternalTypes';
import type {
  Destination,
  Chunk,
  BundlerConfig,
  ModuleMetaData,
  ModuleReference,
  ModuleKey,
} from './ReactFlightServerConfig';

import {
  scheduleWork,
  beginWriting,
  writeChunk,
  completeWriting,
  flushBuffered,
  close,
  closeWithError,
  processModelChunk,
  processModuleChunk,
  processSymbolChunk,
  processErrorChunk,
  resolveModuleMetaData,
  getModuleKey,
  isModuleReference,
} from './ReactFlightServerConfig';

import {
  REACT_ELEMENT_TYPE,
  REACT_FORWARD_REF_TYPE,
  REACT_FRAGMENT_TYPE,
  REACT_LAZY_TYPE,
  REACT_MEMO_TYPE,
} from 'shared/ReactSymbols';

import ReactSharedInternals from 'shared/ReactSharedInternals';
import isArray from 'shared/isArray';

type ReactJSONValue =
  | string
  | boolean
  | number
  | null
  | $ReadOnlyArray<ReactJSONValue>
  | ReactModelObject;

export type ReactModel =
  | React$Element<any>
  | string
  | boolean
  | number
  | null
  | Iterable<ReactModel>
  | ReactModelObject;

type ReactModelObject = {+[key: string]: ReactModel};

type Segment = {
  id: number,
  model: ReactModel,
  ping: () => void,
};

export type Request = {
  status: 0 | 1 | 2,
  fatalError: mixed,
  destination: null | Destination,
  bundlerConfig: BundlerConfig,
  cache: Map<Function, mixed>,
  nextChunkId: number,
  pendingChunks: number,
  pingedSegments: Array<Segment>,
  completedModuleChunks: Array<Chunk>,
  completedJSONChunks: Array<Chunk>,
  completedErrorChunks: Array<Chunk>,
  writtenSymbols: Map<Symbol, number>,
  writtenModules: Map<ModuleKey, number>,
  onError: (error: mixed) => void,
  toJSON: (key: string, value: ReactModel) => ReactJSONValue,
};

const ReactCurrentDispatcher = ReactSharedInternals.ReactCurrentDispatcher;

function defaultErrorHandler(error: mixed) {
  console['error'](error);
  // Don't transform to our wrapper
}

const OPEN = 0;
const CLOSING = 1;
const CLOSED = 2;

export function createRequest(
  model: ReactModel,
  bundlerConfig: BundlerConfig,
  onError: void | ((error: mixed) => void),
): Request {
  const pingedSegments = [];
  const request = {
    status: OPEN,
    fatalError: null,
    destination: null,
    bundlerConfig,
    cache: new Map(),
    nextChunkId: 0,
    pendingChunks: 0,
    pingedSegments: pingedSegments,
    completedModuleChunks: [],
    completedJSONChunks: [],
    completedErrorChunks: [],
    writtenSymbols: new Map(),
    writtenModules: new Map(),
    onError: onError === undefined ? defaultErrorHandler : onError,
    toJSON: function(key: string, value: ReactModel): ReactJSONValue {
      return resolveModelToJSON(request, this, key, value);
    },
  };
  request.pendingChunks++;
  const rootSegment = createSegment(request, model);
  pingedSegments.push(rootSegment);
  return request;
}

function attemptResolveElement(
  type: any,
  key: null | React$Key,
  ref: mixed,
  props: any,
): ReactModel {
  if (ref !== null && ref !== undefined) {
    // When the ref moves to the regular props object this will implicitly
    // throw for functions. We could probably relax it to a DEV warning for other
    // cases.
    throw new Error(
      'Refs cannot be used in server components, nor passed to client components.',
    );
  }
  if (typeof type === 'function') {
    // This is a server-side component.
    return type(props);
  } else if (typeof type === 'string') {
    // This is a host element. E.g. HTML.
    return [REACT_ELEMENT_TYPE, type, key, props];
  } else if (typeof type === 'symbol') {
    if (type === REACT_FRAGMENT_TYPE) {
      // For key-less fragments, we add a small optimization to avoid serializing
      // it as a wrapper.
      // TODO: If a key is specified, we should propagate its key to any children.
      // Same as if a server component has a key.
      return props.children;
    }
    // This might be a built-in React component. We'll let the client decide.
    // Any built-in works as long as its props are serializable.
    return [REACT_ELEMENT_TYPE, type, key, props];
  } else if (type != null && typeof type === 'object') {
    if (isModuleReference(type)) {
      // This is a reference to a client component.
      return [REACT_ELEMENT_TYPE, type, key, props];
    }
    switch (type.$$typeof) {
      case REACT_FORWARD_REF_TYPE: {
        const render = type.render;
        return render(props, undefined);
      }
      case REACT_MEMO_TYPE: {
        return attemptResolveElement(type.type, key, ref, props);
      }
    }
  }
  throw new Error(
    `Unsupported server component type: ${describeValueForErrorMessage(type)}`,
  );
}

function pingSegment(request: Request, segment: Segment): void {
  const pingedSegments = request.pingedSegments;
  pingedSegments.push(segment);
  if (pingedSegments.length === 1) {
    scheduleWork(() => performWork(request));
  }
}

function createSegment(request: Request, model: ReactModel): Segment {
  const id = request.nextChunkId++;
  const segment = {
    id,
    model,
    ping: () => pingSegment(request, segment),
  };
  return segment;
}

function serializeByValueID(id: number): string {
  return '$' + id.toString(16);
}

function serializeByRefID(id: number): string {
  return '@' + id.toString(16);
}

function escapeStringValue(value: string): string {
  if (value[0] === '$' || value[0] === '@') {
    // We need to escape $ or @ prefixed strings since we use those to encode
    // references to IDs and as special symbol values.
    return '$' + value;
  } else {
    return value;
  }
}

function isObjectPrototype(object): boolean {
  if (!object) {
    return false;
  }
  // $FlowFixMe
  const ObjectPrototype = Object.prototype;
  if (object === ObjectPrototype) {
    return true;
  }
  // It might be an object from a different Realm which is
  // still just a plain simple object.
  if (Object.getPrototypeOf(object)) {
    return false;
  }
  const names = Object.getOwnPropertyNames(object);
  for (let i = 0; i < names.length; i++) {
    if (!(names[i] in ObjectPrototype)) {
      return false;
    }
  }
  return true;
}

function isSimpleObject(object): boolean {
  if (!isObjectPrototype(Object.getPrototypeOf(object))) {
    return false;
  }
  const names = Object.getOwnPropertyNames(object);
  for (let i = 0; i < names.length; i++) {
    const descriptor = Object.getOwnPropertyDescriptor(object, names[i]);
    if (!descriptor) {
      return false;
    }
    if (!descriptor.enumerable) {
      if (
        (names[i] === 'key' || names[i] === 'ref') &&
        typeof descriptor.get === 'function'
      ) {
        // React adds key and ref getters to props objects to issue warnings.
        // Those getters will not be transferred to the client, but that's ok,
        // so we'll special case them.
        continue;
      }
      return false;
    }
  }
  return true;
}

function objectName(object): string {
  const name = Object.prototype.toString.call(object);
  return name.replace(/^\[object (.*)\]$/, function(m, p0) {
    return p0;
  });
}

function describeKeyForErrorMessage(key: string): string {
  const encodedKey = JSON.stringify(key);
  return '"' + key + '"' === encodedKey ? key : encodedKey;
}

function describeValueForErrorMessage(value: ReactModel): string {
  switch (typeof value) {
    case 'string': {
      return JSON.stringify(
        value.length <= 10 ? value : value.substr(0, 10) + '...',
      );
    }
    case 'object': {
      if (isArray(value)) {
        return '[...]';
      }
      const name = objectName(value);
      if (name === 'Object') {
        return '{...}';
      }
      return name;
    }
    case 'function':
      return 'function';
    default:
      // eslint-disable-next-line react-internal/safe-string-coercion
      return String(value);
  }
}

function describeObjectForErrorMessage(
  objectOrArray:
    | {+[key: string | number]: ReactModel}
    | $ReadOnlyArray<ReactModel>,
  expandedName?: string,
): string {
  if (isArray(objectOrArray)) {
    let str = '[';
    // $FlowFixMe: Should be refined by now.
    const array: $ReadOnlyArray<ReactModel> = objectOrArray;
    for (let i = 0; i < array.length; i++) {
      if (i > 0) {
        str += ', ';
      }
      if (i > 6) {
        str += '...';
        break;
      }
      const value = array[i];
      if (
        '' + i === expandedName &&
        typeof value === 'object' &&
        value !== null
      ) {
        str += describeObjectForErrorMessage(value);
      } else {
        str += describeValueForErrorMessage(value);
      }
    }
    str += ']';
    return str;
  } else {
    let str = '{';
    // $FlowFixMe: Should be refined by now.
    const object: {+[key: string | number]: ReactModel} = objectOrArray;
    const names = Object.keys(object);
    for (let i = 0; i < names.length; i++) {
      if (i > 0) {
        str += ', ';
      }
      if (i > 6) {
        str += '...';
        break;
      }
      const name = names[i];
      str += describeKeyForErrorMessage(name) + ': ';
      const value = object[name];
      if (
        name === expandedName &&
        typeof value === 'object' &&
        value !== null
      ) {
        str += describeObjectForErrorMessage(value);
      } else {
        str += describeValueForErrorMessage(value);
      }
    }
    str += '}';
    return str;
  }
}

export function resolveModelToJSON(
  request: Request,
  parent: {+[key: string | number]: ReactModel} | $ReadOnlyArray<ReactModel>,
  key: string,
  value: ReactModel,
): ReactJSONValue {
  if (__DEV__) {
    // $FlowFixMe
    const originalValue = parent[key];
    if (typeof originalValue === 'object' && originalValue !== value) {
      console.error(
        'Only plain objects can be passed to client components from server components. ' +
          'Objects with toJSON methods are not supported. Convert it manually ' +
          'to a simple value before passing it to props. ' +
          'Remove %s from these props: %s',
        describeKeyForErrorMessage(key),
        describeObjectForErrorMessage(parent),
      );
    }
  }

  // Special Symbols
  switch (value) {
    case REACT_ELEMENT_TYPE:
      return '$';
    case REACT_LAZY_TYPE:
      throw new Error(
        'React Lazy Components are not yet supported on the server.',
      );
  }

  // Resolve server components.
  while (
    typeof value === 'object' &&
    value !== null &&
    value.$$typeof === REACT_ELEMENT_TYPE
  ) {
    // TODO: Concatenate keys of parents onto children.
    const element: React$Element<any> = (value: any);
    try {
      // Attempt to render the server component.
      value = attemptResolveElement(
        element.type,
        element.key,
        element.ref,
        element.props,
      );
    } catch (x) {
      if (typeof x === 'object' && x !== null && typeof x.then === 'function') {
        // Something suspended, we'll need to create a new segment and resolve it later.
        request.pendingChunks++;
        const newSegment = createSegment(request, value);
        const ping = newSegment.ping;
        x.then(ping, ping);
        return serializeByRefID(newSegment.id);
      } else {
        logRecoverableError(request, x);
        // Something errored. We'll still send everything we have up until this point.
        // We'll replace this element with a lazy reference that throws on the client
        // once it gets rendered.
        request.pendingChunks++;
        const errorId = request.nextChunkId++;
        emitErrorChunk(request, errorId, x);
        return serializeByRefID(errorId);
      }
    }
  }

  if (value === null) {
    return null;
  }

  if (typeof value === 'object') {
    if (isModuleReference(value)) {
      const moduleReference: ModuleReference<any> = (value: any);
      const moduleKey: ModuleKey = getModuleKey(moduleReference);
      const writtenModules = request.writtenModules;
      const existingId = writtenModules.get(moduleKey);
      if (existingId !== undefined) {
        if (parent[0] === REACT_ELEMENT_TYPE && key === '1') {
          // If we're encoding the "type" of an element, we can refer
          // to that by a lazy reference instead of directly since React
          // knows how to deal with lazy values. This lets us suspend
          // on this component rather than its parent until the code has
          // loaded.
          return serializeByRefID(existingId);
        }
        return serializeByValueID(existingId);
      }
      try {
        const moduleMetaData: ModuleMetaData = resolveModuleMetaData(
          request.bundlerConfig,
          moduleReference,
        );
        request.pendingChunks++;
        const moduleId = request.nextChunkId++;
        emitModuleChunk(request, moduleId, moduleMetaData);
        writtenModules.set(moduleKey, moduleId);
        if (parent[0] === REACT_ELEMENT_TYPE && key === '1') {
          // If we're encoding the "type" of an element, we can refer
          // to that by a lazy reference instead of directly since React
          // knows how to deal with lazy values. This lets us suspend
          // on this component rather than its parent until the code has
          // loaded.
          return serializeByRefID(moduleId);
        }
        return serializeByValueID(moduleId);
      } catch (x) {
        request.pendingChunks++;
        const errorId = request.nextChunkId++;
        emitErrorChunk(request, errorId, x);
        return serializeByValueID(errorId);
      }
    }

    if (__DEV__) {
      if (value !== null && !isArray(value)) {
        // Verify that this is a simple plain object.
        if (objectName(value) !== 'Object') {
          console.error(
            'Only plain objects can be passed to client components from server components. ' +
              'Built-ins like %s are not supported. ' +
              'Remove %s from these props: %s',
            objectName(value),
            describeKeyForErrorMessage(key),
            describeObjectForErrorMessage(parent),
          );
        } else if (!isSimpleObject(value)) {
          console.error(
            'Only plain objects can be passed to client components from server components. ' +
              'Classes or other objects with methods are not supported. ' +
              'Remove %s from these props: %s',
            describeKeyForErrorMessage(key),
            describeObjectForErrorMessage(parent, key),
          );
        } else if (Object.getOwnPropertySymbols) {
          const symbols = Object.getOwnPropertySymbols(value);
          if (symbols.length > 0) {
            console.error(
              'Only plain objects can be passed to client components from server components. ' +
                'Objects with symbol properties like %s are not supported. ' +
                'Remove %s from these props: %s',
              symbols[0].description,
              describeKeyForErrorMessage(key),
              describeObjectForErrorMessage(parent, key),
            );
          }
        }
      }
    }
    return value;
  }

  if (typeof value === 'string') {
    return escapeStringValue(value);
  }

  if (
    typeof value === 'boolean' ||
    typeof value === 'number' ||
    typeof value === 'undefined'
  ) {
    return value;
  }

  if (typeof value === 'function') {
    if (/^on[A-Z]/.test(key)) {
      throw new Error(
        'Event handlers cannot be passed to client component props. ' +
          `Remove ${describeKeyForErrorMessage(
            key,
          )} from these props if possible: ${describeObjectForErrorMessage(
            parent,
          )}
` +
          'If you need interactivity, consider converting part of this to a client component.',
      );
    } else {
      throw new Error(
        'Functions cannot be passed directly to client components ' +
          "because they're not serializable. " +
          `Remove ${describeKeyForErrorMessage(key)} (${value.displayName ||
            value.name ||
            'function'}) from this object, or avoid the entire object: ${describeObjectForErrorMessage(
            parent,
          )}`,
      );
    }
  }

  if (typeof value === 'symbol') {
    const writtenSymbols = request.writtenSymbols;
    const existingId = writtenSymbols.get(value);
    if (existingId !== undefined) {
      return serializeByValueID(existingId);
    }
    const name = value.description;

    if (Symbol.for(name) !== value) {
      throw new Error(
        'Only global symbols received from Symbol.for(...) can be passed to client components. ' +
          `The symbol Symbol.for(${value.description}) cannot be found among global symbols. ` +
          `Remove ${describeKeyForErrorMessage(
            key,
          )} from this object, or avoid the entire object: ${describeObjectForErrorMessage(
            parent,
          )}`,
      );
    }

    request.pendingChunks++;
    const symbolId = request.nextChunkId++;
    emitSymbolChunk(request, symbolId, name);
    writtenSymbols.set(value, symbolId);
    return serializeByValueID(symbolId);
  }

  // $FlowFixMe: bigint isn't added to Flow yet.
  if (typeof value === 'bigint') {
    throw new Error(
      `BigInt (${value}) is not yet supported in client component props. ` +
        `Remove ${describeKeyForErrorMessage(
          key,
        )} from this object or use a plain number instead: ${describeObjectForErrorMessage(
          parent,
        )}`,
    );
  }

  throw new Error(
    `Type ${typeof value} is not supported in client component props. ` +
      `Remove ${describeKeyForErrorMessage(
        key,
      )} from this object, or avoid the entire object: ${describeObjectForErrorMessage(
        parent,
      )}`,
  );
}

function logRecoverableError(request: Request, error: mixed): void {
  const onError = request.onError;
  onError(error);
}

function fatalError(request: Request, error: mixed): void {
  // This is called outside error handling code such as if an error happens in React internals.
  if (request.destination !== null) {
    request.status = CLOSED;
    closeWithError(request.destination, error);
  } else {
    request.status = CLOSING;
    request.fatalError = error;
  }
}

function emitErrorChunk(request: Request, id: number, error: mixed): void {
  // TODO: We should not leak error messages to the client in prod.
  // Give this an error code instead and log on the server.
  // We can serialize the error in DEV as a convenience.
  let message;
  let stack = '';
  try {
    if (error instanceof Error) {
      // eslint-disable-next-line react-internal/safe-string-coercion
      message = String(error.message);
      // eslint-disable-next-line react-internal/safe-string-coercion
      stack = String(error.stack);
    } else {
      message = 'Error: ' + (error: any);
    }
  } catch (x) {
    message = 'An error occurred but serializing the error message failed.';
  }

  const processedChunk = processErrorChunk(request, id, message, stack);
  request.completedErrorChunks.push(processedChunk);
}

function emitModuleChunk(
  request: Request,
  id: number,
  moduleMetaData: ModuleMetaData,
): void {
  const processedChunk = processModuleChunk(request, id, moduleMetaData);
  request.completedModuleChunks.push(processedChunk);
}

function emitSymbolChunk(request: Request, id: number, name: string): void {
  const processedChunk = processSymbolChunk(request, id, name);
  request.completedModuleChunks.push(processedChunk);
}

function retrySegment(request: Request, segment: Segment): void {
  try {
    let value = segment.model;
    while (
      typeof value === 'object' &&
      value !== null &&
      value.$$typeof === REACT_ELEMENT_TYPE
    ) {
      // TODO: Concatenate keys of parents onto children.
      const element: React$Element<any> = (value: any);
      // Attempt to render the server component.
      // Doing this here lets us reuse this same segment if the next component
      // also suspends.
      segment.model = value;
      value = attemptResolveElement(
        element.type,
        element.key,
        element.ref,
        element.props,
      );
    }
    const processedChunk = processModelChunk(request, segment.id, value);
    request.completedJSONChunks.push(processedChunk);
  } catch (x) {
    if (typeof x === 'object' && x !== null && typeof x.then === 'function') {
      // Something suspended again, let's pick it back up later.
      const ping = segment.ping;
      x.then(ping, ping);
      return;
    } else {
      logRecoverableError(request, x);
      // This errored, we need to serialize this error to the
      emitErrorChunk(request, segment.id, x);
    }
  }
}

function performWork(request: Request): void {
  const prevDispatcher = ReactCurrentDispatcher.current;
  const prevCache = currentCache;
  ReactCurrentDispatcher.current = Dispatcher;
  currentCache = request.cache;

  try {
    const pingedSegments = request.pingedSegments;
    request.pingedSegments = [];
    for (let i = 0; i < pingedSegments.length; i++) {
      const segment = pingedSegments[i];
      retrySegment(request, segment);
    }
    if (request.destination !== null) {
      flushCompletedChunks(request, request.destination);
    }
  } catch (error) {
    logRecoverableError(request, error);
    fatalError(request, error);
  } finally {
    ReactCurrentDispatcher.current = prevDispatcher;
    currentCache = prevCache;
  }
}

function flushCompletedChunks(
  request: Request,
  destination: Destination,
): void {
  beginWriting(destination);
  try {
    // We emit module chunks first in the stream so that
    // they can be preloaded as early as possible.
    const moduleChunks = request.completedModuleChunks;
    let i = 0;
    for (; i < moduleChunks.length; i++) {
      request.pendingChunks--;
      const chunk = moduleChunks[i];
      if (!writeChunk(destination, chunk)) {
        request.destination = null;
        i++;
        break;
      }
    }
    moduleChunks.splice(0, i);
    // Next comes model data.
    const jsonChunks = request.completedJSONChunks;
    i = 0;
    for (; i < jsonChunks.length; i++) {
      request.pendingChunks--;
      const chunk = jsonChunks[i];
      if (!writeChunk(destination, chunk)) {
        request.destination = null;
        i++;
        break;
      }
    }
    jsonChunks.splice(0, i);
    // Finally, errors are sent. The idea is that it's ok to delay
    // any error messages and prioritize display of other parts of
    // the page.
    const errorChunks = request.completedErrorChunks;
    i = 0;
    for (; i < errorChunks.length; i++) {
      request.pendingChunks--;
      const chunk = errorChunks[i];
      if (!writeChunk(destination, chunk)) {
        request.destination = null;
        i++;
        break;
      }
    }
    errorChunks.splice(0, i);
  } finally {
    completeWriting(destination);
  }
  flushBuffered(destination);
  if (request.pendingChunks === 0) {
    // We're done.
    close(destination);
  }
}

export function startWork(request: Request): void {
  scheduleWork(() => performWork(request));
}

export function startFlowing(request: Request, destination: Destination): void {
  if (request.status === CLOSING) {
    request.status = CLOSED;
    closeWithError(destination, request.fatalError);
    return;
  }
  if (request.status === CLOSED) {
    return;
  }
  request.destination = destination;
  try {
    flushCompletedChunks(request, destination);
  } catch (error) {
    logRecoverableError(request, error);
    fatalError(request, error);
  }
}

function unsupportedHook(): void {
  throw new Error('This Hook is not supported in Server Components.');
}

function unsupportedRefresh(): void {
  if (!currentCache) {
    throw new Error(
      'Refreshing the cache is not supported in Server Components.',
    );
  }
}

let currentCache: Map<Function, mixed> | null = null;

const Dispatcher: DispatcherType = {
  useMemo<T>(nextCreate: () => T): T {
    return nextCreate();
  },
  useCallback<T>(callback: T): T {
    return callback;
  },
  useDebugValue(): void {},
  useDeferredValue: (unsupportedHook: any),
  useTransition: (unsupportedHook: any),
  getCacheForType<T>(resourceType: () => T): T {
    if (!currentCache) {
      throw new Error('Reading the cache is only supported while rendering.');
    }

    let entry: T | void = (currentCache.get(resourceType): any);
    if (entry === undefined) {
      entry = resourceType();
      // TODO: Warn if undefined?
      currentCache.set(resourceType, entry);
    }
    return entry;
  },
  readContext: (unsupportedHook: any),
  useContext: (unsupportedHook: any),
  useReducer: (unsupportedHook: any),
  useRef: (unsupportedHook: any),
  useState: (unsupportedHook: any),
  useInsertionEffect: (unsupportedHook: any),
  useLayoutEffect: (unsupportedHook: any),
  useImperativeHandle: (unsupportedHook: any),
  useEffect: (unsupportedHook: any),
  useId: (unsupportedHook: any),
  useMutableSource: (unsupportedHook: any),
  useSyncExternalStore: (unsupportedHook: any),
  useCacheRefresh(): <T>(?() => T, ?T) => void {
    return unsupportedRefresh;
  },
};
