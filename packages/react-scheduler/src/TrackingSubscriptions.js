/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Interaction, Subscriber, SubscriberRef} from './Tracking';

import {enableSchedulerTracking} from 'shared/ReactFeatureFlags';
import {__getSubscriberRef} from 'react-scheduler/tracking';

let subscriberRef: SubscriberRef = (null: any);
let subscribers: Set<Subscriber> = (null: any);
if (enableSchedulerTracking) {
  subscriberRef = __getSubscriberRef();
  subscribers = new Set();
}

export function unstable_subscribe(subscriber: Subscriber): void {
  if (enableSchedulerTracking) {
    subscribers.add(subscriber);

    if (subscribers.size === 1) {
      subscriberRef.current = {
        onInteractionScheduledWorkCompleted,
        onInteractionTracked,
        onWorkCanceled,
        onWorkScheduled,
        onWorkStarted,
        onWorkStopped,
      };
    }
  }
}

export function unstable_unsubscribe(subscriber: Subscriber): void {
  if (enableSchedulerTracking) {
    subscribers.delete(subscriber);

    if (subscribers.size === 0) {
      subscriberRef.current = null;
    }
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
