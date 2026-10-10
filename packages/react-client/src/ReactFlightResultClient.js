/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Result} from 'shared/ReactFlightResult';
import type {ReactElement} from 'shared/ReactElementType';
import type {LazyComponent} from 'react/src/ReactLazy';
import type {ReactDebugInfo, Thenable} from 'shared/ReactTypes';
import type {
  ClientReference,
  ClientReferenceMetadata,
  ServerConsumerModuleMap,
  ModuleLoading,
} from './ReactFlightClientConfig';
import {getRoot, getHintQueue, waitForHints} from 'shared/ReactFlightResult';
import {
  dispatchHint,
  resolveClientReference,
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

export type Response = {
  _bundlerConfig: ServerConsumerModuleMap,
  _moduleLoading: ModuleLoading,
  _nonce: void | string,
  _resolveClientReferenceMetadata: Object => null | ClientReferenceMetadata,
  _onError: mixed => ?string,
  _modules: Map<Object, SomeChunk<any>>,
  _closed: boolean,
  _closedReason: null | Error,
  _models: Map<Object, any>,
  _chunks: Set<SomeChunk<any>>,
  _completedElements: Array<ReactElement>, // DEV-only
};

export function createResponse(
  bundlerConfig: ServerConsumerModuleMap,
  moduleLoading: ModuleLoading,
  resolveClientReferenceMetadata: Object => null | ClientReferenceMetadata,
  nonce: void | string,
  onError: void | (mixed => ?string),
): Response {
  const response: Response = {
    _bundlerConfig: bundlerConfig,
    _moduleLoading: moduleLoading,
    _nonce: nonce,
    _resolveClientReferenceMetadata: resolveClientReferenceMetadata,
    _onError: onError || defaultErrorHandler,
    _modules: new Map(),
    _closed: false,
    _closedReason: null,
    _models: new Map(),
    _chunks: new Set(),
  } as any;
  if (__DEV__) {
    response._completedElements = [];
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
  | ResolvedModuleChunk<T>
  | InitializedChunk<T>
  | ErroredChunk<T>;

const PENDING = 'pending';
const RESOLVED_MODULE = 'resolved_module';
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
  if (chunk.status === RESOLVED_MODULE) {
    initializeModuleChunk(chunk);
  }
  switch (chunk.status) {
    case INITIALIZED:
      if (typeof resolve === 'function') {
        resolve(chunk.value);
      }
      break;
    case PENDING:
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
  }
}

function initializeChunk<T>(chunk: SomeChunk<T>, value: T): void {
  if (chunk.status !== PENDING) {
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
  if (chunk.status !== PENDING && chunk.status !== RESOLVED_MODULE) {
    return;
  }
  const listeners = chunk.reason;
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

function reportGlobalError(response: Response, error: Error): void {
  if (response._closed) {
    return;
  }
  response._closed = true;
  response._closedReason = error;
  response._chunks.forEach(chunk => triggerErrorOnChunk(chunk, error));
}

export function stopReading(response: Response, reason: mixed): void {
  if (!response._closed) {
    const error =
      reason instanceof Error ? reason : new Error('Connection closed.');
    reportGlobalError(response, error);
  }
}

function readChunk<T>(chunk: SomeChunk<T>): T {
  if (chunk.status === RESOLVED_MODULE) {
    initializeModuleChunk(chunk);
  }
  switch (chunk.status) {
    case INITIALIZED:
      return chunk.value;
    case PENDING:
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
  if (chunk.status !== PENDING) {
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
    resolvedError = new Error(
      'An error occurred in the Server Components render. The specific message is omitted in production' +
        ' builds to avoid leaking sensitive details. A digest property is included on this error instance which' +
        ' may provide additional details about the nature of the error.',
    );
    resolvedError.stack = 'Error: ' + resolvedError.message;
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
      return null;
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
      promise.then(
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
  promise.then(
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

function readModel(response: Response, value: any): any {
  if (
    value === null ||
    (typeof value !== 'object' && typeof value !== 'function')
  ) {
    return value;
  }
  const existingModel = response._models.get(value);
  if (existingModel !== undefined) {
    return existingModel;
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
  const moduleChunk = resolveModule(response, value);
  if (moduleChunk !== null) {
    return readChunk(moduleChunk);
  }
  if (value.$$typeof === REACT_ELEMENT_TYPE) {
    return readElement(response, value);
  }
  if (getPrototypeOf(value) === ObjectPrototype) {
    return readObject(response, value);
  }
  throw new Error('Not implemented.');
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
      promise.then(
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

function preloadModel(response: Response, model: any): Promise<void> | null {
  const dependencies: Set<SomeChunk<any>> = new Set();
  scanModel(response, model, dependencies);
  if (dependencies.size === 0) {
    return null;
  }
  const promises = [];
  dependencies.forEach(chunk => {
    promises.push(createPreloadPromise(chunk));
  });
  return Promise.all(promises).then(noop);
}

function createPreloadPromise(chunk: SomeChunk<any>): Promise<void> {
  return new Promise((resolve, reject) => {
    chunk.then(() => resolve(), reject);
  });
}

function scanModel(
  response: Response,
  value: any,
  dependencies: Set<SomeChunk<any>>,
): void {
  if (
    value === null ||
    (typeof value !== 'object' && typeof value !== 'function')
  ) {
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
    if (chunk.status === PENDING) {
      dependencies.add(chunk);
    }
    return;
  }
  if (value.$$typeof === REACT_ELEMENT_TYPE) {
    return;
  }
  if (isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      scanModel(response, value[i], dependencies);
    }
  } else {
    const keys = Object.keys(value);
    for (let i = 0; i < keys.length; i++) {
      scanModel(response, value[keys[i]], dependencies);
    }
  }
}

export function readResult<T>(
  response: Response,
  result: Result<T>,
): Thenable<T> {
  const root = getRoot(result);
  const chunk = createPendingChunk<T>(response);
  response._models.set(root, chunk);
  root.then(
    model => initializeModelChunk(response, chunk, model),
    error => triggerErrorOnChunk(chunk, error),
  );
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
        waitForHints(hints).then(flushHints, error =>
          triggerErrorOnChunk(chunk, error),
        );
      }
    } catch (error) {
      triggerErrorOnChunk(chunk, error);
    }
  }
  flushHints();
  return chunk as any;
}
