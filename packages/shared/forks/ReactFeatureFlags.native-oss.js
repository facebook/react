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

// -----------------------------------------------------------------------------
// TODO for next React Native major.
//
// Alias __TODO_NEXT_RN_MAJOR__ to false for easier skimming.
// -----------------------------------------------------------------------------
const __TODO_NEXT_RN_MAJOR__ = false;
export const enableRefAsProp = __TODO_NEXT_RN_MAJOR__;
export const disableStringRefs = __TODO_NEXT_RN_MAJOR__;
export const disableLegacyMode = __TODO_NEXT_RN_MAJOR__;
export const disableDOMTestUtils = __TODO_NEXT_RN_MAJOR__;
export const enableBigIntSupport = __TODO_NEXT_RN_MAJOR__;
export const useModernStrictMode = __TODO_NEXT_RN_MAJOR__;
export const enableReactTestRendererWarning = __TODO_NEXT_RN_MAJOR__;
export const enableAsyncActions = __TODO_NEXT_RN_MAJOR__;
export const consoleManagedByDevToolsDuringStrictMode = __TODO_NEXT_RN_MAJOR__;
export const enableDeferRootSchedulingToMicrotask = __TODO_NEXT_RN_MAJOR__;
export const alwaysThrottleRetries = __TODO_NEXT_RN_MAJOR__;
export const enableInfiniteRenderLoopDetection = __TODO_NEXT_RN_MAJOR__;
export const enableComponentStackLocations = __TODO_NEXT_RN_MAJOR__;

// -----------------------------------------------------------------------------
// These are ready to flip after the next React npm release (or RN switches to
// Canary, but can't flip before then because of react/renderer mismatches.
// -----------------------------------------------------------------------------
export const enableCache = __TODO_NEXT_RN_MAJOR__;
export const enableRenderableContext = __TODO_NEXT_RN_MAJOR__;

// -----------------------------------------------------------------------------
// Already enabled for next React Native major.
// Hardcode these to true after the next RN major.
//
// Alias __NEXT_RN_MAJOR__ to true for easier skimming.
// -----------------------------------------------------------------------------
const __NEXT_RN_MAJOR__ = true;
export const disableClientCache = __NEXT_RN_MAJOR__;
export const disableLegacyContext = __NEXT_RN_MAJOR__;
export const enableTaint = __NEXT_RN_MAJOR__;
export const enableUnifiedSyncLane = __NEXT_RN_MAJOR__;
export const enableFizzExternalRuntime = __NEXT_RN_MAJOR__; // DOM-only
export const enableBinaryFlight = __NEXT_RN_MAJOR__; // DOM-only
export const enableServerComponentKeys = __NEXT_RN_MAJOR__;
export const enableServerComponentLogs = __NEXT_RN_MAJOR__;

// DEV-only but enabled in the next RN Major.
// Not supported by flag script to avoid the special case.
export const debugRenderPhaseSideEffectsForStrictMode = __DEV__;

// TODO: decide on React 19
export const enableUseMemoCacheHook = false;
export const enableUseDeferredValueInitialArg = __EXPERIMENTAL__;

// -----------------------------------------------------------------------------
// All other flags
// -----------------------------------------------------------------------------
export const enableCPUSuspense = false;
export const enableDebugTracing = false;
export const enableAsyncDebugInfo = false;
export const enableSchedulingProfiler = __PROFILE__;
export const enableLegacyCache = false;
export const enableFetchInstrumentation = false;
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
export const enableUseEffectEventHook = false;
export const favorSafetyOverHydrationPerf = true;
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
export const allowConcurrentByDefault = false;
export const enableTransitionTracing = false;
export const enableDO_NOT_USE_disableStrictPassiveEffect = false;
export const passChildrenWhenCloningPersistedNodes = false;

// Profiling Only
export const enableProfilerTimer = __PROFILE__;
export const enableProfilerCommitHooks = __PROFILE__;
export const enableProfilerNestedUpdatePhase = __PROFILE__;
export const enableUpdaterTracking = __PROFILE__;

// Flow magic to verify the exports of this file match the original version.
((((null: any): ExportsType): FeatureFlagsType): ExportsType);
