/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export {
  SyncLane as DiscreteEventPriority,
  InputContinuousLane as ContinuousEventPriority,
  DefaultLane as DefaultEventPriority,
  IdleLane as IdleEventPriority,
} from './ReactFiberLane.new';
