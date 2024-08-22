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
import typeof * as DynamicExportsType from './ReactFeatureFlags.native-fb-dynamic';

// Re-export dynamic flags from the internal module.
// Intentionally using * because this import is compiled to a `require` call.
import * as dynamicFlagsUntyped from 'ReactNativeInternalFeatureFlags';
const dynamicFlags: DynamicExportsType = (dynamicFlagsUntyped: any);

// We destructure each value before re-exporting to avoid a dynamic look-up on
// the exports object every time a flag is read.
export const {
  alwaysThrottleRetries,
  enableAddPropertiesFastPath,
  enableFabricCompleteRootInCommitPhase,
  enableObjectFiber,
  enablePersistedModeClonedFlag,
  enableShallowPropDiffing,
  passChildrenWhenCloningPersistedNodes,
  enableLazyContextPropagation,
  enableSiblingPrerendering,
} = dynamicFlags;

// The rest of the flags are static for better dead code elimination.
export const consoleManagedByDevToolsDuringStrictMode = true;
export const debugRenderPhaseSideEffectsForStrictMode = __DEV__;
export const disableClientCache = true;
export const disableCommentsAsDOMContainers = true;
export const disableDefaultPropsExceptForClasses = true;
export const disableIEWorkarounds = true;
export const disableInputAttributeSyncing = false;
export const disableLegacyContext = false;
export const disableLegacyContextForFunctionComponents = false;
export const disableLegacyMode = false;
export const disableSchedulerTimeoutInWorkLoop = false;
export const disableStringRefs = true;
export const disableTextareaChildren = false;
export const enableAsyncActions = true;
export const enableAsyncDebugInfo = false;
export const enableAsyncIterableChildren = false;
export const enableBinaryFlight = true;
export const enableCache = true;
export const enableComponentStackLocations = true;
export const enableCPUSuspense = true;
export const enableCreateEventHandleAPI = false;
export const enableDebugTracing = false;
export const enableDeferRootSchedulingToMicrotask = true;
export const enableDO_NOT_USE_disableStrictPassiveEffect = false;
export const enableFilterEmptyStringAttributesDOM = true;
export const enableFizzExternalRuntime = true;
export const enableFlightReadableStream = true;
export const enableGetInspectorDataForInstanceInProduction = true;
export const enableHalt = false;
export const enableInfiniteRenderLoopDetection = true;
export const enableContextProfiling = false;
export const enableLegacyCache = false;
export const enableLegacyFBSupport = false;
export const enableLegacyHidden = false;
export const enableNoCloningMemoCache = false;
export const enableOwnerStacks = false;
export const enablePostpone = false;
export const enableProfilerCommitHooks = __PROFILE__;
export const enableProfilerNestedUpdatePhase = __PROFILE__;
export const enableProfilerTimer = __PROFILE__;
export const enableReactTestRendererWarning = false;
export const enableRefAsProp = true;
export const enableRenderableContext = true;
export const enableRetryLaneExpiration = false;
export const enableSchedulingProfiler = __PROFILE__;
export const enableScopeAPI = false;
export const enableServerComponentLogs = true;
export const enableSuspenseAvoidThisFallback = false;
export const enableSuspenseAvoidThisFallbackFizz = false;
export const enableSuspenseCallback = false;
export const enableTaint = true;
export const enableTransitionTracing = false;
export const enableTrustedTypesIntegration = false;
export const enableUpdaterTracking = __PROFILE__;
export const enableUseEffectEventHook = false;
export const enableUseMemoCacheHook = true;
export const favorSafetyOverHydrationPerf = true;
export const renameElementSymbol = false;
export const retryLaneExpirationMs = 5000;
export const syncLaneExpirationMs = 250;
export const transitionLaneExpirationMs = 5000;
export const useModernStrictMode = true;

// Flow magic to verify the exports of this file match the original version.
((((null: any): ExportsType): FeatureFlagsType): ExportsType);
