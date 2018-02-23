/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export type PriorityLevel = 0 | 1 | 2 | 3 | 4;

export const NoPriority = 0;
export const RenderPriority = 1;
export const SyncPriority = 2;
export const InteractivePriority = 3;
export const DeferredPriority = 4;
