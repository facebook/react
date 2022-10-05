/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {enableNewReconciler} from 'shared/ReactFeatureFlags';

import {
  DiscreteEventPriority as DiscreteEventPriority_old,
  ContinuousEventPriority as ContinuousEventPriority_old,
  DefaultEventPriority as DefaultEventPriority_old,
  IdleEventPriority as IdleEventPriority_old,
  getCurrentUpdatePriority as getCurrentUpdatePriority_old,
  setCurrentUpdatePriority as setCurrentUpdatePriority_old,
  runWithPriority as runWithPriority_old,
  isHigherEventPriority as isHigherEventPriority_old,
} from './ReactEventPriorities.old';

import {
  DiscreteEventPriority as DiscreteEventPriority_new,
  ContinuousEventPriority as ContinuousEventPriority_new,
  DefaultEventPriority as DefaultEventPriority_new,
  IdleEventPriority as IdleEventPriority_new,
  getCurrentUpdatePriority as getCurrentUpdatePriority_new,
  setCurrentUpdatePriority as setCurrentUpdatePriority_new,
  runWithPriority as runWithPriority_new,
  isHigherEventPriority as isHigherEventPriority_new,
} from './ReactEventPriorities.new';

export opaque type EventPriority = number;

export const DiscreteEventPriority: EventPriority = enableNewReconciler
  ? (DiscreteEventPriority_new: any)
  : (DiscreteEventPriority_old: any);
export const ContinuousEventPriority: EventPriority = enableNewReconciler
  ? (ContinuousEventPriority_new: any)
  : (ContinuousEventPriority_old: any);
export const DefaultEventPriority: EventPriority = enableNewReconciler
  ? (DefaultEventPriority_new: any)
  : (DefaultEventPriority_old: any);
export const IdleEventPriority: EventPriority = enableNewReconciler
  ? (IdleEventPriority_new: any)
  : (IdleEventPriority_old: any);

export function runWithPriority<T>(priority: EventPriority, fn: () => T): T {
  return enableNewReconciler
    ? runWithPriority_new((priority: any), fn)
    : runWithPriority_old((priority: any), fn);
}

export function getCurrentUpdatePriority(): EventPriority {
  return enableNewReconciler
    ? (getCurrentUpdatePriority_new(): any)
    : (getCurrentUpdatePriority_old(): any);
}

export function setCurrentUpdatePriority(priority: EventPriority): void {
  return enableNewReconciler
    ? setCurrentUpdatePriority_new((priority: any))
    : setCurrentUpdatePriority_old((priority: any));
}

export function isHigherEventPriority(
  a: EventPriority,
  b: EventPriority,
): boolean {
  return enableNewReconciler
    ? isHigherEventPriority_new((a: any), (b: any))
    : isHigherEventPriority_old((a: any), (b: any));
}
