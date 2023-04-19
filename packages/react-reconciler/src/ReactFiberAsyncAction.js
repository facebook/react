/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Wakeable} from 'shared/ReactTypes';
import type {Lane} from './ReactFiberLane';
import {requestTransitionLane} from './ReactFiberRootScheduler';

interface AsyncActionImpl {
  lane: Lane;
  listeners: Array<(false) => mixed>;
  count: number;
  then(
    onFulfill: (value: boolean) => mixed,
    onReject: (error: mixed) => mixed,
  ): void;
}

interface PendingAsyncAction extends AsyncActionImpl {
  status: 'pending';
}

interface FulfilledAsyncAction extends AsyncActionImpl {
  status: 'fulfilled';
  value: boolean;
}

interface RejectedAsyncAction extends AsyncActionImpl {
  status: 'rejected';
  reason: mixed;
}

type AsyncAction =
  | PendingAsyncAction
  | FulfilledAsyncAction
  | RejectedAsyncAction;

let currentAsyncAction: AsyncAction | null = null;

export function requestAsyncActionContext(
  actionReturnValue: mixed,
): AsyncAction | false {
  if (
    actionReturnValue !== null &&
    typeof actionReturnValue === 'object' &&
    typeof actionReturnValue.then === 'function'
  ) {
    // This is an async action.
    //
    // Return a thenable that resolves once the action scope (i.e. the async
    // function passed to startTransition) has finished running. The fulfilled
    // value is `false` to represent that the action is not pending.
    const thenable: Wakeable = (actionReturnValue: any);
    if (currentAsyncAction === null) {
      // There's no outer async action scope. Create a new one.
      const asyncAction: AsyncAction = {
        lane: requestTransitionLane(),
        listeners: [],
        count: 0,
        status: 'pending',
        value: false,
        reason: undefined,
        then(resolve: boolean => mixed) {
          asyncAction.listeners.push(resolve);
        },
      };
      attachPingListeners(thenable, asyncAction);
      currentAsyncAction = asyncAction;
      return asyncAction;
    } else {
      // Inherit the outer scope.
      const asyncAction: AsyncAction = (currentAsyncAction: any);
      attachPingListeners(thenable, asyncAction);
      return asyncAction;
    }
  } else {
    // This is not an async action, but it may be part of an outer async action.
    if (currentAsyncAction === null) {
      // There's no outer async action scope.
      return false;
    } else {
      // Inherit the outer scope.
      return currentAsyncAction;
    }
  }
}

export function peekAsyncActionContext(): AsyncAction | null {
  return currentAsyncAction;
}

function attachPingListeners(thenable: Wakeable, asyncAction: AsyncAction) {
  asyncAction.count++;
  thenable.then(
    () => {
      if (--asyncAction.count === 0) {
        const fulfilledAsyncAction: FulfilledAsyncAction = (asyncAction: any);
        fulfilledAsyncAction.status = 'fulfilled';
        completeAsyncActionScope(asyncAction);
      }
    },
    (error: mixed) => {
      if (--asyncAction.count === 0) {
        const rejectedAsyncAction: RejectedAsyncAction = (asyncAction: any);
        rejectedAsyncAction.status = 'rejected';
        rejectedAsyncAction.reason = error;
        completeAsyncActionScope(asyncAction);
      }
    },
  );
  return asyncAction;
}

function completeAsyncActionScope(action: AsyncAction) {
  if (currentAsyncAction === action) {
    currentAsyncAction = null;
  }

  const listeners = action.listeners;
  action.listeners = [];
  for (let i = 0; i < listeners.length; i++) {
    const listener = listeners[i];
    listener(false);
  }
}
