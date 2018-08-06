/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {enableProfilerTimer} from 'shared/ReactFeatureFlags';
import warningWithoutStack from 'shared/warningWithoutStack';
import {
  __onInteractionsScheduled,
  __onInteractionsStarting,
  __onInteractionsEnded,
} from './InteractionEmitter';

export {registerInteractionObserver} from './InteractionEmitter';

// Maps execution ID to Interactions for all scheduled continuations.
// We key off of ID because Interactions may be scheduled for multiple continuations.
// For example, an Interaction may schedule work with React at multiple priorities.
// Each priority would reserve a continuation (since they may be processed separately).
export type Continuations = Map<number, Interaction>;
export type Interaction = {|
  id: number,
  name: string,
  timestamp: number,
|};
export type Interactions = Set<Interaction>;

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

// Counters used to generate unique IDs for all interactions,
// And InteractionObserver executions (including continuations).
let executionIDCounter: number = 0;
let interactionIDCounter: number = 0;

// Set of currently tracked interactions.
// Interactions "stack"–
// Meaning that newly tracked interactions are appended to the previously active set.
// When an interaction goes out of scope, the previous set (if any) is restored.
let interactions: Interactions = new Set();

// Temporarily holds the Set of interactions masked by an active "continuation".
// This is necessary since continuations are started/stopped externally.
// This value enables previous interactions to be restored when the continuation ends.
// This implementation supports only one active continuation at any time.
// We could change this to a stack structure in the future if this requirement changed.
let interactionsMaskedByContinuation: Interactions = interactions;

// Map continuation (execution) UIDs to interaction UIDs.
// These Maps are only used for DEV mode validation.
// Ideally we can replace these Maps with WeakMaps at some point.
let scheduledContinuations: Continuations | null = null;
let startedContinuations: Continuations | null = null;
if (__DEV__) {
  scheduledContinuations = new Map();
  startedContinuations = new Map();
}

export function getCurrent(): Interactions | null {
  if (!enableProfilerTimer) {
    return null;
  } else {
    return interactions;
  }
}

// A "continuation" signifies that an interaction is not completed when its callback finish running.
// This is useful for React, since scheduled work may be batched and processed asynchronously.
// Continuations have a unique execution ID which must later be used to restore the interaction.
// This is done by calling startContinuations() before processing the delayed work,
// And stopContinuations() to indicate that the work has been completed.
export function reserveContinuation(interaction: Interaction): number {
  if (!enableProfilerTimer) {
    return 0;
  }

  const executionID = executionIDCounter++;

  __onInteractionsScheduled(new Set([interaction]), executionID);

  if (__DEV__) {
    ((scheduledContinuations: any): Continuations).set(
      executionID,
      interaction,
    );
  }

  return executionID;
}

export function startContinuations(continuations: Continuations): void {
  if (!enableProfilerTimer) {
    return;
  }

  if (__DEV__) {
    warningWithoutStack(
      ((startedContinuations: any): Continuations).size === 0,
      'Only one batch of continuations can be active at a time.',
    );
  }

  const continuationInteractions = new Set();

  const entries = Array.from(continuations);
  for (let index = 0; index < entries.length; index++) {
    const [executionID: number, interaction: Interaction] = entries[index];

    if (__DEV__) {
      warningWithoutStack(
        ((scheduledContinuations: any): Continuations).get(executionID) ===
          interaction,
        'Cannot run an unscheduled continuation.',
      );

      ((scheduledContinuations: any): Continuations).delete(executionID);
      ((startedContinuations: any): Continuations).set(
        executionID,
        interaction,
      );
    }

    __onInteractionsStarting(new Set([interaction]), executionID);

    continuationInteractions.add(interaction);
  }

  // Continuations should mask (rather than extend) any current interactions.
  // Upon completion of a continuation, previous interactions will be restored.
  interactionsMaskedByContinuation = interactions;
  interactions = continuationInteractions;
}

export function stopContinuations(continuations: Continuations): void {
  if (!enableProfilerTimer) {
    return;
  }

  // Stop interactions in the reverse order they were started.
  const entries = Array.from(continuations);
  for (let index = entries.length - 1; index >= 0; index--) {
    const [executionID: number, interaction: Interaction] = entries[index];

    if (__DEV__) {
      warningWithoutStack(
        ((startedContinuations: any): Continuations).get(executionID) ===
          interaction,
        'Cannot stop an inactive continuation.',
      );

      ((startedContinuations: any): Continuations).delete(executionID);
    }

    __onInteractionsEnded(new Set([interaction]), executionID);
  }

  // Restore previous interactions.
  interactions = interactionsMaskedByContinuation;
  interactionsMaskedByContinuation = interactions;
}

export function track(name: string, callback: Function): void {
  if (!enableProfilerTimer) {
    callback();
    return;
  }

  const interaction: Interaction = {
    id: interactionIDCounter++,
    name,
    timestamp: now(),
  };

  const executionID = executionIDCounter++;
  const prevInteractions = interactions;

  // Tracked interactions should stack/accumulate.
  // To do that, clone the current interactions array.
  // The previous interactions array will be restored upon completion.
  interactions = new Set(interactions);
  interactions.add(interaction);

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
  if (!enableProfilerTimer) {
    return callback;
  }

  if (interactions === null) {
    return callback;
  }

  const executionID = executionIDCounter++;
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
