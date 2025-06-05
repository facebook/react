/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import typeof * as FeatureFlagsType from 'shared/ReactFeatureFlags';
import typeof * as ExportsType from './ReactFeatureFlags.test-renderer.www';

export const enableAsyncDebugInfo = false;
export const enableSchedulingProfiler = false;
export const enableProfilerTimer = __PROFILE__;
export const enableProfilerCommitHooks = __PROFILE__;
export const enableProfilerNestedUpdatePhase = __PROFILE__;
export const enableComponentPerformanceTrack = false;
export const enableUpdaterTracking = false;
export const enableLegacyCache = true;
export const enableAsyncIterableChildren = false;
export const enableTaint = true;
export const enablePostpone = false;
export const enableHalt = false;
export const disableCommentsAsDOMContainers = true;
export const disableInputAttributeSyncing = false;
export const enableScopeAPI = true;
export const enableCreateEventHandleAPI = false;
export const enableSuspenseCallback = true;
export const disableLegacyContext = false;
export const disableLegacyContextForFunctionComponents = false;
export const enableTrustedTypesIntegration = false;
export const disableTextareaChildren = false;
export const enableSuspenseAvoidThisFallback = true;
export const enableCPUSuspense = false;
export const enableNoCloningMemoCache = false;
export const enableUseEffectEventHook = false;
export const favorSafetyOverHydrationPerf = true;
export const enableLegacyFBSupport = false;
export const enableMoveBefore = false;
export const enableRenderableContext = false;
export const enableHiddenSubtreeInsertionEffectCleanup = true;

export const enableRetryLaneExpiration = false;
export const retryLaneExpirationMs = 5000;
export const syncLaneExpirationMs = 250;
export const transitionLaneExpirationMs = 5000;

export const disableSchedulerTimeoutInWorkLoop = false;
export const enableLegacyHidden = false;

export const enableTransitionTracing = false;

export const enableDO_NOT_USE_disableStrictPassiveEffect = false;
export const enableFizzExternalRuntime = false;

export const alwaysThrottleRetries = true;

export const passChildrenWhenCloningPersistedNodes = false;
export const enablePersistedModeClonedFlag = false;
export const disableClientCache = true;

export const enableInfiniteRenderLoopDetection = false;

export const enableReactTestRendererWarning = false;
export const disableLegacyMode = true;

export const disableDefaultPropsExceptForClasses = true;

export const renameElementSymbol = false;

export const enableObjectFiber = false;
export const enableShallowPropDiffing = false;
export const enableSiblingPrerendering = true;

export const enableUseEffectCRUDOverload = false;
export const enableEagerAlternateStateNodeCleanup = true;

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
