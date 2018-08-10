/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {
  enableInteractionTracking,
  enableInteractionTrackingObserver,
} from 'shared/ReactFeatureFlags';
import now from './InteractionTrackingNow';

export type Interaction = {|
  id: number,
  name: string,
  timestamp: number,
|};

export type InteractionObserver = {
  // A new interaction has been created via the track() method.
  onInteractionTracked: (interaction: Interaction) => void,

  // All scheduled async work for an interaction has finished.
  onInteractionScheduledWorkCompleted: (interaction: Interaction) => void,

  // New async work has been scheduled for a set of interactions.
  // When this work is later run, onWorkStarted/onWorkStopped will be called.
  // A batch of async/yieldy work may be scheduled multiple times before completing,
  // In that case, onWorkScheduled may be called more than once before onWorkStopped.
  // Work is scheduled by a "thread" which is identified by a unique ID.
  onWorkScheduled: (interactions: Set<Interaction>, threadID: number) => void,

  // A batch of scheduled work has been cancelled.
  // Work is done by a "thread" which is identified by a unique ID.
  onWorkCancelled: (interactions: Set<Interaction>, threadID: number) => void,

  // A batch of work has started for a set of interactions.
  // When this work is complete, onWorkStopped will be called.
  // Work is not always completed synchronously; yielding may occur in between.
  // A batch of async/yieldy work may also be re-started before completing,
  // In that case, onWorkStarted may be called more than once before onWorkStopped.
  // Work is done by a "thread" which is identified by a unique ID.
  onWorkStarted: (interactions: Set<Interaction>, threadID: number) => void,

  // A batch of work has completed for a set of interactions.
  // Work is done by a "thread" which is identified by a unique ID.
  onWorkStopped: (interactions: Set<Interaction>, threadID: number) => void,
};

export type InteractionsRef = {
  current: Set<Interaction>,
};

type InteractionObservers = Set<InteractionObserver>;
type ScheduledAsyncWorkCounts = Map<Interaction, number>;

const DEFAULT_THREAD_ID = 0;

// Counters used to generate unique IDs.
let interactionIDCounter: number = 0;
let threadIDCounter: number = 0;

// Set of currently tracked interactions.
// Interactions "stack"–
// Meaning that newly tracked interactions are appended to the previously active set.
// When an interaction goes out of scope, the previous set (if any) is restored.
let interactionsRef: InteractionsRef | null = null;

// Listener(s) to notify when interactions begin and end.
// Note that observers are only supported when enableInteractionTrackingObserver is enabled.
let interactionObservers: InteractionObservers | null = null;

// Tracks the number of async operations scheduled for each interaction.
// Once the number of scheduled operations drops to 0,
// Interaction observers will be notified that the interaction has ended.
// Note that pending counts are only tracked when enableInteractionTrackingObserver is enabled.
let scheduledAsyncWorkCounts: ScheduledAsyncWorkCounts | null = null;

if (enableInteractionTracking) {
  interactionsRef = {
    current: new Set(),
  };

  if (enableInteractionTrackingObserver) {
    interactionObservers = new Set();
    scheduledAsyncWorkCounts = new Map();
  }
}

// These values are exported for libraries with advanced use cases (i.e. React).
// They should not typically be accessed directly.
export {
  interactionsRef as __interactionsRef,
  interactionObservers as __interactionObservers,
  scheduledAsyncWorkCounts as __scheduledAsyncWorkCounts,
};

export function getCurrent(): Set<Interaction> | null {
  if (!enableInteractionTracking) {
    return null;
  } else {
    return ((interactionsRef: any): InteractionsRef).current;
  }
}

export function getThreadID(): number {
  return ++threadIDCounter;
}

export function registerInteractionObserver(
  observer: InteractionObserver,
): void {
  if (enableInteractionTracking && enableInteractionTrackingObserver) {
    ((interactionObservers: any): InteractionObservers).add(observer);
  }
}

export function track(
  name: string,
  callback: Function,
  threadID: number = DEFAULT_THREAD_ID,
): any {
  if (!enableInteractionTracking) {
    return callback();
  }

  const interaction: Interaction = {
    id: interactionIDCounter++,
    name,
    timestamp: now(),
  };

  const prevInteractions = ((interactionsRef: any): InteractionsRef).current;

  // Tracked interactions should stack/accumulate.
  // To do that, clone the current interactions array.
  // The previous interactions array will be restored upon completion.
  const interactions = new Set(prevInteractions);
  interactions.add(interaction);
  ((interactionsRef: any): InteractionsRef).current = interactions;

  try {
    if (enableInteractionTrackingObserver) {
      // Initialize the pending async count for this interaction,
      // So that if it's processed synchronously,
      // And __startAsyncWork/__stopAsyncWork are called,
      // We won't accidentally call onInteractionScheduledWorkCompleted more than once.
      ((scheduledAsyncWorkCounts: any): ScheduledAsyncWorkCounts).set(
        interaction,
        1,
      );

      ((interactionObservers: any): InteractionObservers).forEach(observer => {
        observer.onInteractionTracked(interaction);
        observer.onWorkStarted(interactions, threadID);
      });
    }

    return callback();
  } finally {
    ((interactionsRef: any): InteractionsRef).current = prevInteractions;

    if (enableInteractionTrackingObserver) {
      ((interactionObservers: any): InteractionObservers).forEach(observer =>
        observer.onWorkStopped(interactions, threadID),
      );

      const count = ((((scheduledAsyncWorkCounts: any): ScheduledAsyncWorkCounts).get(
        interaction,
      ): any): number);

      // If no async work was scheduled for this interaction,
      // Notify observers that it's completed.
      if (count === 1) {
        ((scheduledAsyncWorkCounts: any): ScheduledAsyncWorkCounts).delete(
          interaction,
        );
        ((interactionObservers: any): InteractionObservers).forEach(observer =>
          observer.onInteractionScheduledWorkCompleted(interaction),
        );
      } else {
        ((scheduledAsyncWorkCounts: any): ScheduledAsyncWorkCounts).set(
          interaction,
          count - 1,
        );
      }
    }
  }
}

export function wrap(
  callback: Function,
  threadID: number = DEFAULT_THREAD_ID,
): Function {
  if (!enableInteractionTracking) {
    return callback;
  }

  const wrappedInteractions = ((interactionsRef: any): InteractionsRef).current;

  if (enableInteractionTrackingObserver) {
    // Update the pending async work count for the current interactions.
    wrappedInteractions.forEach(interaction => {
      const count =
        ((scheduledAsyncWorkCounts: any): ScheduledAsyncWorkCounts).get(
          interaction,
        ) || 0;
      if (count > 0) {
        ((scheduledAsyncWorkCounts: any): ScheduledAsyncWorkCounts).set(
          interaction,
          count + 1,
        );
      } else {
        ((scheduledAsyncWorkCounts: any): ScheduledAsyncWorkCounts).set(
          interaction,
          1,
        );
      }
    });

    ((interactionObservers: any): InteractionObservers).forEach(observer =>
      observer.onWorkScheduled(wrappedInteractions, threadID),
    );
  }

  const wrapped = (...args) => {
    const prevInteractions = ((interactionsRef: any): InteractionsRef).current;
    ((interactionsRef: any): InteractionsRef).current = wrappedInteractions;

    try {
      if (enableInteractionTrackingObserver) {
        ((interactionObservers: any): InteractionObservers).forEach(observer =>
          observer.onWorkStarted(wrappedInteractions, threadID),
        );
      }

      return callback(...args);
    } finally {
      ((interactionsRef: any): InteractionsRef).current = prevInteractions;

      if (enableInteractionTrackingObserver) {
        ((interactionObservers: any): InteractionObservers).forEach(observer =>
          observer.onWorkStopped(wrappedInteractions, threadID),
        );

        // Update pending async counts for all wrapped interactions.
        // If this was the last scheduled async work for any of them,
        // Mark them as completed.
        wrappedInteractions.forEach(interaction => {
          const count =
            ((scheduledAsyncWorkCounts: any): ScheduledAsyncWorkCounts).get(
              interaction,
            ) || 0;
          if (count > 1) {
            ((scheduledAsyncWorkCounts: any): ScheduledAsyncWorkCounts).set(
              interaction,
              count - 1,
            );
          } else {
            ((scheduledAsyncWorkCounts: any): ScheduledAsyncWorkCounts).delete(
              interaction,
            );
            ((interactionObservers: any): InteractionObservers).forEach(
              observer =>
                observer.onInteractionScheduledWorkCompleted(interaction),
            );
          }
        });
      }
    }
  };

  wrapped.cancel = () => {
    if (enableInteractionTrackingObserver) {
      ((interactionObservers: any): InteractionObservers).forEach(observer =>
        observer.onWorkCancelled(wrappedInteractions, threadID),
      );

      // Update pending async counts for all wrapped interactions.
      // If this was the last scheduled async work for any of them,
      // Mark them as completed.
      wrappedInteractions.forEach(interaction => {
        const count =
          ((scheduledAsyncWorkCounts: any): ScheduledAsyncWorkCounts).get(
            interaction,
          ) || 0;
        if (count > 1) {
          ((scheduledAsyncWorkCounts: any): ScheduledAsyncWorkCounts).set(
            interaction,
            count - 1,
          );
        } else {
          ((scheduledAsyncWorkCounts: any): ScheduledAsyncWorkCounts).delete(
            interaction,
          );
          ((interactionObservers: any): InteractionObservers).forEach(
            observer =>
              observer.onInteractionScheduledWorkCompleted(interaction),
          );
        }
      });
    }
  };

  return wrapped;
}
