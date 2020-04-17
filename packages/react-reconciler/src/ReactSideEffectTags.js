/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export type SideEffectTag = number;

// Don't change these two values. They're used by React Dev Tools.
export const NoEffect = /*                 */ 0b00000000000000;
export const PerformedWork = /*            */ 0b00000000000001;

// You can change the rest (and add more).
export const Placement = /*                */ 0b00000000000010;
export const Update = /*                   */ 0b00000000000100;
export const PlacementAndUpdate = /*       */ 0b00000000000110;
export const Deletion = /*                 */ 0b00000000001000;
export const ContentReset = /*             */ 0b00000000010000;
export const Callback = /*                 */ 0b00000000100000;
export const DidCapture = /*               */ 0b00000001000000;
export const Ref = /*                      */ 0b00000010000000;
export const Snapshot = /*                 */ 0b00000100000000;
export const Passive = /*                  */ 0b00001000000000;
export const PassiveUnmountPendingDev = /* */ 0b10000000000000;
export const Hydrating = /*                */ 0b00010000000000;
export const HydratingAndUpdate = /*       */ 0b00010000000100;

// Passive & Update & Callback & Ref & Snapshot
export const LifecycleEffectMask = /*      */ 0b00001110100100;

// Union of all host effects
export const HostEffectMask = /*           */ 0b00011111111111;

export const Incomplete = /*               */ 0b00100000000000;
export const ShouldCapture = /*            */ 0b01000000000000;
