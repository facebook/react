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

// NOTE: There are no flags, currently. Uncomment the stuff below if we add one.
// Re-export dynamic flags from the internal module. Intentionally using *
// because this import is compiled to a `require` call.
import * as dynamicFlags from 'ReactNativeInternalFeatureFlags';

// We destructure each value before re-exporting to avoid a dynamic look-up on
// the exports object every time a flag is read.
export const {enableUseRefAccessWarning, enableDeferRootSchedulingToMicrotask} =
  dynamicFlags;

// The rest of the flags are static for better dead code elimination.
export const enableDebugTracing = false;
export const enableSchedulingProfiler = __PROFILE__;
export const enableProfilerTimer = __PROFILE__;
export const enableProfilerCommitHooks = __PROFILE__;
export const enableProfilerNestedUpdatePhase = __PROFILE__;
export const enableProfilerNestedUpdateScheduledHook = false;
export const enableUpdaterTracking = __PROFILE__;
export const enableCache = false;
export const enableLegacyCache = false;
export const enableCacheElement = true;
export const enableFetchInstrumentation = false;
export const enableSchedulerDebugging = false;
export const debugRenderPhaseSideEffectsForStrictMode = true;
export const disableJavaScriptURLs = false;
export const disableCommentsAsDOMContainers = true;
export const disableInputAttributeSyncing = false;
export const disableIEWorkarounds = true;
export const replayFailedUnitOfWorkWithInvokeGuardedCallback = __DEV__;
export const enableScopeAPI = false;
export const enableCreateEventHandleAPI = false;
export const enableSuspenseCallback = false;
export const disableLegacyContext = false;
export const revertRemovalOfSiblingPrerendering = false;
export const enableTrustedTypesIntegration = false;
export const disableTextareaChildren = false;
export const disableModulePatternComponents = false;
export const enableSuspenseAvoidThisFallback = false;
export const enableSuspenseAvoidThisFallbackFizz = false;
export const enableCPUSuspense = true;
export const enableUseHook = true;
export const enableUseMemoCacheHook = true;
export const enableUseEffectEventHook = false;
export const enableClientRenderFallbackOnTextMismatch = true;
export const enableComponentStackLocations = false;
export const enableLegacyFBSupport = false;
export const enableFilterEmptyStringAttributesDOM = false;
export const enableGetInspectorDataForInstanceInProduction = true;

export const createRootStrictEffectsByDefault = false;

export const disableSchedulerTimeoutInWorkLoop = false;
export const enableLazyContextPropagation = false;
export const enableLegacyHidden = true;
export const enableSyncDefaultUpdates = true;
export const enableUnifiedSyncLane = false;
export const allowConcurrentByDefault = true;
export const enableCustomElementPropertySupport = false;

export const consoleManagedByDevToolsDuringStrictMode = false;
export const enableServerContext = true;

export const enableUseMutableSource = true;

export const enableTransitionTracing = false;

export const enableFloat = true;
export const enableHostSingletons = true;

export const useModernStrictMode = false;
export const enableFizzExternalRuntime = false;

// Flow magic to verify the exports of this file match the original version.
((((null: any): ExportsType): FeatureFlagsType): ExportsType);
