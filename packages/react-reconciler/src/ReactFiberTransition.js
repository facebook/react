/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from './ReactFiber';
import type {ExpirationTime} from './ReactFiberExpirationTime';
import type {SuspenseConfig} from './ReactFiberSuspenseConfig';

import ReactSharedInternals from 'shared/ReactSharedInternals';

import {
  UserBlockingPriority,
  NormalPriority,
  runWithPriority,
  getCurrentPriorityLevel,
} from './SchedulerWithReactIntegration';
import {
  scheduleUpdateOnFiber,
  computeExpirationForFiber,
  requestCurrentTimeForUpdate,
} from './ReactFiberWorkLoop';
import {NoWork} from './ReactFiberExpirationTime';

const {ReactCurrentBatchConfig} = ReactSharedInternals;

export type TransitionInstance = {|
  pendingExpirationTime: ExpirationTime,
  fiber: Fiber,
|};

// Inside `startTransition`, this is the transition instance that corresponds to
// the `useTransition` hook.
let currentTransition: TransitionInstance | null = null;

// Inside `startTransition`, this is the expiration time of the update that
// turns on `isPending`. We also use it to turn off the `isPending` of previous
// transitions, if they exists.
let userBlockingExpirationTime = NoWork;

export function requestCurrentTransition(): TransitionInstance | null {
  return currentTransition;
}

export function startTransition(
  transitionInstance: TransitionInstance,
  config: SuspenseConfig | null | void,
  callback: () => void,
) {
  const fiber = transitionInstance.fiber;

  const resolvedConfig: SuspenseConfig | null =
    config === undefined ? null : config;

  const currentTime = requestCurrentTimeForUpdate();

  // TODO: runWithPriority shouldn't be necessary here. React should manage its
  // own concept of priority, and only consult Scheduler for updates that are
  // scheduled from outside a React context.
  const priorityLevel = getCurrentPriorityLevel();
  runWithPriority(
    priorityLevel < UserBlockingPriority ? UserBlockingPriority : priorityLevel,
    () => {
      userBlockingExpirationTime = computeExpirationForFiber(
        currentTime,
        fiber,
        null,
      );
      scheduleUpdateOnFiber(fiber, userBlockingExpirationTime);
    },
  );
  runWithPriority(
    priorityLevel > NormalPriority ? NormalPriority : priorityLevel,
    () => {
      let expirationTime = computeExpirationForFiber(
        currentTime,
        fiber,
        resolvedConfig,
      );
      // Set the expiration time at which the pending transition will finish.
      // Because there's only a single transition per useTransition hook, we
      // don't need a queue here; we can cheat by only tracking the most
      // recently scheduled transition.
      const oldPendingExpirationTime = transitionInstance.pendingExpirationTime;
      if (oldPendingExpirationTime === expirationTime) {
        expirationTime -= 1;
      }
      transitionInstance.pendingExpirationTime = expirationTime;

      scheduleUpdateOnFiber(fiber, expirationTime);
      const previousConfig = ReactCurrentBatchConfig.suspense;
      const previousTransition = currentTransition;
      ReactCurrentBatchConfig.suspense = resolvedConfig;
      currentTransition = transitionInstance;
      try {
        callback();
      } finally {
        ReactCurrentBatchConfig.suspense = previousConfig;
        currentTransition = previousTransition;
        userBlockingExpirationTime = NoWork;
      }
    },
  );
}

export function cancelPendingTransition(prevTransition: TransitionInstance) {
  // Turn off the `isPending` state of the previous transition, at the same
  // priority we use to turn on the `isPending` state of the current transition.
  prevTransition.pendingExpirationTime = NoWork;
  scheduleUpdateOnFiber(prevTransition.fiber, userBlockingExpirationTime);
}
