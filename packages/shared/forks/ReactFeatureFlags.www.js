/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import typeof * as FeatureFlagsType from 'shared/ReactFeatureFlags';
import typeof * as ExportsType from './ReactFeatureFlags.www';
import typeof * as DynamicFeatureFlags from './ReactFeatureFlags.www-dynamic';

// Re-export dynamic flags from the www version.
const dynamicFeatureFlags: DynamicFeatureFlags = require('ReactFeatureFlags');

export const {
  alwaysThrottleRetries,
  disableLegacyContextForFunctionComponents,
  disableSchedulerTimeoutInWorkLoop,
  enableHiddenSubtreeInsertionEffectCleanup,
  enableInfiniteRenderLoopDetection,
  enableNoCloningMemoCache,
  enableObjectFiber,
  enableRetryLaneExpiration,
  enableTransitionTracing,
  enableTrustedTypesIntegration,
  renameElementSymbol,
  retryLaneExpirationMs,
  syncLaneExpirationMs,
  transitionLaneExpirationMs,
  enableViewTransition,
  enableComponentPerformanceTrack,
  enableScrollEndPolyfill,
  enableFragmentRefs,
} = dynamicFeatureFlags;

// On WWW, __EXPERIMENTAL__ is used for a new modern build.
// It's not used anywhere in production yet.

export const enableProfilerTimer = __PROFILE__;
export const enableProfilerCommitHooks = __PROFILE__;
export const enableProfilerNestedUpdatePhase = __PROFILE__;
export const enableUpdaterTracking = __PROFILE__;

export const enableSuspenseAvoidThisFallback: boolean = true;

export const enableCPUSuspense: boolean = true;
export const enableUseEffectEventHook: boolean = true;
export const enableMoveBefore: boolean = false;
export const disableInputAttributeSyncing: boolean = false;
export const enableLegacyFBSupport: boolean = true;

export const enableYieldingBeforePassive: boolean = false;

export const enableThrottledScheduling: boolean = false;

export const enableHydrationLaneScheduling: boolean = true;

// Logs additional User Timing API marks for use with an experimental profiling tool.
export const enableSchedulingProfiler: boolean =
  __PROFILE__ && dynamicFeatureFlags.enableSchedulingProfiler;

export const disableLegacyContext = __EXPERIMENTAL__;

export const enableLegacyCache: boolean = true;

export const enableAsyncIterableChildren: boolean = false;

export const enableTaint: boolean = false;

export const enablePostpone: boolean = false;

export const enableHalt: boolean = false;

// TODO: www currently relies on this feature. It's disabled in open source.
// Need to remove it.
export const disableCommentsAsDOMContainers: boolean = false;

export const enableCreateEventHandleAPI: boolean = true;

export const enableScopeAPI: boolean = true;

export const enableSuspenseCallback: boolean = true;

export const enableLegacyHidden: boolean = true;

export const disableTextareaChildren = __EXPERIMENTAL__;

export const enableFizzExternalRuntime: boolean = true;

export const passChildrenWhenCloningPersistedNodes: boolean = false;

export const enablePersistedModeClonedFlag: boolean = false;

export const enableAsyncDebugInfo: boolean = false;
export const disableClientCache: boolean = true;

export const enableReactTestRendererWarning: boolean = false;

export const disableLegacyMode: boolean = true;

export const enableEagerAlternateStateNodeCleanup: boolean = true;

export const enableGestureTransition: boolean = false;

export const enableSuspenseyImages: boolean = false;
export const enableFizzBlockingRender: boolean = true;
export const enableSrcObject: boolean = false;
export const enableHydrationChangeEvent: boolean = false;
export const enableDefaultTransitionIndicator: boolean = false;

export const ownerStackLimit = 1e4;

// Flow magic to verify the exports of this file match the original version.
((((null: any): ExportsType): FeatureFlagsType): ExportsType);
