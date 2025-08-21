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

export const enableAsyncDebugInfo: boolean = false;
export const enableSchedulingProfiler: boolean = false;
export const enableProfilerTimer: boolean = __PROFILE__;
export const enableProfilerCommitHooks: boolean = __PROFILE__;
export const enableProfilerNestedUpdatePhase: boolean = __PROFILE__;
export const enableComponentPerformanceTrack: boolean = false;
export const enableUpdaterTracking: boolean = false;
export const enableLegacyCache: boolean = __EXPERIMENTAL__;
export const enableAsyncIterableChildren: boolean = false;
export const enableTaint: boolean = true;
export const enablePostpone: boolean = false;
export const enableHalt: boolean = false;
export const disableCommentsAsDOMContainers: boolean = true;
export const disableInputAttributeSyncing: boolean = false;
export const enableScopeAPI: boolean = false;
export const enableCreateEventHandleAPI: boolean = false;
export const enableSuspenseCallback: boolean = false;
export const enableTrustedTypesIntegration: boolean = false;
export const disableTextareaChildren: boolean = false;
export const enableSuspenseAvoidThisFallback: boolean = false;
export const enableCPUSuspense: boolean = false;
export const enableNoCloningMemoCache: boolean = false;
export const enableUseEffectEventHook: boolean = false;
export const enableLegacyFBSupport: boolean = false;
export const enableMoveBefore: boolean = false;
export const enableHiddenSubtreeInsertionEffectCleanup: boolean = false;
export const enableHydrationLaneScheduling: boolean = true;

export const enableRetryLaneExpiration: boolean = false;
export const retryLaneExpirationMs = 5000;
export const syncLaneExpirationMs = 250;
export const transitionLaneExpirationMs = 5000;

export const disableSchedulerTimeoutInWorkLoop: boolean = false;
export const enableLegacyHidden: boolean = false;

export const enableTransitionTracing: boolean = false;

export const enableFizzExternalRuntime: boolean = true;

export const alwaysThrottleRetries: boolean = true;

export const passChildrenWhenCloningPersistedNodes: boolean = false;
export const enablePersistedModeClonedFlag: boolean = false;
export const disableClientCache: boolean = true;

export const enableInfiniteRenderLoopDetection: boolean = false;

export const renameElementSymbol: boolean = true;
export const enableEagerAlternateStateNodeCleanup: boolean = true;

export const enableYieldingBeforePassive: boolean = true;

export const enableThrottledScheduling: boolean = false;
export const enableViewTransition: boolean = false;
export const enableGestureTransition: boolean = false;
export const enableScrollEndPolyfill: boolean = true;
export const enableSuspenseyImages: boolean = false;
export const enableFizzBlockingRender: boolean = true;
export const enableSrcObject: boolean = false;
export const enableHydrationChangeEvent: boolean = false;
export const enableDefaultTransitionIndicator: boolean = false;
export const ownerStackLimit = 1e4;

export const enableFragmentRefs: boolean = false;

// TODO: This must be in sync with the main ReactFeatureFlags file because
// the Test Renderer's value must be the same as the one used by the
// react package.
//
// We really need to get rid of this whole module. Any test renderer specific
// flags should be handled by the Fiber config.
// const __NEXT_MAJOR__ = __EXPERIMENTAL__;
export const disableLegacyMode: boolean = true;
export const disableLegacyContext: boolean = true;
export const disableLegacyContextForFunctionComponents: boolean = true;
export const enableReactTestRendererWarning: boolean = true;

export const enableObjectFiber: boolean = false;

// Flow magic to verify the exports of this file match the original version.
((((null: any): ExportsType): FeatureFlagsType): ExportsType);
