/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactNodeList, OffscreenMode, Wakeable} from 'shared/ReactTypes';
import type {Lanes} from './ReactFiberLane.old';
import type {SpawnedCachePool} from './ReactFiberCacheComponent.new';
import type {
  Transition,
  TracingMarkerInstance,
} from './ReactFiberTracingMarkerComponent.new';

export type OffscreenProps = {
  // TODO: Pick an API before exposing the Offscreen type. I've chosen an enum
  // for now, since we might have multiple variants. For example, hiding the
  // content without changing the layout.
  //
  // Default mode is visible. Kind of a weird default for a component
  // called "Offscreen." Possible alt: <Visibility />?
  mode?: OffscreenMode | null | void,
  children?: ReactNodeList,
};

// We use the existence of the state object as an indicator that the component
// is hidden.
export type OffscreenState = {
  // TODO: This doesn't do anything, yet. It's always NoLanes. But eventually it
  // will represent the pending work that must be included in the render in
  // order to unhide the component.
  baseLanes: Lanes,
  cachePool: SpawnedCachePool | null,
};

export type OffscreenQueue = {
  transitions: Array<Transition> | null,
  markerInstances: Array<TracingMarkerInstance> | null,
  wakeables: Set<Wakeable> | null,
};

type OffscreenVisibility = number;

export const OffscreenVisible = /*                     */ 0b01;
export const OffscreenPassiveEffectsConnected = /*     */ 0b10;

export type OffscreenInstance = {
  visibility: OffscreenVisibility,
  pendingMarkers: Set<TracingMarkerInstance> | null,
  transitions: Set<Transition> | null,
  retryCache: WeakSet<Wakeable> | Set<Wakeable> | null,
};
