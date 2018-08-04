/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import invariant from 'shared/invariant';
import {
  __onInteractionsScheduled,
  __onInteractionsStarting,
  __onInteractionsEnded,
} from './InteractionEmitter';

export {registerInteractionObserver} from './InteractionEmitter';

type Interactions = Array<Interaction>;

export type Interaction = {|
  id: number,
  name: string,
  timestamp: number,
|};

export type Continuation = {
  __hasBeenRun: boolean,
  __id: number,
  __interactions: Interactions,
  __prevInteractions: Interactions | null,
};

// Normally we would use the current renderer HostConfig's "now" method,
// But since interaction-tracking will be a separate package,
// I instead just copied the approach used by ReactScheduler.
let now;
if (typeof performance === 'object' && typeof performance.now === 'function') {
  const localPerformance = performance;
  now = () => localPerformance.now();
} else {
  const localDate = Date;
  now = () => localDate.now();
}

let currentContinuation: Continuation | null = null;
let globalExecutionID: number = 0;
let globalInteractionID: number = 0;
let interactions: Interactions | null = null;

export function getCurrent(): Interactions | null {
  if (!__PROFILE__) {
    return null;
  } else {
    return interactions;
  }
}

export function reserveContinuation(): Continuation | null {
  if (!__PROFILE__) {
    return null;
  }

  if (interactions !== null) {
    const executionID = globalExecutionID++;

    __onInteractionsScheduled(interactions, executionID);

    return {
      __hasBeenRun: false,
      __id: executionID,
      __interactions: interactions,
      __prevInteractions: null,
    };
  } else {
    return null;
  }
}

export function startContinuation(continuation: Continuation | null): void {
  if (!__PROFILE__) {
    return;
  }

  invariant(
    currentContinuation === null,
    'Cannot start a continuation when one is already active.',
  );

  if (continuation === null) {
    return;
  }

  invariant(
    !continuation.__hasBeenRun,
    'A continuation can only be started once',
  );

  continuation.__hasBeenRun = true;
  currentContinuation = continuation;

  // Continuations should mask (rather than extend) any current interactions.
  // Upon completion of a continuation, previous interactions will be restored.
  continuation.__prevInteractions = interactions;
  interactions = continuation.__interactions;

  __onInteractionsStarting(interactions, continuation.__id);
}

export function stopContinuation(continuation: Continuation): void {
  if (!__PROFILE__) {
    return;
  }

  invariant(
    currentContinuation === continuation,
    'Cannot stop a continuation that is not active.',
  );

  if (continuation === null) {
    return;
  }

  __onInteractionsEnded(continuation.__interactions, continuation.__id);

  currentContinuation = null;

  // Restore previous interactions.
  interactions = continuation.__prevInteractions;
}

export function track(name: string, callback: Function): void {
  if (!__PROFILE__) {
    callback();
    return;
  }

  const interaction: Interaction = {
    id: globalInteractionID++,
    name,
    timestamp: now(),
  };

  const executionID = globalExecutionID++;
  const prevInteractions = interactions;

  // Tracked interactions should stack/accumulate.
  // To do that, clone the current interactions array.
  // The previous interactions array will be restored upon completion.
  interactions =
    interactions === null ? [interaction] : interactions.concat(interaction);

  try {
    __onInteractionsScheduled(interactions, executionID);
    __onInteractionsStarting(interactions, executionID);

    callback();
  } finally {
    __onInteractionsEnded(interactions, executionID);

    interactions = prevInteractions;
  }
}

export function wrap(callback: Function): Function {
  if (!__PROFILE__) {
    return callback;
  }

  if (interactions === null) {
    return callback;
  }

  const executionID = globalExecutionID++;
  const wrappedInteractions = interactions;

  __onInteractionsScheduled(wrappedInteractions, executionID);

  return (...args) => {
    const prevInteractions = interactions;
    interactions = wrappedInteractions;

    try {
      __onInteractionsStarting(interactions, executionID);

      callback(...args);
    } finally {
      __onInteractionsEnded(interactions, executionID);

      interactions = prevInteractions;
    }
  };
}
