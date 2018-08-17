/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Interaction, Subscriber} from './InteractionTracking';

import {enableInteractionTracking} from 'shared/ReactFeatureFlags';
import {__subscriberRef} from 'interaction-tracking';

let subscribers: Set<Subscriber> = (null: any);
if (enableInteractionTracking) {
  subscribers = new Set();
}

export function subscribe(subscriber: Subscriber): void {
  if (enableInteractionTracking) {
    subscribers.add(subscriber);
  }
}

export function unsubscribe(subscriber: Subscriber): void {
  if (enableInteractionTracking) {
    subscribers.delete(subscriber);
  }
}

function onInteractionTracked(interaction: Interaction): void {
  let didCatchError = false;
  let caughtError = null;

  subscribers.forEach(subscriber => {
    try {
      subscriber.onInteractionTracked(interaction);
    } catch (error) {
      if (!didCatchError) {
        didCatchError = true;
        caughtError = error;
      }
    }
  });

  if (didCatchError) {
    throw caughtError;
  }
}

function onInteractionScheduledWorkCompleted(interaction: Interaction): void {
  let didCatchError = false;
  let caughtError = null;

  subscribers.forEach(subscriber => {
    try {
      subscriber.onInteractionScheduledWorkCompleted(interaction);
    } catch (error) {
      if (!didCatchError) {
        didCatchError = true;
        caughtError = error;
      }
    }
  });

  if (didCatchError) {
    throw caughtError;
  }
}

function onWorkScheduled(
  interactions: Set<Interaction>,
  threadID: number,
): void {
  let didCatchError = false;
  let caughtError = null;

  subscribers.forEach(subscriber => {
    try {
      subscriber.onWorkScheduled(interactions, threadID);
    } catch (error) {
      if (!didCatchError) {
        didCatchError = true;
        caughtError = error;
      }
    }
  });

  if (didCatchError) {
    throw caughtError;
  }
}

function onWorkStarted(interactions: Set<Interaction>, threadID: number): void {
  let didCatchError = false;
  let caughtError = null;

  subscribers.forEach(subscriber => {
    try {
      subscriber.onWorkStarted(interactions, threadID);
    } catch (error) {
      if (!didCatchError) {
        didCatchError = true;
        caughtError = error;
      }
    }
  });

  if (didCatchError) {
    throw caughtError;
  }
}

function onWorkStopped(interactions: Set<Interaction>, threadID: number): void {
  let didCatchError = false;
  let caughtError = null;

  subscribers.forEach(subscriber => {
    try {
      subscriber.onWorkStopped(interactions, threadID);
    } catch (error) {
      if (!didCatchError) {
        didCatchError = true;
        caughtError = error;
      }
    }
  });

  if (didCatchError) {
    throw caughtError;
  }
}

function onWorkCanceled(
  interactions: Set<Interaction>,
  threadID: number,
): void {
  let didCatchError = false;
  let caughtError = null;

  subscribers.forEach(subscriber => {
    try {
      subscriber.onWorkCanceled(interactions, threadID);
    } catch (error) {
      if (!didCatchError) {
        didCatchError = true;
        caughtError = error;
      }
    }
  });

  if (didCatchError) {
    throw caughtError;
  }
}

if (enableInteractionTracking) {
  __subscriberRef.current = {
    onInteractionScheduledWorkCompleted,
    onInteractionTracked,
    onWorkCanceled,
    onWorkScheduled,
    onWorkStarted,
    onWorkStopped,
  };
}
