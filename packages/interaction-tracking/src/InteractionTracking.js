/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {enableInteractionTracking} from 'shared/ReactFeatureFlags';

export type Interaction = {|
  __count: number,
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

  // A batch of scheduled work has been canceled.
  // Work is done by a "thread" which is identified by a unique ID.
  onWorkCanceled: (interactions: Set<Interaction>, threadID: number) => void,

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

export type SubscriberRef = {
  current: Subscriber | null,
};

const DEFAULT_THREAD_ID = 0;

// Counters used to generate unique IDs.
let interactionIDCounter: number = 0;
let threadIDCounter: number = 0;

// Set of currently tracked interactions.
// Interactions "stack"–
// Meaning that newly tracked interactions are appended to the previously active set.
// When an interaction goes out of scope, the previous set (if any) is restored.
let interactionsRef: InteractionsRef = (null: any);

// Listener(s) to notify when interactions begin and end.
let subscriberRef: SubscriberRef = (null: any);

if (enableInteractionTracking) {
  interactionsRef = {
    current: new Set(),
  };
  subscriberRef = {
    current: null,
  };
}

// These values are exported for libraries with advanced use cases (i.e. React).
// They should not typically be accessed directly.
export {interactionsRef as __interactionsRef, subscriberRef as __subscriberRef};

export function clear(callback: Function): any {
  if (!enableInteractionTracking) {
    return callback();
  }

  const prevInteractions = interactionsRef.current;
  interactionsRef.current = new Set();

  try {
    return callback();
  } finally {
    interactionsRef.current = prevInteractions;
  }
}

export function getCurrent(): Set<Interaction> | null {
  if (!enableInteractionTracking) {
    return null;
  } else {
    return interactionsRef.current;
  }
}

export function getThreadID(): number {
  return ++threadIDCounter;
}

export function track(
  name: string,
  timestamp: number,
  callback: Function,
  threadID: number = DEFAULT_THREAD_ID,
): any {
  if (!enableInteractionTracking) {
    return callback();
  }

  const interaction: Interaction = {
    __count: 1,
    id: interactionIDCounter++,
    name,
    timestamp,
  };

  const prevInteractions = interactionsRef.current;

  // Tracked interactions should stack/accumulate.
  // To do that, clone the current interactions.
  // The previous set will be restored upon completion.
  const interactions = new Set(prevInteractions);
  interactions.add(interaction);
  interactionsRef.current = interactions;

  const subscriber = subscriberRef.current;
  let returnValue;

  try {
    if (subscriber !== null) {
      subscriber.onInteractionTracked(interaction);
    }
  } finally {
    try {
      if (subscriber !== null) {
        subscriber.onWorkStarted(interactions, threadID);
      }
    } finally {
      try {
        returnValue = callback();
      } finally {
        interactionsRef.current = prevInteractions;

        try {
          if (subscriber !== null) {
            subscriber.onWorkStopped(interactions, threadID);
          }
        } finally {
          interaction.__count--;

          // If no async work was scheduled for this interaction,
          // Notify subscribers that it's completed.
          if (subscriber !== null && interaction.__count === 0) {
            subscriber.onInteractionScheduledWorkCompleted(interaction);
          }
        }
      }
    }
  }

  return returnValue;
}

export function wrap(
  callback: Function,
  threadID: number = DEFAULT_THREAD_ID,
): Function {
  if (!enableInteractionTracking) {
    return callback;
  }

  const wrappedInteractions = interactionsRef.current;

  let subscriber = subscriberRef.current;
  if (subscriber !== null) {
    subscriber.onWorkScheduled(wrappedInteractions, threadID);
  }

  // Update the pending async work count for the current interactions.
  // Update after calling subscribers in case of error.
  wrappedInteractions.forEach(interaction => {
    interaction.__count++;
  });

  function wrapped() {
    const prevInteractions = interactionsRef.current;
    interactionsRef.current = wrappedInteractions;

    subscriber = subscriberRef.current;

    try {
      let returnValue;

      try {
        if (subscriber !== null) {
          subscriber.onWorkStarted(wrappedInteractions, threadID);
        }
      } finally {
        try {
          returnValue = callback.apply(undefined, arguments);
        } finally {
          interactionsRef.current = prevInteractions;

          if (subscriber !== null) {
            subscriber.onWorkStopped(wrappedInteractions, threadID);
          }
        }
      }

      return returnValue;
    } finally {
      // Update pending async counts for all wrapped interactions.
      // If this was the last scheduled async work for any of them,
      // Mark them as completed.
      wrappedInteractions.forEach(interaction => {
        interaction.__count--;

        if (subscriber !== null && interaction.__count === 0) {
          subscriber.onInteractionScheduledWorkCompleted(interaction);
        }
      });
    }
  }

  wrapped.cancel = function cancel() {
    subscriber = subscriberRef.current;

    try {
      if (subscriber !== null) {
        subscriber.onWorkCanceled(wrappedInteractions, threadID);
      }
    } finally {
      // Update pending async counts for all wrapped interactions.
      // If this was the last scheduled async work for any of them,
      // Mark them as completed.
      wrappedInteractions.forEach(interaction => {
        interaction.__count--;

        if (subscriber && interaction.__count === 0) {
          subscriber.onInteractionScheduledWorkCompleted(interaction);
        }
      });
    }
  };

  return wrapped;
}
