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
} from './ReactEventPriorities.old';

import {
  DiscreteEventPriority as DiscreteEventPriority_new,
  ContinuousEventPriority as ContinuousEventPriority_new,
  DefaultEventPriority as DefaultEventPriority_new,
  IdleEventPriority as IdleEventPriority_new,
} from './ReactEventPriorities.new';

export const DiscreteEventPriority = enableNewReconciler
  ? DiscreteEventPriority_new
  : DiscreteEventPriority_old;
export const ContinuousEventPriority = enableNewReconciler
  ? ContinuousEventPriority_new
  : ContinuousEventPriority_old;
export const DefaultEventPriority = enableNewReconciler
  ? DefaultEventPriority_new
  : DefaultEventPriority_old;
export const IdleEventPriority = enableNewReconciler
  ? IdleEventPriority_new
  : IdleEventPriority_old;
