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
  __count?: number,
  id: number,
  name: string,
  timestamp: number,
|};

export type Subscriber = {
  // A new interaction has been created via the track() method.
  onInteractionTracked: (interaction: Interaction) => void,

  // All scheduled async work for an interaction has finished.
  onInteractionScheduledWorkCompleted: (interaction: Interaction) => void,

  // New async work has been scheduled for a set of interactions.
  // When this work is later run, onWorkStarted/onWorkStopped will be called.
  // A batch of async/yieldy work may be scheduled multiple times before completing.
  // In that case, onWorkScheduled may be called more than once before onWorkStopped.
  // Work is scheduled by a "thread" which is identified by a unique ID.
  onWorkScheduled: (interactions: Set<Interaction>, threadID: number) => void,

  // A batch of scheduled work has been cancelled.
  // Work is done by a "thread" which is identified by a unique ID.
  onWorkCancelled: (interactions: Set<Interaction>, threadID: number) => void,

  // A batch of work has started for a set of interactions.
  // When this work is complete, onWorkStopped will be called.
  // Work is not always completed synchronously; yielding may occur in between.
  // A batch of async/yieldy work may also be re-started before completing.
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

export type Subscribers = Set<Subscriber>;
export type ScheduledAsyncWorkCounts = Map<Interaction, number>;

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
// Note that subscribers are only supported when enableInteractionTrackingObserver is enabled.
let subscribers: Subscribers | null = null;

if (enableInteractionTracking) {
  interactionsRef = {
    current: new Set(),
  };
  if (enableInteractionTrackingObserver) {
    subscribers = new Set();
  }
}

// These values are exported for libraries with advanced use cases (i.e. React).
// They should not typically be accessed directly.
export {interactionsRef as __interactionsRef, subscribers as __subscribers};

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

export function subscribe(subscriber: Subscriber): void {
  if (enableInteractionTracking && enableInteractionTrackingObserver) {
    ((subscribers: any): Subscribers).add(subscriber);
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
      interaction.__count = 1;

      ((subscribers: any): Subscribers).forEach(subscriber => {
        subscriber.onInteractionTracked(interaction);
        subscriber.onWorkStarted(interactions, threadID);
      });
    }

    return callback();
  } finally {
    ((interactionsRef: any): InteractionsRef).current = prevInteractions;

    if (enableInteractionTrackingObserver) {
      ((subscribers: any): Subscribers).forEach(subscriber =>
        subscriber.onWorkStopped(interactions, threadID),
      );

      interaction.__count = ((interaction.__count: any): number) - 1;

      // If no async work was scheduled for this interaction,
      // Notify subscribers that it's completed.
      if (((interaction.__count: any): number) === 0) {
        ((subscribers: any): Subscribers).forEach(subscriber =>
          subscriber.onInteractionScheduledWorkCompleted(interaction),
        );
      }
    }
  }
}

export function unsubscribe(subscriber: Subscriber): void {
  if (enableInteractionTracking && enableInteractionTrackingObserver) {
    ((subscribers: any): Subscribers).delete(subscriber);
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
      interaction.__count = ((interaction.__count: any): number) + 1;
    });

    ((subscribers: any): Subscribers).forEach(subscriber =>
      subscriber.onWorkScheduled(wrappedInteractions, threadID),
    );
  }

  const wrapped = (...args) => {
    const prevInteractions = ((interactionsRef: any): InteractionsRef).current;
    ((interactionsRef: any): InteractionsRef).current = wrappedInteractions;

    try {
      if (enableInteractionTrackingObserver) {
        ((subscribers: any): Subscribers).forEach(subscriber =>
          subscriber.onWorkStarted(wrappedInteractions, threadID),
        );
      }

      return callback(...args);
    } finally {
      ((interactionsRef: any): InteractionsRef).current = prevInteractions;

      if (enableInteractionTrackingObserver) {
        ((subscribers: any): Subscribers).forEach(subscriber =>
          subscriber.onWorkStopped(wrappedInteractions, threadID),
        );

        // Update pending async counts for all wrapped interactions.
        // If this was the last scheduled async work for any of them,
        // Mark them as completed.
        wrappedInteractions.forEach(interaction => {
          interaction.__count = ((interaction.__count: any): number) - 1;

          if (((interaction.__count: any): number) === 0) {
            ((subscribers: any): Subscribers).forEach(subscriber =>
              subscriber.onInteractionScheduledWorkCompleted(interaction),
            );
          }
        });
      }
    }
  };

  wrapped.cancel = () => {
    if (enableInteractionTrackingObserver) {
      ((subscribers: any): Subscribers).forEach(subscriber =>
        subscriber.onWorkCancelled(wrappedInteractions, threadID),
      );

      // Update pending async counts for all wrapped interactions.
      // If this was the last scheduled async work for any of them,
      // Mark them as completed.
      wrappedInteractions.forEach(interaction => {
        interaction.__count = ((interaction.__count: any): number) - 1;

        if (((interaction.__count: any): number) === 0) {
          ((subscribers: any): Subscribers).forEach(subscriber =>
            subscriber.onInteractionScheduledWorkCompleted(interaction),
          );
        }
      });
    }
  };

  return wrapped;
}
