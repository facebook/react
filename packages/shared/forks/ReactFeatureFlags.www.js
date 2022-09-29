/**
 * Copyright (c) Facebook, Inc. and its affiliates.
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
  enableTrustedTypesIntegration,
  disableSchedulerTimeoutBasedOnReactExpirationTime,
  warnAboutSpreadingKeyToJSX,
  replayFailedUnitOfWorkWithInvokeGuardedCallback,
  enableFilterEmptyStringAttributesDOM,
  enableLegacyFBSupport,
  deferRenderPhaseUpdateToNextBatch,
  enableDebugTracing,
  skipUnmountedBoundaries,
  createRootStrictEffectsByDefault,
  enableUseRefAccessWarning,
  disableNativeComponentFrames,
  disableSchedulerTimeoutInWorkLoop,
  enableLazyContextPropagation,
  enableSyncDefaultUpdates,
  enableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay,
  enableClientRenderFallbackOnTextMismatch,
  enableTransitionTracing,
} = dynamicFeatureFlags;

// On WWW, __EXPERIMENTAL__ is used for a new modern build.
// It's not used anywhere in production yet.

export const enableStrictEffects: boolean =
  __DEV__ && dynamicFeatureFlags.enableStrictEffects;
export const debugRenderPhaseSideEffectsForStrictMode = __DEV__;
export const enableProfilerTimer = __PROFILE__;
export const enableProfilerCommitHooks = __PROFILE__;
export const enableProfilerNestedUpdatePhase = __PROFILE__;
export const enableProfilerNestedUpdateScheduledHook: boolean =
  __PROFILE__ && dynamicFeatureFlags.enableProfilerNestedUpdateScheduledHook;
export const enableUpdaterTracking = __PROFILE__;

export const enableSuspenseAvoidThisFallback = true;
export const enableSuspenseAvoidThisFallbackFizz = false;
export const enableCPUSuspense = true;
export const enableFloat = false;
export const enableUseHook = true;
export const enableUseMemoCacheHook = true;
export const enableUseEventHook = true;

// Logs additional User Timing API marks for use with an experimental profiling tool.
export const enableSchedulingProfiler: boolean =
  __PROFILE__ && dynamicFeatureFlags.enableSchedulingProfiler;

// Note: we'll want to remove this when we to userland implementation.
// For now, we'll turn it on for everyone because it's *already* on for everyone in practice.
// At least this will let us stop shipping <Profiler> implementation to all users.
export const enableSchedulerDebugging = true;
export const warnAboutDeprecatedLifecycles = true;
export const disableLegacyContext = __EXPERIMENTAL__;
export const warnAboutStringRefs = false;
export const warnAboutDefaultPropsOnFunctionComponents = false;
export const enableGetInspectorDataForInstanceInProduction = false;

export const enableCache = true;
export const enableCacheElement = true;

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

// Enable forked reconciler. Piggy-backing on the "variant" global so that we
// don't have to add another test dimension. The build system will compile this
// to the correct value.
export const enableNewReconciler = __VARIANT__;

export const allowConcurrentByDefault = true;

export const deletedTreeCleanUpLevel = 3;

export const consoleManagedByDevToolsDuringStrictMode = true;
export const enableServerContext = true;

// Some www surfaces are still using this. Remove once they have been migrated.
export const enableUseMutableSource = true;

export const enableCustomElementPropertySupport = __EXPERIMENTAL__;

// Flow magic to verify the exports of this file match the original version.
// eslint-disable-next-line no-unused-vars
type Check<_X, Y: _X, X: Y = _X> = null;
// eslint-disable-next-line no-unused-expressions
(null: Check<ExportsType, FeatureFlagsType>);
