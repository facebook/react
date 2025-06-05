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
  disableDefaultPropsExceptForClasses,
  disableLegacyContextForFunctionComponents,
  disableSchedulerTimeoutInWorkLoop,
  enableDO_NOT_USE_disableStrictPassiveEffect,
  enableHiddenSubtreeInsertionEffectCleanup,
  enableInfiniteRenderLoopDetection,
  enableNoCloningMemoCache,
  enableObjectFiber,
  enableRenderableContext,
  enableRetryLaneExpiration,
  enableSiblingPrerendering,
  enableTransitionTracing,
  enableTrustedTypesIntegration,
  enableUseEffectCRUDOverload,
  favorSafetyOverHydrationPerf,
  renameElementSymbol,
  retryLaneExpirationMs,
  syncLaneExpirationMs,
  transitionLaneExpirationMs,
  enableFastAddPropertiesInDiffing,
  enableViewTransition,
  enableComponentPerformanceTrack,
  enableScrollEndPolyfill,
  enableFragmentRefs,
  ownerStackLimit,
} = dynamicFeatureFlags;

// On WWW, __EXPERIMENTAL__ is used for a new modern build.
// It's not used anywhere in production yet.

export const enableProfilerTimer = __PROFILE__;
export const enableProfilerCommitHooks = __PROFILE__;
export const enableProfilerNestedUpdatePhase = __PROFILE__;
export const enableUpdaterTracking = __PROFILE__;

export const enableSuspenseAvoidThisFallback = true;

export const enableCPUSuspense = true;
export const enableUseEffectEventHook = true;
export const enableMoveBefore = false;
export const disableInputAttributeSyncing = false;
export const enableLegacyFBSupport = true;

export const enableYieldingBeforePassive = false;

export const enableThrottledScheduling = false;

export const enableHydrationLaneScheduling = true;

// Logs additional User Timing API marks for use with an experimental profiling tool.
export const enableSchedulingProfiler: boolean =
  __PROFILE__ && dynamicFeatureFlags.enableSchedulingProfiler;

export const disableLegacyContext = __EXPERIMENTAL__;

export const enableLegacyCache = true;

export const enableAsyncIterableChildren = false;

export const enableTaint = false;

export const enablePostpone = false;

export const enableHalt = false;

// TODO: www currently relies on this feature. It's disabled in open source.
// Need to remove it.
export const disableCommentsAsDOMContainers = false;

export const enableCreateEventHandleAPI = true;

export const enableScopeAPI = true;

export const enableSuspenseCallback = true;

export const enableLegacyHidden = true;

export const disableTextareaChildren = __EXPERIMENTAL__;

export const enableFizzExternalRuntime = true;

export const passChildrenWhenCloningPersistedNodes = false;

export const enablePersistedModeClonedFlag = false;

export const enableAsyncDebugInfo = false;
export const disableClientCache = true;

export const enableReactTestRendererWarning = false;

export const disableLegacyMode = true;

export const enableShallowPropDiffing = false;

export const enableEagerAlternateStateNodeCleanup = true;

export const enableLazyPublicInstanceInFabric = false;

export const enableSwipeTransition = false;

// Flow magic to verify the exports of this file match the original version.
((((null: any): ExportsType): FeatureFlagsType): ExportsType);
