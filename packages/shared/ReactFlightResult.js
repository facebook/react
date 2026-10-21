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
  aborted: boolean,
  abortReason: mixed,
  abortListeners: null | Array<(reason: mixed) => void>,
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
    aborted: false,
    abortReason: undefined,
    abortListeners: null,
    consumers: 0,
    onError,
    errorDigests: new WeakMap(),
    temporaryReferences,
    environmentName: null as any,
    filterStackFrame: null as any,
  };
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
    const index = subscribed.indexOf(listener);
    if (index !== -1) {
      subscribed.splice(index, 1);
    }
  };
}
