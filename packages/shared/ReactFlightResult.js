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

// A Result is a model whose Server Components run at most once, no matter
// how many consumers read it. The model itself is left alone. For every
// Server Component element a consumer reaches, the Result keeps a task that
// renders it; the serializer and the in-process reader both read the task's
// value instead of calling the component again.
//
// The Result is created on the server and read by consumers in another
// module graph (the SSR bundle), which can't import react-server. The few
// things that need the server's internals, like running a component under
// its hooks dispatcher, are functions the server puts on the Result.

// Result task status. These are the statuses React's use() understands, so a
// consumer can suspend on a task like on any other thenable.
export const PENDING = 'pending';
export const FULFILLED = 'fulfilled';
export const REJECTED = 'rejected';

export type ResultTask = {
  status: 'pending' | 'fulfilled' | 'rejected',
  // The component's return value as is. Each consumer applies its own
  // conventions for thenables and iterators in return position.
  value: any,
  reason: mixed,
  // The element this task renders.
  model: ReactElement,
  ping: () => void,
  thenableState: mixed,
  _listeners: null | Array<[(value: any) => mixed, (reason: mixed) => mixed]>,
  then(resolve: (value: any) => mixed, reject: (reason: mixed) => mixed): void,
};

// $FlowFixMe[missing-this-annot]
function ResultTask(model: ReactElement, ping: () => void) {
  this.status = PENDING;
  this.value = undefined;
  this.reason = undefined;
  this.model = model;
  this.ping = ping;
  this.thenableState = null;
  this._listeners = null;
}
// We subclass Promise.prototype so that we get other methods like .catch
ResultTask.prototype = Object.create(Promise.prototype) as any;
// TODO: This doesn't return a new Promise chain unlike the real .then
function resultTaskThen(
  this: ResultTask,
  resolve: (value: any) => mixed,
  reject: (reason: mixed) => mixed,
) {
  const task: ResultTask = this;
  switch (task.status) {
    case FULFILLED:
      resolve(task.value);
      break;
    case REJECTED:
      reject(task.reason);
      break;
    default: {
      let listeners = task._listeners;
      if (listeners === null) {
        task._listeners = listeners = [];
      }
      listeners.push([resolve, reject]);
    }
  }
}
Object.defineProperty(ResultTask.prototype, 'then', {
  writable: true,
  enumerable: true,
  configurable: true,
  value: resultTaskThen,
});

export function createResultTask(
  result: Result<any>,
  model: ReactElement,
): ResultTask {
  // $FlowFixMe[invalid-constructor]
  const task: ResultTask = new ResultTask(model, () =>
    result.retryTask(result, task),
  );
  return task;
}

export function fulfillResultTask(task: ResultTask, value: mixed): void {
  if (task.status !== PENDING) {
    return;
  }
  task.status = FULFILLED;
  task.value = value;
  const listeners = task._listeners;
  if (listeners !== null) {
    task._listeners = null;
    for (let i = 0; i < listeners.length; i++) {
      listeners[i][0](value);
    }
  }
}

export function rejectResultTask(task: ResultTask, reason: mixed): void {
  if (task.status !== PENDING) {
    return;
  }
  task.status = REJECTED;
  task.reason = reason;
  const listeners = task._listeners;
  if (listeners !== null) {
    task._listeners = null;
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
  tasks: WeakMap<ReactElement, ResultTask>,
  // Server-owned. Runs a task's Server Component, under the Result's render
  // context and hooks dispatcher.
  retryTask: (result: Result<any>, task: ResultTask) => void,
  // Tasks whose component hasn't returned yet, to reject if the Result is
  // aborted.
  abortableTasks: Set<ResultTask>,
  // Aborted when the Result is. Every consumer listens to it. The cache
  // signal is a different one, since it also ends once the last consumer is
  // done, and a consumer may start after that.
  abortController: AbortController,
  // How many consumers are reading the Result. The cache signal stays open
  // until the last one is done.
  consumers: number,
  onError: (error: mixed) => ?string,
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

// Allocated through a constructor for the same reason the render context
// is: a Result lives for a whole render, and an object literal that always
// survives gets pretenured, after which it pins every task's output in old
// space until a major GC.
// $FlowFixMe[missing-this-annot]
function ResultInstance(
  model: any,
  context: RenderContext,
  retryTask: (result: Result<any>, task: ResultTask) => void,
  onError: (error: mixed) => ?string,
  temporaryReferences: void | TemporaryReferenceSet,
) {
  this.$$typeof = RESULT_TYPE;
  this.model = model;
  this.context = context;
  this.tasks = new WeakMap();
  this.retryTask = retryTask;
  this.abortableTasks = new Set();
  this.abortController = new AbortController();
  this.consumers = 0;
  this.onError = onError;
  this.temporaryReferences = temporaryReferences;
  this.environmentName = null;
  this.filterStackFrame = null;
}

export function createResultObject<T>(
  model: T,
  context: RenderContext,
  retryTask: (result: Result<any>, task: ResultTask) => void,
  onError: (error: mixed) => ?string,
  temporaryReferences: void | TemporaryReferenceSet,
): Result<T> {
  // $FlowFixMe[invalid-constructor] Flow doesn't support functions as constructors
  return new ResultInstance(
    model,
    context,
    retryTask,
    onError,
    temporaryReferences,
  );
}

// The task rendering this Server Component element. The first consumer to
// reach the element starts it; every consumer after that gets the same task.
export function getResultTask(
  result: Result<any>,
  element: ReactElement,
): ResultTask {
  const tasks = result.tasks;
  let task = tasks.get(element);
  if (task === undefined) {
    task = createResultTask(result, element);
    tasks.set(element, task);
    result.retryTask(result, task);
  }
  return task;
}

export function retainResult(result: Result<any>): void {
  result.consumers++;
}

// Once the last consumer is done, the cache signal aborts so that any
// pending work tied to it can clean up, like at the end of a request.
export function releaseResult(result: Result<any>, reason: mixed): void {
  if (--result.consumers === 0) {
    result.context.cacheController.abort(reason);
  }
}
