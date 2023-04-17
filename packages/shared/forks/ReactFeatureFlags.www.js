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
  disableInputAttributeSyncing,
  disableIEWorkarounds,
  enableTrustedTypesIntegration,
  revertRemovalOfSiblingPrerendering,
  replayFailedUnitOfWorkWithInvokeGuardedCallback,
  enableLegacyFBSupport,
  enableDebugTracing,
  enableUseRefAccessWarning,
  enableLazyContextPropagation,
  enableSyncDefaultUpdates,
  enableUnifiedSyncLane,
  enableTransitionTracing,
  enableCustomElementPropertySupport,
  enableDeferRootSchedulingToMicrotask,
} = dynamicFeatureFlags;

// On WWW, __EXPERIMENTAL__ is used for a new modern build.
// It's not used anywhere in production yet.

export const debugRenderPhaseSideEffectsForStrictMode = __DEV__;
export const enableProfilerTimer = __PROFILE__;
export const enableProfilerCommitHooks = __PROFILE__;
export const enableProfilerNestedUpdatePhase = __PROFILE__;
export const enableProfilerNestedUpdateScheduledHook: boolean =
  __PROFILE__ && dynamicFeatureFlags.enableProfilerNestedUpdateScheduledHook;
export const enableUpdaterTracking = __PROFILE__;

export const createRootStrictEffectsByDefault = false;
export const enableSuspenseAvoidThisFallback = true;
export const enableSuspenseAvoidThisFallbackFizz = false;

export const disableSchedulerTimeoutInWorkLoop = false;
export const enableCPUSuspense = true;
export const enableFloat = true;
export const enableUseHook = true;
export const enableUseMemoCacheHook = true;
export const enableUseEffectEventHook = true;
export const enableHostSingletons = true;
export const enableClientRenderFallbackOnTextMismatch = false;
export const enableFilterEmptyStringAttributesDOM = true;

// Logs additional User Timing API marks for use with an experimental profiling tool.
export const enableSchedulingProfiler: boolean =
  __PROFILE__ && dynamicFeatureFlags.enableSchedulingProfiler;

// Note: we'll want to remove this when we to userland implementation.
// For now, we'll turn it on for everyone because it's *already* on for everyone in practice.
// At least this will let us stop shipping <Profiler> implementation to all users.
export const enableSchedulerDebugging = true;
export const disableLegacyContext = __EXPERIMENTAL__;
export const enableGetInspectorDataForInstanceInProduction = false;

export const enableCache = true;
export const enableLegacyCache = true;
export const enableCacheElement = true;
export const enableFetchInstrumentation = false;

export const disableJavaScriptURLs = true;

// TODO: www currently relies on this feature. It's disabled in open source.
// Need to remove it.
export const disableCommentsAsDOMContainers = false;

export const disableModulePatternComponents = true;

export const enableCreateEventHandleAPI = true;

export const enableScopeAPI = true;

export const enableSuspenseCallback = true;

export const enableLegacyHidden = true;

export const enableComponentStackLocations = true;

export const disableTextareaChildren = __EXPERIMENTAL__;

export const allowConcurrentByDefault = true;

export const consoleManagedByDevToolsDuringStrictMode = true;
export const enableServerContext = true;

// Some www surfaces are still using this. Remove once they have been migrated.
export const enableUseMutableSource = true;

export const useModernStrictMode = false;
export const enableFizzExternalRuntime = true;

// Flow magic to verify the exports of this file match the original version.
((((null: any): ExportsType): FeatureFlagsType): ExportsType);
