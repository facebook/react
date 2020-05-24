/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export type EventSystemFlags = number;

export const PLUGIN_EVENT_SYSTEM = 1;
export const RESPONDER_EVENT_SYSTEM = 1 << 1;
export const IS_TARGET_PHASE_ONLY = 1 << 2;
export const IS_PASSIVE = 1 << 3;
export const PASSIVE_NOT_SUPPORTED = 1 << 4;
export const IS_REPLAYED = 1 << 5;
export const IS_FIRST_ANCESTOR = 1 << 6;
export const LEGACY_FB_SUPPORT = 1 << 7;
