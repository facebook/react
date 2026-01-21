/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 */

export opaque type NoPriorityType: symbol = symbol;
export opaque type ImmediatePriorityType: symbol = symbol;
export opaque type UserBlockingPriorityType: symbol = symbol;
export opaque type NormalPriorityType: symbol = symbol;
export opaque type LowPriorityType: symbol = symbol;
export opaque type IdlePriorityType: symbol = symbol;

export const NoPriority: NoPriorityType = (Symbol.for(
  'scheduler.no_priority',
): any);
export const ImmediatePriority: ImmediatePriorityType = (Symbol.for(
  'scheduler.immediate_priority',
): any);
export const UserBlockingPriority: UserBlockingPriorityType = (Symbol.for(
  'scheduler.user_blocking_priority',
): any);
export const NormalPriority: NormalPriorityType = (Symbol.for(
  'scheduler.normal_priority',
): any);
export const LowPriority: LowPriorityType = (Symbol.for(
  'scheduler.low_priority',
): any);
export const IdlePriority: IdlePriorityType = (Symbol.for(
  'scheduler.idle_priority',
): any);

export type PriorityLevel =
  | NoPriorityType
  | ImmediatePriorityType
  | UserBlockingPriorityType
  | NormalPriorityType
  | LowPriorityType
  | IdlePriorityType;
