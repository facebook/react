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
export const enableFetchInstrumentation = true;
export const enableBinaryFlight = true;
export const enableTaint = true;
export const enablePostpone = false;
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
export const enableUseEffectEventHook = false;
export const favorSafetyOverHydrationPerf = true;
export const enableComponentStackLocations = true;
export const enableLegacyFBSupport = false;
export const enableFilterEmptyStringAttributesDOM = true;
export const enableGetInspectorDataForInstanceInProduction = false;

export const enableRetryLaneExpiration = false;
export const retryLaneExpirationMs = 5000;
export const syncLaneExpirationMs = 250;
export const transitionLaneExpirationMs = 5000;

export const enableUseRefAccessWarning = false;

export const disableSchedulerTimeoutInWorkLoop = false;
export const enableLazyContextPropagation = false;
export const enableLegacyHidden = false;
export const forceConcurrentByDefaultForTesting = false;
export const enableUnifiedSyncLane = __EXPERIMENTAL__;
export const allowConcurrentByDefault = false;

export const consoleManagedByDevToolsDuringStrictMode = false;

export const enableTransitionTracing = false;

export const useModernStrictMode = false;
export const enableDO_NOT_USE_disableStrictPassiveEffect = false;
export const enableFizzExternalRuntime = true;
export const enableDeferRootSchedulingToMicrotask = true;

export const enableAsyncActions = true;

export const alwaysThrottleRetries = true;

export const passChildrenWhenCloningPersistedNodes = false;
export const enableUseDeferredValueInitialArg = __EXPERIMENTAL__;
export const disableClientCache = true;

export const enableServerComponentKeys = true;
export const enableServerComponentLogs = true;
export const enableInfiniteRenderLoopDetection = false;

// TODO: This must be in sync with the main ReactFeatureFlags file because
// the Test Renderer's value must be the same as the one used by the
// react package.
//
// We really need to get rid of this whole module. Any test renderer specific
// flags should be handled by the Fiber config.
const __NEXT_MAJOR__ = __EXPERIMENTAL__;
export const enableRefAsProp = __NEXT_MAJOR__;
export const disableStringRefs = __NEXT_MAJOR__;
export const enableBigIntSupport = __NEXT_MAJOR__;
export const disableLegacyMode = true;
export const disableLegacyContext = __NEXT_MAJOR__;
export const disableDOMTestUtils = __NEXT_MAJOR__;
export const enableRenderableContext = __NEXT_MAJOR__;
export const enableReactTestRendererWarning = __NEXT_MAJOR__;

// Flow magic to verify the exports of this file match the original version.
((((null: any): ExportsType): FeatureFlagsType): ExportsType);
