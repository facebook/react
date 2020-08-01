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
export const NoEffect = /*                     */ 0b0000000000000000;
export const PerformedWork = /*                */ 0b0000000000000001;

// You can change the rest (and add more).
export const Placement = /*                    */ 0b0000000000000010;
export const Update = /*                       */ 0b0000000000000100;
export const PlacementAndUpdate = /*           */ 0b0000000000000110;
export const Deletion = /*                     */ 0b0000000000001000;
export const ContentReset = /*                 */ 0b0000000000010000;
export const Callback = /*                     */ 0b0000000000100000;
export const DidCapture = /*                   */ 0b0000000001000000;
export const Ref = /*                          */ 0b0000000010000000;
export const Snapshot = /*                     */ 0b0000000100000000;
export const Passive = /*                      */ 0b0000001000000000;
// TODO (effects) Remove this bit once the new reconciler is synced to the old.
export const PassiveUnmountPendingDev = /*     */ 0b0010000000000000;
export const Hydrating = /*                    */ 0b0000010000000000;
export const HydratingAndUpdate = /*           */ 0b0000010000000100;

// Passive & Update & Callback & Ref & Snapshot
export const LifecycleEffectMask = /*          */ 0b0000001110100100;

// Union of all host effects
export const HostEffectMask = /*               */ 0b0000011111111111;

// These are not really side effects, but we still reuse this field.
export const Incomplete = /*                   */ 0b0000100000000000;
export const ShouldCapture = /*                */ 0b0001000000000000;
export const ForceUpdateForLegacySuspense = /* */ 0b0100000000000000;

// Static tags describe aspects of a fiber that are not specific to a render,
// e.g. a fiber uses a passive effect (even if there are no updates on this particular render).
// This enables us to defer more work in the unmount case,
// since we can defer traversing the tree during layout to look for Passive effects,
// and instead rely on the static flag as a signal that there may be cleanup work.
export const PassiveStatic = /*                */ 0b1000000000000000;

// Union of side effect groupings as pertains to subtreeTag
export const BeforeMutationMask = /*           */ 0b0000001100001010;
export const MutationMask = /*                 */ 0b0000010010011110;
export const LayoutMask = /*                   */ 0b0000000010100100;
export const PassiveMask = /*                  */ 0b0000001000001000;

// Union of tags that don't get reset on clones.
// This allows certain concepts to persist without recalculting them,
// e.g. whether a subtree contains passive effects or portals.
export const StaticMask = /*                   */ 0b1000000000000000;
