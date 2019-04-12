/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {enableSchedulerTracing} from 'shared/ReactFeatureFlags';

const DEFAULT_THREAD_ID = 0;

// Counters used to generate unique IDs.
let interactionIDCounter = 0;
let threadIDCounter = 0;

// Set of currently traced interactions.
// Interactions "stack"–
// Meaning that newly traced interactions are appended to the previously active set.
// When an interaction goes out of scope, the previous set (if any) is restored.
let interactionsRef = null;

// Listener(s) to notify when interactions begin and end.
let subscriberRef = null;

if (enableSchedulerTracing) {
  interactionsRef = {
    current: new Set(),
  };
  subscriberRef = {
    current: null,
  };
}

export {interactionsRef as __interactionsRef, subscriberRef as __subscriberRef};
export function unstable_clear(callback) {
  if (!enableSchedulerTracing) {
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
export function unstable_getCurrent() {
  if (!enableSchedulerTracing) {
    return null;
  } else {
    return interactionsRef.current;
  }
}
export function unstable_getThreadID() {
  return ++threadIDCounter;
}
export function unstable_trace(
  name,
  timestamp,
  callback,
  threadID = DEFAULT_THREAD_ID,
) {
  if (!enableSchedulerTracing) {
    return callback();
  }

  const interaction = {
    __count: 1,
    id: interactionIDCounter++,
    name,
    timestamp,
  };

  const prevInteractions = interactionsRef.current;

  // Traced interactions should stack/accumulate.
  // To do that, clone the current interactions.
  // The previous set will be restored upon completion.
  const interactions = new Set(prevInteractions);
  interactions.add(interaction);
  interactionsRef.current = interactions;

  const subscriber = subscriberRef.current;
  let returnValue;

  try {
    if (subscriber !== null) {
      subscriber.onInteractionTraced(interaction);
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

export function unstable_wrap(callback, threadID = DEFAULT_THREAD_ID) {
  if (!enableSchedulerTracing) {
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

  let hasRun = false;

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
      if (!hasRun) {
        // We only expect a wrapped function to be executed once,
        // But in the event that it's executed more than once–
        // Only decrement the outstanding interaction counts once.
        hasRun = true;

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
