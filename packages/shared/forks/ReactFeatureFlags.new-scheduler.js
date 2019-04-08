/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 */

export const enableUserTimingAPI = __DEV__;
export const debugRenderPhaseSideEffects = false;
export const debugRenderPhaseSideEffectsForStrictMode = __DEV__;
export const replayFailedUnitOfWorkWithInvokeGuardedCallback = __DEV__;
export const warnAboutDeprecatedLifecycles = true;
export const enableProfilerTimer = __PROFILE__;
export const enableSchedulerTracing = __PROFILE__;
export const enableSuspenseServerRenderer = false; // TODO: __DEV__? Here it might just be false.
export const enableSchedulerDebugging = false;
export function addUserTimingListener() {
  throw new Error('Not implemented.');
}
export const disableJavaScriptURLs = false;
export const disableYielding = false;
export const disableInputAttributeSyncing = false;
export const enableStableConcurrentModeAPIs = false;
export const warnAboutShorthandPropertyCollision = false;
export const warnAboutDeprecatedSetNativeProps = false;
export const enableEventAPI = false;
export const enableJSXTransformAPI = false;

export const enableNewScheduler = true;
