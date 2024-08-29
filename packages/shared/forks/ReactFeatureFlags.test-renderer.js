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

export const debugRenderPhaseSideEffectsForStrictMode = false;
export const enableDebugTracing = false;
export const enableAsyncDebugInfo = false;
export const enableSchedulingProfiler = false;
export const enableProfilerTimer = __PROFILE__;
export const enableProfilerCommitHooks = __PROFILE__;
export const enableProfilerNestedUpdatePhase = __PROFILE__;
export const enableUpdaterTracking = false;
export const enableCache = true;
export const enableLegacyCache = __EXPERIMENTAL__;
export const enableBinaryFlight = true;
export const enableFlightReadableStream = true;
export const enableAsyncIterableChildren = false;
export const enableTaint = true;
export const enablePostpone = false;
export const enableHalt = false;
export const disableCommentsAsDOMContainers = true;
export const disableInputAttributeSyncing = false;
export const disableIEWorkarounds = true;
export const enableScopeAPI = false;
export const enableCreateEventHandleAPI = false;
export const enableSuspenseCallback = false;
export const enableTrustedTypesIntegration = false;
export const disableTextareaChildren = false;
export const enableSuspenseAvoidThisFallback = false;
export const enableSuspenseAvoidThisFallbackFizz = false;
export const enableCPUSuspense = false;
export const enableUseMemoCacheHook = true;
export const enableNoCloningMemoCache = false;
export const enableUseEffectEventHook = false;
export const favorSafetyOverHydrationPerf = true;
export const enableComponentStackLocations = true;
export const enableLegacyFBSupport = false;
export const enableFilterEmptyStringAttributesDOM = true;
export const enableGetInspectorDataForInstanceInProduction = false;
export const enableFabricCompleteRootInCommitPhase = false;

export const enableRetryLaneExpiration = false;
export const retryLaneExpirationMs = 5000;
export const syncLaneExpirationMs = 250;
export const transitionLaneExpirationMs = 5000;

export const disableSchedulerTimeoutInWorkLoop = false;
export const enableLazyContextPropagation = __EXPERIMENTAL__;
export const enableContextProfiling = false;
export const enableLegacyHidden = false;

export const consoleManagedByDevToolsDuringStrictMode = false;

export const enableTransitionTracing = false;

export const useModernStrictMode = false;
export const enableDO_NOT_USE_disableStrictPassiveEffect = false;
export const enableFizzExternalRuntime = true;
export const enableDeferRootSchedulingToMicrotask = true;

export const enableAsyncActions = true;

export const alwaysThrottleRetries = true;

export const passChildrenWhenCloningPersistedNodes = false;
export const enablePersistedModeClonedFlag = false;
export const disableClientCache = true;

export const enableServerComponentLogs = true;
export const enableInfiniteRenderLoopDetection = false;
export const enableAddPropertiesFastPath = false;

export const renameElementSymbol = true;
export const enableShallowPropDiffing = false;
export const enableSiblingPrerendering = __EXPERIMENTAL__;

// TODO: This must be in sync with the main ReactFeatureFlags file because
// the Test Renderer's value must be the same as the one used by the
// react package.
//
// We really need to get rid of this whole module. Any test renderer specific
// flags should be handled by the Fiber config.
// const __NEXT_MAJOR__ = __EXPERIMENTAL__;
export const enableRefAsProp = true;
export const disableStringRefs = true;
export const disableLegacyMode = true;
export const disableLegacyContext = true;
export const disableLegacyContextForFunctionComponents = true;
export const enableRenderableContext = true;
export const enableReactTestRendererWarning = true;
export const disableDefaultPropsExceptForClasses = true;

export const enableObjectFiber = false;
export const enableOwnerStacks = false;

// Flow magic to verify the exports of this file match the original version.
((((null: any): ExportsType): FeatureFlagsType): ExportsType);
