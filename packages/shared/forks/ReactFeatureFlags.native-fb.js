/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import typeof * as FeatureFlagsType from 'shared/ReactFeatureFlags';
import typeof * as ExportsType from './ReactFeatureFlags.native-fb';
import typeof * as DynamicExportsType from './ReactFeatureFlags.native-fb-dynamic';

// Re-export dynamic flags from the internal module.
// Intentionally using * because this import is compiled to a `require` call.
import * as dynamicFlagsUntyped from 'ReactNativeInternalFeatureFlags';
const dynamicFlags: DynamicExportsType = (dynamicFlagsUntyped: any);

// We destructure each value before re-exporting to avoid a dynamic look-up on
// the exports object every time a flag is read.
export const {
  alwaysThrottleRetries,
  enableHiddenSubtreeInsertionEffectCleanup,
  enableObjectFiber,
  enablePersistedModeClonedFlag,
  enableShallowPropDiffing,
  enableUseEffectCRUDOverload,
  enableEagerAlternateStateNodeCleanup,
  passChildrenWhenCloningPersistedNodes,
  enableSiblingPrerendering,
  enableFastAddPropertiesInDiffing,
  enableLazyPublicInstanceInFabric,
  renameElementSymbol,
  ownerStackLimit,
} = dynamicFlags;

// The rest of the flags are static for better dead code elimination.
export const disableClientCache = true;
export const disableCommentsAsDOMContainers = true;
export const disableDefaultPropsExceptForClasses = true;
export const disableInputAttributeSyncing = false;
export const disableLegacyContext = false;
export const disableLegacyContextForFunctionComponents = false;
export const disableLegacyMode = false;
export const disableSchedulerTimeoutInWorkLoop = false;
export const disableTextareaChildren = false;
export const enableAsyncDebugInfo = false;
export const enableAsyncIterableChildren = false;
export const enableCPUSuspense = true;
export const enableCreateEventHandleAPI = false;
export const enableDO_NOT_USE_disableStrictPassiveEffect = false;
export const enableMoveBefore = true;
export const enableFizzExternalRuntime = true;
export const enableHalt = false;
export const enableInfiniteRenderLoopDetection = false;
export const enableLegacyCache = false;
export const enableLegacyFBSupport = false;
export const enableLegacyHidden = false;
export const enableNoCloningMemoCache = false;
export const enablePostpone = false;
export const enableProfilerCommitHooks = __PROFILE__;
export const enableProfilerNestedUpdatePhase = __PROFILE__;
export const enableProfilerTimer = __PROFILE__;
export const enableReactTestRendererWarning = false;
export const enableRenderableContext = true;
export const enableRetryLaneExpiration = false;
export const enableSchedulingProfiler = __PROFILE__;
export const enableComponentPerformanceTrack = false;
export const enableScopeAPI = false;
export const enableSuspenseAvoidThisFallback = false;
export const enableSuspenseCallback = true;
export const enableTaint = true;
export const enableTransitionTracing = false;
export const enableTrustedTypesIntegration = false;
export const enableUpdaterTracking = __PROFILE__;
export const enableUseEffectEventHook = false;
export const favorSafetyOverHydrationPerf = true;
export const retryLaneExpirationMs = 5000;
export const syncLaneExpirationMs = 250;
export const transitionLaneExpirationMs = 5000;
export const enableHydrationLaneScheduling = true;
export const enableYieldingBeforePassive = false;
export const enableThrottledScheduling = false;
export const enableViewTransition = false;
export const enableSwipeTransition = false;
export const enableScrollEndPolyfill = true;
export const enableFragmentRefs = false;

// Flow magic to verify the exports of this file match the original version.
((((null: any): ExportsType): FeatureFlagsType): ExportsType);
