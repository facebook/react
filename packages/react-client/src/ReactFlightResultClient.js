/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {
  ServerReferenceMetadata,
  Result,
  ModelReference,
} from 'shared/ReactFlightResult';
import type {TemporaryReferenceSet} from './ReactFlightTemporaryReferences';
import type {
  CallServerCallback,
  EncodeFormActionCallback,
} from './ReactFlightReplyClient';
import {readTemporaryReference} from './ReactFlightTemporaryReferences';
import {
  createBoundServerReference,
  registerBoundServerReference,
  createServerObjectReference,
} from './ReactFlightReplyClient';
import type {ReactElement} from 'shared/ReactElementType';
import type {LazyComponent} from 'react/src/ReactLazy';
import type {ReactDebugInfo, Thenable, Wakeable} from 'shared/ReactTypes';
import type {
  ClientReference,
  ClientReferenceMetadata,
  ServerConsumerModuleMap,
  ModuleLoading,
  ServerManifest,
} from './ReactFlightClientConfig';
import {
  getIteratorEntries,
  getTemporaryReference,
  getServerReference,
  getRoot,
  getHintQueue,
  waitForHints,
  getErrorReference,
  isHalted,
  hasFormDataBlobs,
  getValueReference,
  getCollectionEntries,
  getModelInfo,
  MODEL_KIND_MASK,
  MODEL_OBJECT,
  MODEL_ARRAY,
  MODEL_ELEMENT,
} from 'shared/ReactFlightResult';
import {
  dispatchHint,
  resolveClientReference,
  resolveServerReference,
  prepareDestinationForModule,
  preloadModule,
  requireModule,
} from './ReactFlightClientConfig';
import {REACT_ELEMENT_TYPE, REACT_LAZY_TYPE} from 'shared/ReactSymbols';
import isArray from 'shared/isArray';
import getPrototypeOf from 'shared/getPrototypeOf';
import noop from 'shared/noop';
import {describeObjectForErrorMessage} from 'shared/ReactSerializationErrors';

const ObjectPrototype = Object.prototype;

type ModelPreload = {
  model: Object,
  index: number,
  lowlink: number,
  onStack: boolean,
  cacheable: boolean,
  chunk: null | SomeChunk<void>,
  dependencies: null | Set<Wakeable>,
};

type PreloadState = {
  nextIndex: number,
  parent: null | ModelPreload,
  stack: Array<ModelPreload>,
};

type PreloadDependencies = {
  dependencies: null | Set<Wakeable>,
  ...
};

type ModelSubscription = {
  response: null | Response,
  resolve: null | (any => mixed),
  reject: null | (mixed => mixed),
};

export type Response = {
  _result: Result<any>,
  _bundlerConfig: ServerConsumerModuleMap,
  _serverReferenceConfig: null | ServerManifest,
  _callServer: CallServerCallback,
  _encodeFormAction: void | EncodeFormActionCallback,
  _tempRefs: void | TemporaryReferenceSet,
  _moduleLoading: ModuleLoading,
  _nonce: void | string,
  _resolveClientReferenceMetadata: Object => null | ClientReferenceMetadata,
  _onError: mixed => ?string,
  _allowPartialStream: boolean,
  _modules: Map<Object, SomeChunk<any>>,
  _closed: boolean,
  _closedReason: null | Error,
  _disposed: boolean,
  _subscriptions: null | Set<ModelSubscription>,
  _cleanups: null | Set<() => void>,
  _models: Map<Object, any>,
  _preloads: Map<Object, ModelPreload>,
  _chunks: Set<SomeChunk<any>>,
  _completedElements: Array<ReactElement>, // DEV-only
  _debugFindSourceMapURL: void | ((string, string) => null | string), // DEV-only
};

export function createResponse(
  result: Result<any>,
  bundlerConfig: ServerConsumerModuleMap,
  serverReferenceConfig: null | ServerManifest,
  moduleLoading: ModuleLoading,
  resolveClientReferenceMetadata: Object => null | ClientReferenceMetadata,
  callServer: CallServerCallback,
  encodeFormAction: void | EncodeFormActionCallback,
  nonce: void | string,
  temporaryReferences: void | TemporaryReferenceSet,
  onError: void | (mixed => ?string),
  allowPartialStream: boolean = false,
  findSourceMapURL?: (string, string) => null | string,
): Response {
  const response: Response = {
    _result: result,
    _bundlerConfig: bundlerConfig,
    _serverReferenceConfig: serverReferenceConfig,
    _callServer: callServer,
    _encodeFormAction: encodeFormAction,
    _tempRefs: temporaryReferences,
    _moduleLoading: moduleLoading,
    _nonce: nonce,
    _resolveClientReferenceMetadata: resolveClientReferenceMetadata,
    _onError: onError || defaultErrorHandler,
    _allowPartialStream: allowPartialStream,
    _modules: new Map(),
    _closed: false,
    _closedReason: null,
    _disposed: false,
    _subscriptions: null,
    _cleanups: null,
    _models: new Map(),
    _preloads: new Map(),
    _chunks: new Set(),
  } as any;
  if (__DEV__) {
    response._completedElements = [];
    response._debugFindSourceMapURL = findSourceMapURL;
  }
  return response;
}

type PendingChunk<T> = {
  _debugInfo: ReactDebugInfo, // DEV-only
  status: 'pending',
  value: null | Array<(T) => mixed>,
  reason: null | Array<(mixed) => mixed>,
  then(resolve: (T) => mixed, reject?: (mixed) => mixed): void,
};

type InitializedChunk<T> = {
  _debugInfo: ReactDebugInfo, // DEV-only
  status: 'fulfilled',
  value: T,
  reason: null,
  then(resolve: (T) => mixed, reject?: (mixed) => mixed): void,
};

type BlockedChunk<T> = {
  _debugInfo: ReactDebugInfo, // DEV-only
  status: 'blocked',
  value: null | Array<(T) => mixed>,
  reason: null | Array<(mixed) => mixed>,
  then(resolve: (T) => mixed, reject?: (mixed) => mixed): void,
};

type ResolvedModelChunk<T> = {
  _debugInfo: ReactDebugInfo, // DEV-only
  status: 'resolved_model',
  value: T,
  reason: Response,
  then(resolve: (T) => mixed, reject?: (mixed) => mixed): void,
};

type ResolvedModuleChunk<T> = {
  _debugInfo: ReactDebugInfo, // DEV-only
  status: 'resolved_module',
  value: ClientReference<T>,
  reason: null,
  then(resolve: (T) => mixed, reject?: (mixed) => mixed): void,
};

type ErroredChunk<T> = {
  _debugInfo: ReactDebugInfo, // DEV-only
  status: 'rejected',
  value: null,
  reason: mixed,
  then(resolve: (T) => mixed, reject?: (mixed) => mixed): void,
};

type SomeChunk<T> =
  | PendingChunk<T>
  | BlockedChunk<T>
  | ResolvedModelChunk<T>
  | ResolvedModuleChunk<T>
  | InitializedChunk<T>
  | ErroredChunk<T>;

const PENDING = 'pending';
const RESOLVED_MODULE = 'resolved_module';
const RESOLVED_MODEL = 'resolved_model';
const BLOCKED = 'blocked';
const INITIALIZED = 'fulfilled';
const ERRORED = 'rejected';

function ReactPromise(this: any, status: any, value: any, reason: any) {
  this.status = status;
  this.value = value;
  this.reason = reason;
  if (__DEV__) {
    this._debugInfo = [];
  }
}
ReactPromise.prototype = Object.create(Promise.prototype) as any;

function reactPromiseThen<T>(
  this: SomeChunk<T>,
  resolve: T => mixed,
  reject?: mixed => mixed,
): void {
  const chunk = this;
  if (chunk.status === RESOLVED_MODEL) {
    initializeResolvedModelChunk(chunk);
  } else if (chunk.status === RESOLVED_MODULE) {
    initializeModuleChunk(chunk);
  }
  switch (chunk.status) {
    case INITIALIZED:
      if (typeof resolve === 'function') {
        resolve(chunk.value);
      }
      break;
    case PENDING:
    case BLOCKED:
      if (typeof resolve === 'function') {
        if (chunk.value === null) {
          chunk.value = [];
        }
        chunk.value.push(resolve);
      }
      if (typeof reject === 'function') {
        if (chunk.reason === null) {
          chunk.reason = [];
        }
        chunk.reason.push(reject);
      }
      break;
    default:
      if (typeof reject === 'function') {
        reject(chunk.reason);
      }
      break;
  }
}

Object.defineProperty(ReactPromise.prototype, 'then', {
  writable: true,
  enumerable: true,
  configurable: true,
  value: reactPromiseThen,
});

function createPendingChunk<T>(response: Response): SomeChunk<T> {
  // $FlowFixMe[invalid-constructor] Flow doesn't support functions as constructors
  const chunk = new ReactPromise(PENDING, null, null);
  response._chunks.add(chunk);
  if (response._closed) {
    triggerErrorOnChunk(chunk, getClosedReason(response));
  }
  return chunk;
}

function createBlockedChunk<T>(response: Response): SomeChunk<T> {
  // $FlowFixMe[invalid-constructor] Flow doesn't support functions as constructors
  const chunk = new ReactPromise(BLOCKED, null, null);
  response._chunks.add(chunk);
  return chunk;
}

function createErrorChunk<T>(error: mixed): SomeChunk<T> {
  // $FlowFixMe[invalid-constructor] Flow doesn't support functions as constructors
  return new ReactPromise(ERRORED, null, error);
}

function wakeChunk<T>(listeners: Array<(T) => mixed>, value: T): void {
  for (let i = 0; i < listeners.length; i++) {
    listeners[i](value);
  }
}

function rejectChunk(listeners: Array<(mixed) => mixed>, error: mixed): void {
  for (let i = 0; i < listeners.length; i++) {
    listeners[i](error);
  }
}

function wakeChunkIfInitialized<T>(
  chunk: SomeChunk<T>,
  resolveListeners: Array<(T) => mixed>,
  rejectListeners: null | Array<(mixed) => mixed>,
): void {
  switch (chunk.status) {
    case INITIALIZED:
      wakeChunk(resolveListeners, chunk.value);
      break;
    case ERRORED:
      if (rejectListeners !== null) {
        rejectChunk(rejectListeners, chunk.reason);
      }
      break;
    case PENDING:
    case BLOCKED:
      if (chunk.value === null) {
        chunk.value = resolveListeners;
      } else {
        for (let i = 0; i < resolveListeners.length; i++) {
          chunk.value.push(resolveListeners[i]);
        }
      }
      if (rejectListeners !== null) {
        if (chunk.reason === null) {
          chunk.reason = rejectListeners;
        } else {
          for (let i = 0; i < rejectListeners.length; i++) {
            chunk.reason.push(rejectListeners[i]);
          }
        }
      }
      break;
  }
}

function initializeChunk<T>(chunk: SomeChunk<T>, value: T): void {
  if (chunk.status !== PENDING && chunk.status !== BLOCKED) {
    return;
  }
  const resolveListeners = chunk.value;
  const initializedChunk: InitializedChunk<T> = chunk as any;
  initializedChunk.status = INITIALIZED;
  initializedChunk.value = value;
  initializedChunk.reason = null;
  if (resolveListeners !== null) {
    wakeChunk(resolveListeners, value);
  }
}

function triggerErrorOnChunk<T>(chunk: SomeChunk<T>, error: mixed): void {
  if (
    chunk.status !== PENDING &&
    chunk.status !== BLOCKED &&
    chunk.status !== RESOLVED_MODEL &&
    chunk.status !== RESOLVED_MODULE
  ) {
    return;
  }
  const listeners =
    chunk.status === PENDING || chunk.status === BLOCKED ? chunk.reason : null;
  const erroredChunk: ErroredChunk<T> = chunk as any;
  erroredChunk.status = ERRORED;
  erroredChunk.value = null;
  erroredChunk.reason = error;
  if (listeners !== null) {
    rejectChunk(listeners, error);
  }
}

function getClosedReason(response: Response): Error {
  let error = response._closedReason;
  if (error === null) {
    response._closedReason = error = new Error('Connection closed.');
  }
  return error;
}

function isHaltedModel(response: Response, model: Object): boolean {
  return !response._allowPartialStream && isHalted(response._result, model);
}

function reportGlobalError(response: Response, error: Error): void {
  if (response._closed) {
    return;
  }
  response._closed = true;
  response._closedReason = error;
  response._chunks.forEach(chunk => triggerErrorOnChunk(chunk, error));
}

export function stopReading(response: Response, reason: mixed): void {
  if (response._disposed) {
    return;
  }
  response._disposed = true;
  const error =
    reason instanceof Error ? reason : new Error('Connection closed.');
  const subscriptions = response._subscriptions;
  if (subscriptions !== null) {
    subscriptions.forEach(subscription =>
      detachModelSubscription(subscription),
    );
    response._subscriptions = null;
  }
  const cleanups = response._cleanups;
  if (cleanups !== null) {
    cleanups.forEach(cleanup => cleanup());
    response._cleanups = null;
  }
  reportGlobalError(response, error);
}

export function addResponseCleanup(
  response: Response,
  cleanup: () => void,
): void {
  if (response._disposed) {
    cleanup();
    return;
  }
  let cleanups = response._cleanups;
  if (cleanups === null) {
    response._cleanups = cleanups = new Set();
  }
  cleanups.add(cleanup);
}

function detachModelSubscription(subscription: ModelSubscription): void {
  const response = subscription.response;
  subscription.response = null;
  subscription.resolve = null;
  subscription.reject = null;
  if (response !== null && response._subscriptions !== null) {
    response._subscriptions.delete(subscription);
  }
}

function subscribeToModel(
  response: Response,
  source: Thenable<any> | Promise<any> | Wakeable,
  resolve: any => mixed,
  reject: mixed => mixed,
): void {
  if (response._disposed) {
    return;
  }
  const subscription: ModelSubscription = {response, resolve, reject};
  let subscriptions = response._subscriptions;
  if (subscriptions === null) {
    response._subscriptions = subscriptions = new Set();
  }
  subscriptions.add(subscription);
  source.then(
    model => {
      const onResolve = subscription.resolve;
      detachModelSubscription(subscription);
      if (onResolve !== null) {
        onResolve(model);
      }
    },
    error => {
      const onReject = subscription.reject;
      detachModelSubscription(subscription);
      if (onReject !== null) {
        onReject(error);
      }
    },
  );
}

function readChunk<T>(chunk: SomeChunk<T>): T {
  if (chunk.status === RESOLVED_MODEL) {
    initializeResolvedModelChunk(chunk);
  } else if (chunk.status === RESOLVED_MODULE) {
    initializeModuleChunk(chunk);
  }
  switch (chunk.status) {
    case INITIALIZED:
      return chunk.value;
    case PENDING:
    case BLOCKED:
      throw chunk;
    default:
      throw chunk.reason;
  }
}

function createLazyChunkWrapper<T>(
  chunk: SomeChunk<T>,
): LazyComponent<T, SomeChunk<T>> {
  const lazy: LazyComponent<T, SomeChunk<T>> = {
    $$typeof: REACT_LAZY_TYPE,
    _payload: chunk,
    _init: readChunk,
  };
  if (__DEV__) {
    lazy._debugInfo = chunk._debugInfo;
  }
  return lazy;
}

function initializeModuleChunk<T>(chunk: ResolvedModuleChunk<T>): void {
  try {
    const value = requireModule(chunk.value);
    const initializedChunk: InitializedChunk<T> = chunk as any;
    initializedChunk.status = INITIALIZED;
    initializedChunk.value = value;
    initializedChunk.reason = null;
  } catch (error) {
    const erroredChunk: ErroredChunk<T> = chunk as any;
    erroredChunk.status = ERRORED;
    erroredChunk.reason = error;
  }
}

function resolveModuleChunk<T>(
  chunk: SomeChunk<T>,
  clientReference: ClientReference<T>,
): void {
  if (chunk.status !== PENDING && chunk.status !== BLOCKED) {
    return;
  }
  const resolveListeners = chunk.value;
  const rejectListeners = chunk.reason;
  const resolvedChunk: ResolvedModuleChunk<T> = chunk as any;
  resolvedChunk.status = RESOLVED_MODULE;
  resolvedChunk.value = clientReference;
  resolvedChunk.reason = null;
  if (resolveListeners !== null) {
    initializeModuleChunk(resolvedChunk);
    wakeChunkIfInitialized(chunk, resolveListeners, rejectListeners);
  }
}

function defaultErrorHandler(error: mixed): void {
  console['error'](error);
}

function resolveClientReferenceError(response: Response, error: mixed): Error {
  const digest = response._onError(error);
  if (digest != null && typeof digest !== 'string') {
    // eslint-disable-next-line react-internal/prod-error-codes
    throw new Error(
      `onError returned something with a type other than "string". onError should return a string and may return null or undefined but must not return anything else. It received something of type "${typeof digest}" instead`,
    );
  }
  let resolvedError;
  if (__DEV__) {
    if (error instanceof Error) {
      // eslint-disable-next-line react-internal/prod-error-codes
      resolvedError = new Error(error.message);
      resolvedError.name = error.name;
      resolvedError.stack = error.stack;
    } else {
      const message =
        typeof error === 'object' && error !== null
          ? describeObjectForErrorMessage(error)
          : // eslint-disable-next-line react-internal/safe-string-coercion
            String(error);
      // eslint-disable-next-line react-internal/prod-error-codes
      resolvedError = new Error(message);
    }
  } else {
    resolvedError = resolveErrorProd(response);
  }
  (resolvedError as any).digest = digest || '';
  return resolvedError;
}

function resolveModule(
  response: Response,
  reference: Object,
): null | SomeChunk<any> {
  const existingChunk = response._modules.get(reference);
  if (existingChunk !== undefined) {
    return existingChunk;
  }
  let chunk;
  try {
    let metadata;
    try {
      metadata = response._resolveClientReferenceMetadata(reference);
    } catch (error) {
      chunk = createPendingChunk<any>(response);
      response._modules.set(reference, chunk);
      try {
        triggerErrorOnChunk(
          chunk,
          resolveClientReferenceError(response, error),
        );
      } catch (fatalError) {
        stopReading(response, fatalError);
      }
      return chunk;
    }
    if (metadata === null) {
      const serverReferenceMetadata = getServerReference(
        response._result,
        reference,
      );
      if (serverReferenceMetadata === undefined) {
        return null;
      }
      chunk = createBlockedChunk<any>(response);
      response._modules.set(reference, chunk);
      if (response._closed) {
        triggerErrorOnChunk(chunk, getClosedReason(response));
        return chunk;
      }
      loadServerReference(response, serverReferenceMetadata, chunk);
      return chunk;
    }
    chunk = createPendingChunk<any>(response);
    response._modules.set(reference, chunk);
    if (response._closed) {
      return chunk;
    }
    const clientReference = resolveClientReference<any>(
      response._bundlerConfig,
      metadata,
    );
    prepareDestinationForModule(
      response._moduleLoading,
      response._nonce,
      metadata,
    );
    const promise = preloadModule(clientReference);
    if (promise) {
      subscribeToModel(
        response,
        promise,
        resolveModuleChunk.bind(null, chunk, clientReference),
        triggerErrorOnChunk.bind(null, chunk),
      );
    } else {
      resolveModuleChunk(chunk, clientReference);
    }
  } catch (error) {
    if (chunk === undefined) {
      chunk = createPendingChunk<any>(response);
      response._modules.set(reference, chunk);
    }
    triggerErrorOnChunk(chunk, error);
  }
  return chunk;
}

function createElementStore(validated: 0 | 1 | 2): {validated: 0 | 1 | 2} {
  const store = {validated};
  Object.defineProperty(store, 'validated', {
    configurable: false,
    enumerable: false,
    writable: true,
    value: validated,
  });
  return store;
}

function createElement(
  response: Response,
  element: ReactElement,
  registerModel: boolean,
): ReactElement {
  let resolvedElement: ReactElement;
  if (__DEV__) {
    resolvedElement = {
      $$typeof: REACT_ELEMENT_TYPE,
      type: element.type,
      key: element.key,
      props: element.props,
      _owner: element._owner,
      _store: createElementStore(element._store.validated),
    } as any;
    Object.defineProperties(resolvedElement, {
      ref: {value: null},
      _debugInfo: {
        value: isArray(element._debugInfo)
          ? element._debugInfo.slice()
          : element._debugInfo,
        writable: true,
      },
      _debugStack: {value: element._debugStack, writable: true},
      _debugTask: {value: element._debugTask, writable: true},
    });
  } else {
    resolvedElement = {
      $$typeof: REACT_ELEMENT_TYPE,
      type: element.type,
      key: element.key,
      ref: null,
      props: element.props,
    } as any;
  }
  if (registerModel) {
    response._models.set(element, resolvedElement);
  }
  const type = element.type;
  const moduleChunk =
    type !== null && (typeof type === 'object' || typeof type === 'function')
      ? resolveModule(response, type)
      : null;
  if (moduleChunk !== null) {
    resolvedElement.type = createLazyChunkWrapper(moduleChunk);
  } else if (
    type !== null &&
    (typeof type === 'object' || typeof type === 'function') &&
    resolveTemporaryReference(response, type as any)
  ) {
    resolvedElement.type = response._models.get(type);
  }
  resolvedElement.props = readModel(response, element.props);
  if (__DEV__) {
    response._completedElements.push(resolvedElement);
  }
  return resolvedElement;
}

function readElement(
  response: Response,
  element: ReactElement,
): ReactElement | LazyComponent<ReactElement, SomeChunk<ReactElement>> {
  const type = element.type;
  if (
    type !== null &&
    (typeof type === 'object' || typeof type === 'function')
  ) {
    resolveModule(response, type);
  }
  let promise;
  try {
    promise = preloadModel(response, element.props);
  } catch (error) {
    const chunk = createPendingChunk<ReactElement>(response);
    const lazy = createLazyChunkWrapper(chunk);
    response._models.set(element, lazy);
    triggerErrorOnChunk(chunk, error);
    return lazy;
  }
  if (promise === null) {
    return createElement(response, element, true);
  }
  const chunk = createPendingChunk<ReactElement>(response);
  const lazy = createLazyChunkWrapper(chunk);
  response._models.set(element, lazy);
  subscribeToModel(
    response,
    promise,
    () => {
      if (response._closed) {
        return;
      }
      try {
        initializeChunk(chunk, createElement(response, element, false));
      } catch (error) {
        triggerErrorOnChunk(chunk, error);
      } finally {
        freezeCompletedElements(response);
      }
    },
    error => triggerErrorOnChunk(chunk, error),
  );
  return lazy;
}

function isLazyModel(response: Response, model: any): boolean {
  return (
    model !== null &&
    typeof model === 'object' &&
    model.$$typeof === REACT_LAZY_TYPE &&
    getModelInfo(response._result, model) === 0
  );
}

function isElementModel(response: Response, model: any): boolean {
  if (
    model === null ||
    typeof model !== 'object' ||
    model.$$typeof !== REACT_ELEMENT_TYPE
  ) {
    return false;
  }
  const kind = getModelInfo(response._result, model) & MODEL_KIND_MASK;
  return kind === 0 || kind === MODEL_ELEMENT;
}

function readModelReference(
  response: Response,
  reference: ModelReference,
  visitElement?: ReactElement => void,
): any {
  const source = reference.root;
  if (source.status !== 'fulfilled') {
    if (source.status === 'rejected') {
      throw resolveError(response, source, source.reason);
    }
    throw source;
  }
  const keys = [];
  let location = reference;
  let parent = location.parent;
  while (parent !== null) {
    keys.push(location.key);
    location = parent;
    parent = location.parent;
  }
  let model: any = source.value;
  for (let i = keys.length; i >= 0; i--) {
    while (isLazyModel(response, model)) {
      const lazy = model;
      try {
        model = lazy._init(lazy._payload);
      } catch (error) {
        throw resolveError(response, lazy._payload, error);
      }
    }
    if (visitElement !== undefined && isElementModel(response, model)) {
      visitElement(model);
    }
    if (i > 0) {
      model = model[keys[i - 1]];
    }
  }
  return model;
}

function readModel(response: Response, value: any): any {
  if (
    value === null ||
    (typeof value !== 'object' && typeof value !== 'function')
  ) {
    return value;
  }
  const models = response._models;
  const existingModel = models.get(value);
  if (existingModel !== undefined) {
    return existingModel;
  }
  const reference = getValueReference(response._result, value);
  if (reference !== undefined) {
    const model = readModel(response, readModelReference(response, reference));
    models.set(value, model);
    return model;
  }
  switch (getModelInfo(response._result, value) & MODEL_KIND_MASK) {
    case MODEL_OBJECT:
      return readObject(response, value);
    case MODEL_ARRAY:
      return readArray(response, value);
    case MODEL_ELEMENT:
      return readElement(response, value);
  }
  if (isArray(value)) {
    return readArray(response, value);
  }
  return readSpecialModel(response, value);
}

function readArray(response: Response, value: Array<any>): Array<any> {
  const copy: Array<any> = new Array(value.length);
  response._models.set(value, copy);
  for (let i = 0; i < value.length; i++) {
    copy[i] = readModel(response, value[i]);
  }
  return copy;
}

function readObject(response: Response, object: {[key: string]: any}): any {
  const copy: {[key: string]: any} = {};
  response._models.set(object, copy);
  const keys = Object.keys(object);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const child = readModel(response, object[key]);
    if (key === '__proto__') {
      Object.defineProperty(copy, key, {
        value: child,
        enumerable: true,
        writable: true,
        configurable: true,
      });
    } else {
      copy[key] = child;
    }
  }
  return copy;
}

function readSpecialModel(response: Response, value: any): any {
  if (resolveTemporaryReference(response, value)) {
    return response._models.get(value);
  }
  const moduleChunk = resolveModule(response, value);
  if (moduleChunk !== null) {
    return readChunk(moduleChunk);
  }
  if (value.$$typeof === REACT_ELEMENT_TYPE) {
    return readElement(response, value);
  } else if (value.$$typeof === REACT_LAZY_TYPE) {
    const chunk = createPendingChunk<any>(response);
    const lazy = createLazyChunkWrapper(chunk);
    if (__DEV__) {
      const store = value._store;
      lazy._store =
        store === undefined ? undefined : createElementStore(store.validated);
    }
    response._models.set(value, lazy);
    const source = value._payload;
    if (response._closed || isHaltedModel(response, source)) {
      triggerErrorOnChunk(chunk, getClosedReason(response));
      return lazy;
    }
    subscribeToModel(
      response,
      source,
      model => resolveModelChunk(response, chunk, model),
      error =>
        triggerErrorOnChunk(chunk, resolveError(response, source, error)),
    );
    return lazy;
  } else if (typeof value.then === 'function') {
    const chunk = createPendingChunk<any>(response);
    response._models.set(value, chunk);
    if (response._closed || isHaltedModel(response, value)) {
      triggerErrorOnChunk(chunk, getClosedReason(response));
      return chunk;
    }
    subscribeToModel(
      response,
      value,
      model => resolveModelChunk(response, chunk, model),
      error => triggerErrorOnChunk(chunk, resolveError(response, value, error)),
    );
    return chunk;
  }
  if (value instanceof Date) {
    return value;
  }
  if (value instanceof ArrayBuffer || ArrayBuffer.isView(value)) {
    return value;
  }
  if (value instanceof Map) {
    const copy: Map<any, any> = new Map();
    response._models.set(value, copy);
    const model = getCollectionEntries(response._result, value);
    if (model !== undefined) {
      const entries = readModel(
        response,
        readModelReference(response, {root: model, parent: null, key: ''}),
      );
      for (let i = 0; i < entries.length; i++) {
        copy.set(entries[i][0], entries[i][1]);
      }
      return copy;
    }
    value.forEach((child: any, key: any) => {
      copy.set(readModel(response, key), readModel(response, child));
    });
    return copy;
  }
  if (value instanceof Set) {
    const copy: Set<any> = new Set();
    response._models.set(value, copy);
    const model = getCollectionEntries(response._result, value);
    if (model !== undefined) {
      const entries = readModel(
        response,
        readModelReference(response, {root: model, parent: null, key: ''}),
      );
      for (let i = 0; i < entries.length; i++) {
        copy.add(entries[i]);
      }
      return copy;
    }
    value.forEach((child: any) => {
      copy.add(readModel(response, child));
    });
    return copy;
  }
  const iteratorEntries = getIteratorEntries(response._result, value);
  if (iteratorEntries !== undefined) {
    const copy: Array<any> = [];
    const iterator = copy.values();
    response._models.set(value, iterator);
    for (let i = 0; i < iteratorEntries.length; i++) {
      copy[i] = readModel(response, iteratorEntries[i]);
    }
    return iterator;
  }
  if (typeof FormData === 'function' && value instanceof FormData) {
    if (!hasFormDataBlobs(response._result, value)) {
      return value;
    }
    const formData: FormData = value;
    const entries = Array.from(formData.entries());
    const copy = new FormData();
    response._models.set(value, copy);
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      copy.append(entry[0], readModel(response, entry[1]));
    }
    return copy;
  }
  if (typeof Blob === 'function' && value instanceof Blob) {
    const copy = new Blob([value], {type: value.type});
    response._models.set(value, copy);
    return copy;
  }
  if (getPrototypeOf(value) === ObjectPrototype) {
    return readObject(response, value);
  }
  throw new Error('Not implemented.');
}

function resolveModelChunk<T>(
  response: Response,
  chunk: SomeChunk<T>,
  model: T,
): void {
  if (chunk.status !== PENDING) {
    return;
  }
  const resolveListeners = chunk.value;
  const rejectListeners = chunk.reason;
  const resolvedChunk: ResolvedModelChunk<T> = chunk as any;
  resolvedChunk.status = RESOLVED_MODEL;
  resolvedChunk.value = model;
  resolvedChunk.reason = response;
  if (resolveListeners !== null) {
    initializeResolvedModelChunk(resolvedChunk);
    wakeChunkIfInitialized(chunk, resolveListeners, rejectListeners);
  }
}

function initializeResolvedModelChunk<T>(chunk: ResolvedModelChunk<T>): void {
  const model = chunk.value;
  const response = chunk.reason;
  const blockedChunk: BlockedChunk<T> = chunk as any;
  blockedChunk.status = BLOCKED;
  blockedChunk.value = null;
  blockedChunk.reason = null;
  initializeModelChunk(response, blockedChunk, model);
}

function freezeCompletedElements(response: Response): void {
  if (__DEV__) {
    const elements = response._completedElements;
    for (let i = 0; i < elements.length; i++) {
      Object.freeze(elements[i].props);
      Object.freeze(elements[i]);
    }
    elements.length = 0;
  }
}

function completeModel(response: Response, model: any): any {
  try {
    return readModel(response, model);
  } finally {
    freezeCompletedElements(response);
  }
}

function initializeModelChunk<T>(
  response: Response,
  chunk: SomeChunk<T>,
  model: any,
): void {
  if (response._closed) {
    return;
  }
  try {
    const promise = preloadModel(response, model);
    if (promise === null) {
      initializeChunk(chunk, completeModel(response, model));
    } else {
      subscribeToModel(
        response,
        promise,
        () => {
          if (response._closed) {
            return;
          }
          try {
            initializeChunk(chunk, completeModel(response, model));
          } catch (error) {
            triggerErrorOnChunk(chunk, error);
          }
        },
        error => triggerErrorOnChunk(chunk, error),
      );
    }
  } catch (error) {
    triggerErrorOnChunk(chunk, error);
  }
}

function waitForOutlinedModel(
  response: Response,
  model: any,
  wakeable: Wakeable,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    function retry() {
      try {
        const pending = preloadModel(response, model, true);
        if (pending === null) {
          resolve();
        } else {
          subscribeToModel(response, pending, resolve, reject);
        }
      } catch (error) {
        reject(error);
      }
    }
    subscribeToModel(response, wakeable, retry, retry);
  });
}

function scanOutlinedModel(
  response: Response,
  model: any,
  state: PreloadState,
  chunks: PreloadDependencies,
): void {
  let value = model;
  while (isLazyModel(response, value)) {
    const lazy = value;
    try {
      value = lazy._init(lazy._payload);
    } catch (error) {
      const wakeable = error as Wakeable;
      if (isHaltedModel(response, lazy._payload)) {
        throw getClosedReason(response);
      }
      if (
        lazy._payload.status !== 'rejected' &&
        error !== null &&
        typeof error === 'object' &&
        // $FlowFixMe[method-unbinding]
        typeof wakeable.then === 'function'
      ) {
        if (state.parent !== null) {
          state.parent.cacheable = false;
        }
        addPreloadDependency(
          chunks,
          waitForOutlinedModel(response, model, wakeable),
        );
        return;
      }
      throw resolveError(response, lazy._payload, error);
    }
  }
  if (isElementModel(response, value)) {
    const type = value.type;
    if (
      type !== null &&
      (typeof type === 'object' || typeof type === 'function')
    ) {
      resolveModule(response, type);
    }
    scanModel(response, value.props, state, chunks);
  } else {
    scanModel(response, value, state, chunks);
  }
}

function createPreloadPromise(chunk: Wakeable): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    chunk.then(() => resolve(), reject);
  });
}

function preloadModel(
  response: Response,
  model: any,
  isOutlined: boolean = false,
): Promise<void> | null {
  if (
    model === null ||
    (typeof model !== 'object' && typeof model !== 'function') ||
    response._models.get(model) === model
  ) {
    return null;
  }
  const state: PreloadState = {nextIndex: 0, parent: null, stack: []};
  const pending: PreloadDependencies = {dependencies: null};
  try {
    if (isOutlined) {
      scanOutlinedModel(response, model, state, pending);
    } else {
      scanModel(response, model, state, pending);
    }
  } catch (error) {
    const chunk = createErrorChunk<void>(error);
    for (let i = 0; i < state.stack.length; i++) {
      const preload = state.stack[i];
      preload.onStack = false;
      preload.dependencies = null;
      preload.chunk = chunk;
    }
    throw error;
  }
  const chunks = pending.dependencies;
  if (chunks === null) {
    return null;
  }
  const promises = [];
  const iterator = chunks.values();
  for (let entry = iterator.next(); !entry.done; entry = iterator.next()) {
    promises.push(createPreloadPromise(entry.value));
  }
  return Promise.all(promises).then(noop);
}

function scanModelReference(
  response: Response,
  value: Object,
  reference: ModelReference,
  state: PreloadState,
  chunks: PreloadDependencies,
): void {
  try {
    const root = reference.root;
    if (root.status !== 'fulfilled') {
      if (root.status === 'rejected') {
        throw resolveError(response, root, root.reason);
      }
      throw root;
    }
    scanModel(response, root.value, state, chunks);
    const model = readModelReference(response, reference, element => {
      scanModel(response, element.props, state, chunks);
    });
    scanModel(response, model, state, chunks);
  } catch (error) {
    const wakeable = error as Wakeable;
    if (
      error !== null &&
      typeof error === 'object' &&
      // $FlowFixMe[method-unbinding]
      typeof wakeable.then === 'function'
    ) {
      if (state.parent !== null) {
        state.parent.cacheable = false;
      }
      addPreloadDependency(
        chunks,
        waitForOutlinedModel(response, value, wakeable),
      );
    } else {
      throw error;
    }
  }
}

function scanModel(
  response: Response,
  value: any,
  state: PreloadState,
  chunks: PreloadDependencies,
): void {
  if (
    value === null ||
    (typeof value !== 'object' && typeof value !== 'function')
  ) {
    return;
  }
  const existingModel = response._models.get(value);
  if (existingModel !== undefined) {
    return;
  }
  const info = getModelInfo(response._result, value);
  const kind = info & MODEL_KIND_MASK;
  if (kind === MODEL_ELEMENT) {
    return;
  }
  if (kind === 0) {
    if (resolveTemporaryReference(response, value)) {
      return;
    }
    const chunk = resolveModule(response, value);
    if (chunk !== null) {
      if (chunk.status === RESOLVED_MODULE) {
        initializeModuleChunk(chunk);
      }
      if (chunk.status === ERRORED) {
        throw chunk.reason;
      }
      if (chunk.status === PENDING || chunk.status === BLOCKED) {
        addPreloadDependency(chunks, chunk);
      }
      return;
    }
    if (value instanceof Date) {
      return;
    }
    if (value instanceof ArrayBuffer || ArrayBuffer.isView(value)) {
      return;
    }
    if (
      value.$$typeof === REACT_ELEMENT_TYPE ||
      value.$$typeof === REACT_LAZY_TYPE ||
      typeof value.then === 'function'
    ) {
      return;
    }
  }
  let preload: void | ModelPreload = response._preloads.get(value);
  const existingPreload = preload !== undefined;
  const parent = state.parent;
  if (preload === undefined) {
    const index = state.nextIndex++;
    preload = {
      model: value,
      index,
      lowlink: index,
      onStack: true,
      cacheable: true as boolean,
      chunk: null,
      dependencies: null,
    };
    response._preloads.set(value, preload);
    state.stack.push(preload);
    state.parent = preload;
    try {
      scanModelFields(response, value, state, preload, kind);
    } finally {
      state.parent = parent;
    }
    if (preload.lowlink === preload.index) {
      completeModelPreloads(response, state, preload);
    }
  }
  if (parent !== null && !preload.cacheable) {
    parent.cacheable = false;
  }
  if (preload.onStack) {
    if (parent !== null) {
      parent.lowlink = Math.min(
        parent.lowlink,
        existingPreload ? preload.index : preload.lowlink,
      );
    }
    return;
  }
  const pending = preload.chunk;
  if (pending !== null) {
    if (pending.status === ERRORED) {
      throw pending.reason;
    }
    if (pending.status !== INITIALIZED) {
      addPreloadDependency(chunks, pending);
    }
  }
}

function completeModelPreloads(
  response: Response,
  state: PreloadState,
  root: ModelPreload,
): void {
  const stack = state.stack;
  if (stack[stack.length - 1] === root) {
    stack.pop();
    root.onStack = false;
    root.chunk = createModelPreloadChunk(response, root.dependencies);
    root.dependencies = null;
    cacheModelPreload(response, root);
    return;
  }
  const group: Array<ModelPreload> = [];
  let dependencies: null | Set<Wakeable> = null;
  let cacheable = true;
  let preload;
  do {
    preload = stack.pop();
    if (preload === undefined) {
      // eslint-disable-next-line react-internal/prod-error-codes
      throw new Error('Expected a pending Result model preload.');
    }
    preload.onStack = false;
    cacheable = cacheable && preload.cacheable;
    group.push(preload);
    const localDependencies = preload.dependencies;
    if (localDependencies !== null) {
      if (dependencies === null) {
        dependencies = localDependencies;
      } else {
        const iterator = localDependencies.values();
        for (
          let entry = iterator.next();
          !entry.done;
          entry = iterator.next()
        ) {
          dependencies.add(entry.value);
        }
      }
      preload.dependencies = null;
    }
  } while (preload !== root);

  const chunk = createModelPreloadChunk(response, dependencies);
  for (let i = 0; i < group.length; i++) {
    preload = group[i];
    preload.chunk = chunk;
    preload.cacheable = cacheable;
    cacheModelPreload(response, preload);
  }
}

function addPreloadDependency(
  preload: PreloadDependencies,
  dependency: Wakeable,
): void {
  let dependencies = preload.dependencies;
  if (dependencies === null) {
    preload.dependencies = dependencies = new Set();
  }
  dependencies.add(dependency);
}

function createModelPreloadChunk(
  response: Response,
  dependencies: null | Set<Wakeable>,
): null | SomeChunk<void> {
  if (dependencies === null) {
    return null;
  }
  const chunk = createBlockedChunk<void>(response);
  let remaining = dependencies.size;
  dependencies.forEach(dependency => {
    dependency.then(
      () => {
        if (--remaining === 0) {
          initializeChunk(chunk, undefined);
        }
      },
      error => triggerErrorOnChunk(chunk, error),
    );
  });
  return chunk;
}

function cacheModelPreload(response: Response, preload: ModelPreload): void {
  if (!preload.cacheable) {
    response._preloads.delete(preload.model);
  }
}

function scanModelFields(
  response: Response,
  value: any,
  state: PreloadState,
  chunks: PreloadDependencies,
  kind: number,
): void {
  const reference = getValueReference(response._result, value);
  if (reference !== undefined) {
    scanModelReference(response, value, reference, state, chunks);
    return;
  }
  const collection =
    kind === 0 ? getCollectionEntries(response._result, value) : undefined;
  if (collection !== undefined) {
    scanModelReference(
      response,
      value,
      {root: collection, parent: null, key: ''},
      state,
      chunks,
    );
    return;
  }
  if (kind === MODEL_ARRAY || (kind === 0 && isArray(value))) {
    for (let i = 0; i < value.length; i++) {
      scanModel(response, value[i], state, chunks);
    }
  } else if (kind === 0 && value instanceof Map) {
    const iterator = value.entries();
    for (let entry = iterator.next(); !entry.done; entry = iterator.next()) {
      scanModel(response, entry.value[0], state, chunks);
      scanModel(response, entry.value[1], state, chunks);
    }
  } else if (kind === 0 && value instanceof Set) {
    const iterator = value.values();
    for (let entry = iterator.next(); !entry.done; entry = iterator.next()) {
      scanModel(response, entry.value, state, chunks);
    }
  } else {
    if (kind === 0 && getPrototypeOf(value) !== ObjectPrototype) {
      const entries = getIteratorEntries(response._result, value);
      if (entries !== undefined) {
        scanModel(response, entries, state, chunks);
        return;
      }
      if (typeof FormData === 'function' && value instanceof FormData) {
        return;
      }
      if (typeof Blob === 'function' && value instanceof Blob) {
        return;
      }
    }
    const object: {[key: string]: any} = value;
    const keys = Object.keys(object);
    for (let i = 0; i < keys.length; i++) {
      scanModel(response, object[keys[i]], state, chunks);
    }
  }
  return;
}

function resolveErrorProd(response: Response): Error {
  if (__DEV__) {
    // eslint-disable-next-line react-internal/prod-error-codes
    throw new Error(
      'resolveErrorProd should never be called in development mode. Use resolveErrorDev instead. This is a bug in React.',
    );
  }
  const error = new Error(
    'An error occurred in the Server Components render. The specific message is omitted in production' +
      ' builds to avoid leaking sensitive details. A digest property is included on this error instance which' +
      ' may provide additional details about the nature of the error.',
  );
  error.stack = 'Error: ' + error.message;
  return error;
}

function resolveError(
  response: Response,
  thenable: Object,
  error: mixed,
): mixed {
  if (isHaltedModel(response, thenable)) {
    return getClosedReason(response);
  }
  const reference = getErrorReference(response._result, thenable);
  if (reference === undefined) {
    return error;
  }
  const existingError = response._models.get(reference);
  if (existingError !== undefined) {
    return existingError;
  }
  let resolvedError;
  if (__DEV__) {
    let name = 'Error';
    let message;
    try {
      if (error instanceof Error) {
        name = error.name;
        // eslint-disable-next-line react-internal/safe-string-coercion
        message = String(error.message);
      } else if (typeof error === 'object' && error !== null) {
        message = describeObjectForErrorMessage(error);
      } else {
        // eslint-disable-next-line react-internal/safe-string-coercion
        message = String(error);
      }
    } catch (x) {
      message = 'An error occurred but serializing the error message failed.';
    }
    // eslint-disable-next-line react-internal/prod-error-codes
    resolvedError = new Error(message);
    resolvedError.name = name;
  } else {
    resolvedError = resolveErrorProd(response);
  }
  (resolvedError as any).digest = reference.digest;
  response._models.set(reference, resolvedError);
  return resolvedError;
}

export function readResult<T>(
  response: Response,
  result: Result<T>,
): Thenable<T> {
  const root = getRoot(result);
  const chunk = readModel(response, root);
  const hints = getHintQueue(result);
  let nextHintIndex = 0;
  function flushHints(): void {
    if (response._closed) {
      return;
    }
    try {
      const completedHints = hints.completedHints;
      for (; nextHintIndex < completedHints.length; nextHintIndex++) {
        const hint = completedHints[nextHintIndex];
        dispatchHint(hint.code, hint.model);
      }
      if (!hints.closed) {
        subscribeToModel(response, waitForHints(hints), flushHints, error =>
          stopReading(response, error),
        );
      }
    } catch (error) {
      stopReading(response, error);
    }
  }
  flushHints();
  return chunk;
}

function resolveTemporaryReference(response: Response, value: Object): boolean {
  const reference = getTemporaryReference(response._result, value);
  if (reference === undefined) {
    return false;
  }
  const temporaryReferences = response._tempRefs;
  if (temporaryReferences == null) {
    throw new Error(
      'Missing a temporary reference set but the RSC response returned a temporary reference. ' +
        'Pass a temporaryReference option with the set that was used with the reply.',
    );
  }
  response._models.set(
    value,
    readTemporaryReference(temporaryReferences, '$' + reference),
  );
  return true;
}

function loadServerReference(
  response: Response,
  metaData: ServerReferenceMetadata,
  chunk: SomeChunk<any>,
): void {
  if (metaData.isObjectReference) {
    initializeChunk(chunk, createServerObjectReference(metaData.id));
    return;
  }
  const bound =
    metaData.bound === null ? null : readModel(response, metaData.bound);
  if (bound !== null) {
    bound.catch(noop);
  }
  if (!response._serverReferenceConfig) {
    initializeChunk(
      chunk,
      createBoundServerReference(
        __DEV__
          ? {
              id: metaData.id,
              bound,
              name: metaData.name,
              env: metaData.env,
              location: metaData.location,
            }
          : {id: metaData.id, bound},
        response._callServer,
        response._encodeFormAction,
        __DEV__ ? response._debugFindSourceMapURL : undefined,
      ),
    );
    return;
  }
  const serverReference = resolveServerReference<any>(
    response._serverReferenceConfig,
    metaData.id,
  );
  const promise = preloadModule(serverReference);
  if (!promise && !bound) {
    const resolvedValue = requireModule(serverReference) as any;
    registerBoundServerReference(
      resolvedValue,
      metaData.id,
      bound,
      response._encodeFormAction,
    );
    initializeChunk(chunk, resolvedValue);
    return;
  }
  subscribeToModel(
    response,
    Promise.all([promise, bound]),
    ([, boundArgs]) => {
      try {
        let resolvedValue = requireModule(serverReference) as any;
        if (boundArgs !== null) {
          boundArgs = boundArgs.slice(0);
          boundArgs.unshift(null);
          resolvedValue = resolvedValue.bind.apply(resolvedValue, boundArgs);
        }
        registerBoundServerReference(
          resolvedValue,
          metaData.id,
          bound,
          response._encodeFormAction,
        );
        initializeChunk(chunk, resolvedValue);
      } catch (error) {
        triggerErrorOnChunk(chunk, error);
      }
    },
    error => triggerErrorOnChunk(chunk, error),
  );
}
