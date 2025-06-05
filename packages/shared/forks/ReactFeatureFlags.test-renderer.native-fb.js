/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import typeof * as FeatureFlagsType from 'shared/ReactFeatureFlags';
import typeof * as ExportsType from './ReactFeatureFlags.test-renderer';

export const alwaysThrottleRetries = false;
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
export const enableMoveBefore = false;
export const enableFizzExternalRuntime = true;
export const enableHalt = false;
export const enableInfiniteRenderLoopDetection = false;
export const enableHiddenSubtreeInsertionEffectCleanup = true;
export const enableLegacyCache = false;
export const enableLegacyFBSupport = false;
export const enableLegacyHidden = false;
export const enableNoCloningMemoCache = false;
export const enableObjectFiber = false;
export const enablePersistedModeClonedFlag = false;
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
export const enableShallowPropDiffing = false;
export const enableEagerAlternateStateNodeCleanup = true;
export const enableSuspenseAvoidThisFallback = false;
export const enableSuspenseCallback = false;
export const enableTaint = true;
export const enableTransitionTracing = false;
export const enableTrustedTypesIntegration = false;
export const enableUpdaterTracking = false;
export const enableUseEffectEventHook = false;
export const favorSafetyOverHydrationPerf = true;
export const passChildrenWhenCloningPersistedNodes = false;
export const renameElementSymbol = false;
export const retryLaneExpirationMs = 5000;
export const syncLaneExpirationMs = 250;
export const transitionLaneExpirationMs = 5000;
export const enableSiblingPrerendering = true;
export const enableUseEffectCRUDOverload = true;
export const enableHydrationLaneScheduling = true;
export const enableYieldingBeforePassive = false;
export const enableThrottledScheduling = false;
export const enableViewTransition = false;
export const enableSwipeTransition = false;
export const enableFastAddPropertiesInDiffing = false;
export const enableLazyPublicInstanceInFabric = false;
export const enableScrollEndPolyfill = true;
export const enableFragmentRefs = false;
export const ownerStackLimit = 1e4;

// Flow magic to verify the exports of this file match the original version.
((((null: any): ExportsType): FeatureFlagsType): ExportsType);
