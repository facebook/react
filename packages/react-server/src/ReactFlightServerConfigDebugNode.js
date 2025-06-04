/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {
  AsyncSequence,
  IONode,
  PromiseNode,
  UnresolvedPromiseNode,
  AwaitNode,
  UnresolvedAwaitNode,
} from './ReactFlightAsyncSequence';

import {
  IO_NODE,
  PROMISE_NODE,
  UNRESOLVED_PROMISE_NODE,
  AWAIT_NODE,
  UNRESOLVED_AWAIT_NODE,
} from './ReactFlightAsyncSequence';
import {resolveOwner} from './flight/ReactFlightCurrentOwner';
import {createHook, executionAsyncId} from 'async_hooks';
import {enableAsyncDebugInfo} from 'shared/ReactFeatureFlags';

const pendingOperations: Map<number, AsyncSequence> =
  __DEV__ && enableAsyncDebugInfo ? new Map() : (null: any);

// Initialize the tracing of async operations.
// We do this globally since the async work can potentially eagerly
// start before the first request and once requests start they can interleave.
// In theory we could enable and disable using a ref count of active requests
// but given that typically this is just a live server, it doesn't really matter.
export function initAsyncDebugInfo(): void {
  if (__DEV__ && enableAsyncDebugInfo) {
    createHook({
      init(
        asyncId: number,
        type: string,
        triggerAsyncId: number,
        resource: any,
      ): void {
        const trigger = pendingOperations.get(triggerAsyncId);
        let node: AsyncSequence;
        if (type === 'PROMISE') {
          const currentAsyncId = executionAsyncId();
          if (currentAsyncId !== triggerAsyncId) {
            // When you call .then() on a native Promise, or await/Promise.all() a thenable,
            // then this intermediate Promise is created. We use this as our await point
            if (trigger === undefined) {
              // We don't track awaits on things that started outside our tracked scope.
              return;
            }
            const current = pendingOperations.get(currentAsyncId);
            // If the thing we're waiting on is another Await we still track that sequence
            // so that we can later pick the best stack trace in user space.
            node = ({
              tag: UNRESOLVED_AWAIT_NODE,
              owner: resolveOwner(),
              debugInfo: new WeakRef((resource: Promise<any>)),
              stack: new Error(),
              start: performance.now(),
              end: -1.1, // set when resolved.
              awaited: trigger, // The thing we're awaiting on. Might get overrriden when we resolve.
              previous: current === undefined ? null : current, // The path that led us here.
            }: UnresolvedAwaitNode);
          } else {
            node = ({
              tag: UNRESOLVED_PROMISE_NODE,
              owner: resolveOwner(),
              debugInfo: new WeakRef((resource: Promise<any>)),
              stack: new Error(),
              start: performance.now(),
              end: -1.1, // Set when we resolve.
              awaited:
                trigger === undefined
                  ? null // It might get overridden when we resolve.
                  : trigger,
              previous: null,
            }: UnresolvedPromiseNode);
          }
        } else if (
          type !== 'Microtask' &&
          type !== 'TickObject' &&
          type !== 'Immediate'
        ) {
          if (trigger === undefined) {
            // We have begun a new I/O sequence.
            node = ({
              tag: IO_NODE,
              owner: resolveOwner(),
              debugInfo: null,
              stack: new Error(), // This is only used if no native promises are used.
              start: performance.now(),
              end: -1.1, // Only set when pinged.
              awaited: null,
              previous: null,
            }: IONode);
          } else if (
            trigger.tag === AWAIT_NODE ||
            trigger.tag === UNRESOLVED_AWAIT_NODE
          ) {
            // We have begun a new I/O sequence after the await.
            node = ({
              tag: IO_NODE,
              owner: resolveOwner(),
              debugInfo: null,
              stack: new Error(),
              start: performance.now(),
              end: -1.1, // Only set when pinged.
              awaited: null,
              previous: trigger,
            }: IONode);
          } else {
            // Otherwise, this is just a continuation of the same I/O sequence.
            node = trigger;
          }
        } else {
          // Ignore nextTick and microtasks as they're not considered I/O operations.
          // we just treat the trigger as the node to carry along the sequence.
          if (trigger === undefined) {
            return;
          }
          node = trigger;
        }
        pendingOperations.set(asyncId, node);
      },
      promiseResolve(asyncId: number): void {
        const node = pendingOperations.get(asyncId);
        if (node !== undefined) {
          let resolvedNode: AwaitNode | PromiseNode;
          switch (node.tag) {
            case UNRESOLVED_AWAIT_NODE: {
              const awaitNode: AwaitNode = (node: any);
              awaitNode.tag = AWAIT_NODE;
              resolvedNode = awaitNode;
              break;
            }
            case UNRESOLVED_PROMISE_NODE: {
              const promiseNode: PromiseNode = (node: any);
              promiseNode.tag = PROMISE_NODE;
              resolvedNode = promiseNode;
              break;
            }
            case IO_NODE:
              // eslint-disable-next-line react-internal/prod-error-codes
              throw new Error(
                'A Promise should never be an IO_NODE. This is a bug in React.',
              );
            default:
              // eslint-disable-next-line react-internal/prod-error-codes
              throw new Error(
                'A Promise should never be resolved twice. This is a bug in React or Node.js.',
              );
          }
          // Log the end time when we resolved the promise.
          resolvedNode.end = performance.now();
          // The Promise can be garbage collected after this so we should extract debugInfo first.
          const promise = node.debugInfo.deref();
          resolvedNode.debugInfo =
            promise === undefined || promise._debugInfo === undefined
              ? null
              : promise._debugInfo;
          const currentAsyncId = executionAsyncId();
          if (asyncId !== currentAsyncId) {
            // If the promise was not resolved by itself, then that means that
            // the trigger that we originally stored wasn't actually the dependency.
            // Instead, the current execution context is what ultimately unblocked it.
            const awaited = pendingOperations.get(currentAsyncId);
            resolvedNode.awaited = awaited === undefined ? null : awaited;
          }
        }
      },

      destroy(asyncId: number): void {
        // If we needed the meta data from this operation we should have already
        // extracted it or it should be part of a chain of triggers.
        pendingOperations.delete(asyncId);
      },
    }).enable();
  }
}

export function markAsyncSequenceRootTask(): void {
  if (__DEV__ && enableAsyncDebugInfo) {
    // Whatever Task we're running now is spawned by React itself to perform render work.
    // Don't track any cause beyond this task. We may still track I/O that was started outside
    // React but just not the cause of entering the render.
    pendingOperations.delete(executionAsyncId());
  }
}

export function getCurrentAsyncSequence(): null | AsyncSequence {
  if (!__DEV__ || !enableAsyncDebugInfo) {
    return null;
  }
  const currentNode = pendingOperations.get(executionAsyncId());
  if (currentNode === undefined) {
    // Nothing that we tracked led to the resolution of this execution context.
    return null;
  }
  return currentNode;
}
