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
  debugRenderPhaseSideEffectsForStrictMode,
  disableInputAttributeSyncing,
  enableTrustedTypesIntegration,
  disableSchedulerTimeoutBasedOnReactExpirationTime,
  warnAboutSpreadingKeyToJSX,
  replayFailedUnitOfWorkWithInvokeGuardedCallback,
  enableFilterEmptyStringAttributesDOM,
  enableLegacyFBSupport,
  deferRenderPhaseUpdateToNextBatch,
  decoupleUpdatePriorityFromScheduler,
  enableDebugTracing,
  skipUnmountedBoundaries,
  enableEagerRootListeners,
  enableDoubleInvokingEffects,
} = dynamicFeatureFlags;

// On WWW, __EXPERIMENTAL__ is used for a new modern build.
// It's not used anywhere in production yet.

export const enableProfilerTimer = __PROFILE__;
export const enableProfilerCommitHooks = __PROFILE__;

// Logs additional User Timing API marks for use with an experimental profiling tool.
export const enableSchedulingProfiler = __PROFILE__;

// Note: we'll want to remove this when we to userland implementation.
// For now, we'll turn it on for everyone because it's *already* on for everyone in practice.
// At least this will let us stop shipping <Profiler> implementation to all users.
export const enableSchedulerTracing = true;
export const enableSchedulerDebugging = true;

export const warnAboutDeprecatedLifecycles = true;
export const disableLegacyContext = __EXPERIMENTAL__;
export const warnAboutStringRefs = false;
export const warnAboutDefaultPropsOnFunctionComponents = false;

export const enableSuspenseServerRenderer = true;
export const enableSelectiveHydration = true;

export const enableBlocksAPI = true;
export const enableLazyElements = true;

export const disableJavaScriptURLs = true;

export const disableModulePatternComponents = true;

export const enableCreateEventHandleAPI = true;

export const enableFundamentalAPI = false;

export const enableScopeAPI = true;

export const warnAboutUnmockedScheduler = true;

export const enableSuspenseCallback = true;

export const enableComponentStackLocations = true;

export const disableTextareaChildren = __EXPERIMENTAL__;

export const warnUnstableRenderSubtreeIntoContainer = false;

export const enableDiscreteEventFlushingChange = true;

// Enable forked reconciler. Piggy-backing on the "variant" global so that we
// don't have to add another test dimension. The build system will compile this
// to the correct value.
export const enableNewReconciler = __VARIANT__;

// Flow magic to verify the exports of this file match the original version.
// eslint-disable-next-line no-unused-vars
type Check<_X, Y: _X, X: Y = _X> = null;
// eslint-disable-next-line no-unused-expressions
(null: Check<ExportsType, FeatureFlagsType>);
