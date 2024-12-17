/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import typeof * as FeatureFlagsType from 'shared/ReactFeatureFlags';
import typeof * as ExportsType from './ReactFeatureFlags.native-oss';

// TODO: Align these flags with canary and delete this file once RN ships from Canary.

// DEV-only but enabled in the next RN Major.
// Not supported by flag script to avoid the special case.
export const debugRenderPhaseSideEffectsForStrictMode = __DEV__;

// -----------------------------------------------------------------------------
// All other flags
// -----------------------------------------------------------------------------
export const alwaysThrottleRetries = false;
export const disableClientCache = true;
export const disableCommentsAsDOMContainers = true;
export const disableDefaultPropsExceptForClasses = true;
export const disableInputAttributeSyncing = false;
export const disableLegacyContext = true;
export const disableLegacyContextForFunctionComponents = true;
export const disableLegacyMode = false;
export const disableSchedulerTimeoutInWorkLoop = false;
export const disableTextareaChildren = false;
export const enableAsyncDebugInfo = false;
export const enableAsyncIterableChildren = false;
export const enableCPUSuspense = false;
export const enableCreateEventHandleAPI = false;
export const enableDeferRootSchedulingToMicrotask = true;
export const enableDO_NOT_USE_disableStrictPassiveEffect = false;
export const enableFabricCompleteRootInCommitPhase = false;
export const enableMoveBefore = true;
export const enableFizzExternalRuntime = true;
export const enableGetInspectorDataForInstanceInProduction = false;
export const enableHalt = false;
export const enableHiddenSubtreeInsertionEffectCleanup = false;
export const enableInfiniteRenderLoopDetection = false;
export const enableLazyContextPropagation = true;
export const enableLegacyCache = false;
export const enableLegacyFBSupport = false;
export const enableLegacyHidden = false;
export const enableNoCloningMemoCache = false;
export const enableObjectFiber = false;
export const enableOwnerStacks = false;
export const enablePersistedModeClonedFlag = false;
export const enablePostpone = false;
export const enableReactTestRendererWarning = false;
export const enableRenderableContext = true;
export const enableRetryLaneExpiration = false;
export const enableSchedulingProfiler = __PROFILE__;
export const enableComponentPerformanceTrack = false;
export const enableScopeAPI = false;
export const enableServerComponentLogs = true;
export const enableShallowPropDiffing = false;
export const enableSuspenseAvoidThisFallback = false;
export const enableSuspenseCallback = false;
export const enableTaint = true;
export const enableTransitionTracing = false;
export const enableTrustedTypesIntegration = false;
export const enableUseEffectEventHook = false;
export const favorSafetyOverHydrationPerf = true;
export const passChildrenWhenCloningPersistedNodes = false;
export const renameElementSymbol = true;
export const retryLaneExpirationMs = 5000;
export const syncLaneExpirationMs = 250;
export const transitionLaneExpirationMs = 5000;
export const useModernStrictMode = true;
export const enableSiblingPrerendering = true;
export const enableUseResourceEffectHook = false;

export const enableHydrationLaneScheduling = true;

// Profiling Only
export const enableProfilerTimer = __PROFILE__;
export const enableProfilerCommitHooks = __PROFILE__;
export const enableProfilerNestedUpdatePhase = __PROFILE__;
export const enableUpdaterTracking = __PROFILE__;

// Flow magic to verify the exports of this file match the original version.
((((null: any): ExportsType): FeatureFlagsType): ExportsType);
