/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export opaque type LanePriority = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export const SyncLanePriority: LanePriority = 10;
export const SyncBatchedLanePriority: LanePriority = 9;
export const InputDiscreteLanePriority: LanePriority = 8;
export const InputContinuousLanePriority: LanePriority = 7;
export const DefaultLanePriority: LanePriority = 6;
export const TransitionShortLanePriority: LanePriority = 5;
export const TransitionLongLanePriority: LanePriority = 4;
export const HydrationContinuousLanePriority: LanePriority = 3;
export const IdleLanePriority: LanePriority = 2;
export const OffscreenLanePriority: LanePriority = 1;
export const NoLanePriority: LanePriority = 0;
