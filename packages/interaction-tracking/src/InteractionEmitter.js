/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Interaction} from './InteractionTracking';

type Interactions = Array<Interaction>;

export type InteractionObserver = {
  onInteractionsScheduled: (
    interactions: Interactions,
    executionID: number,
  ) => void,
  onInteractionsStarting: (
    interactions: Interactions,
    executionID: number,
  ) => void,
  onInteractionsEnded: (
    interactions: Interactions,
    executionID: number,
  ) => void,
};

const observers: Array<InteractionObserver> = [];

export function registerInteractionObserver(
  observer: InteractionObserver,
): void {
  observers.push(observer);
}

export function __onInteractionsScheduled(
  interactions: Interactions,
  executionID: number,
): void {
  if (!observers.length) {
    return;
  }
  observers.forEach(observer => {
    observer.onInteractionsScheduled(interactions, executionID);
  });
}

export function __onInteractionsStarting(
  interactions: Interactions,
  executionID: number,
) {
  if (!observers.length) {
    return;
  }
  observers.forEach(observer => {
    observer.onInteractionsStarting(interactions, executionID);
  });
}

export function __onInteractionsEnded(
  interactions: Interactions,
  executionID: number,
) {
  if (!observers.length) {
    return;
  }
  observers.forEach(observer => {
    observer.onInteractionsEnded(interactions, executionID);
  });
}
