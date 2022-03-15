/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import typeof * as FeatureFlagsType from 'shared/ReactFeatureFlags';
import typeof * as ExportsType from './ReactFeatureFlags.testing.www';

export const debugRenderPhaseSideEffectsForStrictMode = false;
export const enableDebugTracing = false;
export const enableSchedulingProfiler = false;
export const warnAboutDeprecatedLifecycles = true;
export const replayFailedUnitOfWorkWithInvokeGuardedCallback = false;
export const enableProfilerTimer = false;
export const enableProfilerCommitHooks = false;
export const enableProfilerNestedUpdatePhase = false;
export const enableProfilerNestedUpdateScheduledHook = false;
export const enableUpdaterTracking = false;
export const enableSuspenseServerRenderer = true;
export const enableSelectiveHydration = true;
export const enableLazyElements = false;
export const enableCache = true;
export const disableJavaScriptURLs = true;
export const disableCommentsAsDOMContainers = true;
export const disableInputAttributeSyncing = false;
export const enableSchedulerDebugging = false;
export const enableScopeAPI = true;
export const enableCreateEventHandleAPI = true;
export const enableSuspenseCallback = true;
export const warnAboutDefaultPropsOnFunctionComponents = false;
export const warnAboutStringRefs = false;
export const disableLegacyContext = __EXPERIMENTAL__;
export const disableSchedulerTimeoutBasedOnReactExpirationTime = false;
export const enableTrustedTypesIntegration = false;
export const disableTextareaChildren = __EXPERIMENTAL__;
export const disableModulePatternComponents = true;
export const warnAboutSpreadingKeyToJSX = false;
export const enableSuspenseAvoidThisFallback = true;
export const enableSuspenseAvoidThisFallbackFizz = false;
export const enableCPUSuspense = true;
export const enableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay = true;
export const enableClientRenderFallbackOnHydrationMismatch = true;
export const enableClientRenderFallbackOnTextMismatch = true;
export const enableComponentStackLocations = true;
export const enableLegacyFBSupport = !__EXPERIMENTAL__;
export const enableFilterEmptyStringAttributesDOM = false;
export const disableNativeComponentFrames = false;
export const skipUnmountedBoundaries = true;
export const deletedTreeCleanUpLevel = 3;
export const enableSuspenseLayoutEffectSemantics = false;
export const enableGetInspectorDataForInstanceInProduction = false;
export const enableNewReconciler = false;
export const deferRenderPhaseUpdateToNextBatch = false;

export const enableStrictEffects = false;
export const createRootStrictEffectsByDefault = false;
export const enableUseRefAccessWarning = false;

export const disableSchedulerTimeoutInWorkLoop = false;
export const enableLazyContextPropagation = false;
export const enableLegacyHidden = false;
export const enableSyncDefaultUpdates = true;
export const allowConcurrentByDefault = true;
export const enablePersistentOffscreenHostContainer = false;
export const enableCustomElementPropertySupport = false;

export const consoleManagedByDevToolsDuringStrictMode = false;
export const enableServerContext = false;
// Some www surfaces are still using this. Remove once they have been migrated.
export const enableUseMutableSource = true;

export const enableTransitionTracing = false;

// Flow magic to verify the exports of this file match the original version.
// eslint-disable-next-line no-unused-vars
type Check<_X, Y: _X, X: Y = _X> = null;
// eslint-disable-next-line no-unused-expressions
(null: Check<ExportsType, FeatureFlagsType>);
