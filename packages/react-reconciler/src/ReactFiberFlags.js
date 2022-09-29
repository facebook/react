/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {enableCreateEventHandleAPI} from 'shared/ReactFeatureFlags';

export type Flags = number;

// Don't change these two values. They're used by React Dev Tools.
export const NoFlags = /*                      */ 0b000000000000000000000000;
export const PerformedWork = /*                */ 0b000000000000000000000001;

// You can change the rest (and add more).
export const Placement = /*                    */ 0b000000000000000000000010;
export const Update = /*                       */ 0b000000000000000000000100;
export const ChildDeletion = /*                */ 0b000000000000000000001000;
export const ContentReset = /*                 */ 0b000000000000000000010000;
export const Callback = /*                     */ 0b000000000000000000100000;
export const DidCapture = /*                   */ 0b000000000000000001000000;
export const ForceClientRender = /*            */ 0b000000000000000010000000;
export const Ref = /*                          */ 0b000000000000000100000000;
export const Snapshot = /*                     */ 0b000000000000001000000000;
export const Passive = /*                      */ 0b000000000000010000000000;
export const Hydrating = /*                    */ 0b000000000000100000000000;
export const Visibility = /*                   */ 0b000000000001000000000000;
export const StoreConsistency = /*             */ 0b000000000010000000000000;

export const LifecycleEffectMask =
  Passive | Update | Callback | Ref | Snapshot | StoreConsistency;

// Union of all commit flags (flags with the lifetime of a particular commit)
export const HostEffectMask = /*               */ 0b000000000011111111111111;

// These are not really side effects, but we still reuse this field.
export const Incomplete = /*                   */ 0b000000000100000000000000;
export const ShouldCapture = /*                */ 0b000000001000000000000000;
export const ForceUpdateForLegacySuspense = /* */ 0b000000010000000000000000;
export const DidPropagateContext = /*          */ 0b000000100000000000000000;
export const NeedsPropagation = /*             */ 0b000001000000000000000000;
export const Forked = /*                       */ 0b000010000000000000000000;

// Static tags describe aspects of a fiber that are not specific to a render,
// e.g. a fiber uses a passive effect (even if there are no updates on this particular render).
// This enables us to defer more work in the unmount case,
// since we can defer traversing the tree during layout to look for Passive effects,
// and instead rely on the static flag as a signal that there may be cleanup work.
export const RefStatic = /*                    */ 0b000100000000000000000000;
export const LayoutStatic = /*                 */ 0b001000000000000000000000;
export const PassiveStatic = /*                */ 0b010000000000000000000000;

// Flag used to identify newly inserted fibers. It isn't reset after commit unlike `Placement`.
export const PlacementDEV = /*                 */ 0b100000000000000000000000;

// Groups of flags that are used in the commit phase to skip over trees that
// don't contain effects, by checking subtreeFlags.

export const BeforeMutationMask =
  // TODO: Remove Update flag from before mutation phase by re-landing Visibility
  // flag logic (see #20043)
  Update |
  Snapshot |
  (enableCreateEventHandleAPI
    ? // createEventHandle needs to visit deleted and hidden trees to
      // fire beforeblur
      // TODO: Only need to visit Deletions during BeforeMutation phase if an
      // element is focused.
      ChildDeletion | Visibility
    : 0);

export const MutationMask =
  Placement |
  Update |
  ChildDeletion |
  ContentReset |
  Ref |
  Hydrating |
  Visibility;
export const LayoutMask = Update | Callback | Ref | Visibility;

// TODO: Split into PassiveMountMask and PassiveUnmountMask
export const PassiveMask = Passive | Visibility | ChildDeletion;

// Union of tags that don't get reset on clones.
// This allows certain concepts to persist without recalculating them,
// e.g. whether a subtree contains passive effects or portals.
export const StaticMask = LayoutStatic | PassiveStatic | RefStatic;
