/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactPriorityLevel
 * @flow
 */

'use strict';

export type PriorityLevel = 0 | 1 | 2 | 3 | 4 | 5;

export const NoWork = 0; // No work is pending.
export const SynchronousPriority = 1; // For controlled text inputs. Synchronous side-effects.
export const TaskPriority = 2; // Completes at the end of the current tick.
export const HighPriority = 3; // Interaction that needs to complete pretty soon to feel responsive.
export const LowPriority = 4; // Data fetching, or result from updating stores.
export const OffscreenPriority = 5; // Won't be visible but do the work in case it becomes visible.
