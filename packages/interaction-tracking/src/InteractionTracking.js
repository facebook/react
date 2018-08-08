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

export type Interaction = {|
  id: number,
  name: string,
  timestamp: number,
|};

export type InteractionObserver = {
  onInteractionEnded: (interaction: Interaction) => void,
  onInteractionStarting: (interaction: Interaction) => void,
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

// Counter used to generate unique ID for all interactions.
let idCounter: number = 0;

// Listener(s) to notify when interactions begin and end.
const interactionObservers: Set<InteractionObserver> = new Set();

// Set of currently tracked interactions.
// Interactions "stack"–
// Meaning that newly tracked interactions are appended to the previously active set.
// When an interaction goes out of scope, the previous set (if any) is restored.
let interactions: Set<Interaction> = new Set();

// Temporarily holds the Set of interactions masked by an active "continuation".
// This is necessary since continuations are started/stopped externally.
// This value enables previous interactions to be restored when the continuation ends.
// This implementation supports only one active continuation at any time.
// We could change this to a stack structure in the future if this requirement changed.
let interactionsMaskedByContinuation: Set<Interaction> | null = null;

// Tracks the number of async operations scheduled for each interaction.
// Once the number of scheduled operations drops to 0,
// Interaction observers will be notified that the interaction has ended.
const scheduledAsyncWorkCounts: Map<Interaction, number> = new Map();

export function getCurrent(): Set<Interaction> | null {
  if (!enableProfilerTimer) {
    return null;
  } else {
    return interactions;
  }
}

export function registerInteractionObserver(
  observer: InteractionObserver,
): void {
  if (!enableProfilerTimer) {
    return;
  }

  interactionObservers.add(observer);
}

export function track(name: string, callback: Function): any {
  if (!enableProfilerTimer) {
    return callback();
  }

  const interaction: Interaction = {
    id: idCounter++,
    name,
    timestamp: now(),
  };

  const prevInteractions = interactions;

  // Tracked interactions should stack/accumulate.
  // To do that, clone the current interactions array.
  // The previous interactions array will be restored upon completion.
  interactions = new Set(interactions);
  interactions.add(interaction);

  // Initialize the pending async count for this interaction,
  // So that if it's processed synchronously,
  // And __startAsyncWork/__stopAsyncWork are called,
  // We won't accidentally call onInteractionEnded() more than once.
  scheduledAsyncWorkCounts.set(interaction, 1);

  try {
    interactionObservers.forEach(observer =>
      observer.onInteractionStarting(interaction),
    );

    return callback();
  } finally {
    interactions = prevInteractions;

    const count = ((scheduledAsyncWorkCounts.get(interaction): any): number);

    // If no async work was scheduled for this interaction,
    // We can mark it as completed.
    if (count === 1) {
      scheduledAsyncWorkCounts.delete(interaction);
      interactionObservers.forEach(observer =>
        observer.onInteractionEnded(interaction),
      );
    } else {
      scheduledAsyncWorkCounts.set(interaction, count - 1);
    }
  }
}

export function wrap(callback: Function): Function {
  if (!enableProfilerTimer) {
    return callback;
  }

  const wrappedInteractions = interactions;

  // Update the pending async work count for the current interactions.
  wrappedInteractions.forEach(interaction => {
    const count = scheduledAsyncWorkCounts.get(interaction) || 0;
    if (count > 0) {
      scheduledAsyncWorkCounts.set(interaction, count + 1);
    } else {
      scheduledAsyncWorkCounts.set(interaction, 1);
    }
  });

  const wrapped = (...args) => {
    const prevInteractions = interactions;
    interactions = wrappedInteractions;

    try {
      return callback(...args);
    } finally {
      interactions = prevInteractions;

      // Update pending async counts for all wrapped interactions.
      // If this was the last scheduled async work for any of them,
      // Mark them as completed.
      wrappedInteractions.forEach(interaction => {
        const count = scheduledAsyncWorkCounts.get(interaction) || 0;
        if (count > 1) {
          scheduledAsyncWorkCounts.set(interaction, count - 1);
        } else {
          scheduledAsyncWorkCounts.delete(interaction);
          interactionObservers.forEach(observer =>
            observer.onInteractionEnded(interaction),
          );
        }
      });
    }
  };

  wrapped.cancel = () => {
    // Update pending async counts for all wrapped interactions.
    // If this was the last scheduled async work for any of them,
    // Mark them as completed.
    wrappedInteractions.forEach(interaction => {
      const count = scheduledAsyncWorkCounts.get(interaction) || 0;
      if (count > 1) {
        scheduledAsyncWorkCounts.set(interaction, count - 1);
      } else {
        scheduledAsyncWorkCounts.delete(interaction);
        interactionObservers.forEach(observer =>
          observer.onInteractionEnded(interaction),
        );
      }
    });
  };

  return wrapped;
}

export function __scheduleAsyncWork(
  asyncInteractions: Array<Interaction>,
): void {
  if (!enableProfilerTimer) {
    return;
  }

  // Update the pending async work count for the current interactions.
  asyncInteractions.forEach(interaction => {
    const count = scheduledAsyncWorkCounts.get(interaction) || 0;
    scheduledAsyncWorkCounts.set(interaction, count + 1);
  });
}

export function __startAsyncWork(asyncInteractions: Array<Interaction>): void {
  if (!enableProfilerTimer) {
    return;
  }

  if (interactionsMaskedByContinuation !== null) {
    if (__DEV__) {
      warningWithoutStack(
        false,
        'Can only restore one batch of async interactions at a time.',
      );
    }
    return;
  }

  if (__DEV__) {
    asyncInteractions.forEach(interaction => {
      const count = scheduledAsyncWorkCounts.get(interaction) || 0;
      warningWithoutStack(count > 0, 'An unscheduled interaction was started.');
    });
  }

  // Continuations should mask (rather than extend) any current interactions.
  // Upon completion of a continuation, previous interactions will be restored.
  interactionsMaskedByContinuation = interactions;
  interactions = new Set(asyncInteractions);
}

export function __stopAsyncWork(
  asyncInteractions: Array<Interaction>,
  isAsyncWorkComplete: boolean,
): void {
  if (!enableProfilerTimer) {
    return;
  }

  if (interactionsMaskedByContinuation === null) {
    if (__DEV__) {
      warningWithoutStack(false, 'Cannot stop inactive async interactions.');
    }
    return;
  }

  // Restore previous interactions.
  interactions = ((interactionsMaskedByContinuation: any): Set<Interaction>);
  interactionsMaskedByContinuation = null;

  if (isAsyncWorkComplete) {
    asyncInteractions.forEach(interaction => {
      const count = scheduledAsyncWorkCounts.get(interaction) || 0;

      if (__DEV__) {
        warningWithoutStack(
          count > 0,
          'An unscheduled interaction was stopped.',
        );
      }

      if (count > 1) {
        scheduledAsyncWorkCounts.set(interaction, count - 1);
      } else {
        scheduledAsyncWorkCounts.delete(interaction);
        interactionObservers.forEach(observer =>
          observer.onInteractionEnded(interaction),
        );
      }
    });
  }
}
