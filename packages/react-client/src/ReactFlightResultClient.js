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
import type {ReactDebugInfo, Thenable} from 'shared/ReactTypes';
import {getRoot, getHintQueue, waitForHints} from 'shared/ReactFlightResult';
import {dispatchHint} from './ReactFlightClientConfig';
import {REACT_ELEMENT_TYPE} from 'shared/ReactSymbols';
import isArray from 'shared/isArray';
import getPrototypeOf from 'shared/getPrototypeOf';

const ObjectPrototype = Object.prototype;

export type Response = {
  _models: Map<any, any>,
  _chunks: Set<SomeChunk<any>>,
  _completedElements: Array<ReactElement>, // DEV-only
};

export function createResponse(): Response {
  const response: Response = {
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

type ErroredChunk<T> = {
  _debugInfo: ReactDebugInfo, // DEV-only
  status: 'rejected',
  value: null,
  reason: mixed,
  then(resolve: (T) => mixed, reject?: (mixed) => mixed): void,
};

type SomeChunk<T> = PendingChunk<T> | InitializedChunk<T> | ErroredChunk<T>;

const PENDING = 'pending';
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
  if (chunk.status !== PENDING) {
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
  resolvedElement.props = readModel(response, element.props);
  if (__DEV__) {
    response._completedElements.push(resolvedElement);
  }
  return resolvedElement;
}

function readElement(response: Response, element: ReactElement): any {
  return createElement(response, element, true);
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
  try {
    initializeChunk(chunk, completeModel(response, model));
  } catch (error) {
    triggerErrorOnChunk(chunk, error);
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
