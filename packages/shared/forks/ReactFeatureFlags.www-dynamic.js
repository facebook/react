/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 */

// In www, these flags are controlled by GKs. Because most GKs have some
// population running in either mode, we should run our tests that way, too,
//
// Use __VARIANT__ to simulate a GK. The tests will be run twice: once
// with the __VARIANT__ set to `true`, and once set to `false`.

export const warnAboutSpreadingKeyToJSX = __VARIANT__;
export const disableModulePatternComponents = __VARIANT__;
export const disableInputAttributeSyncing = __VARIANT__;

// These are already tested in both modes using the build type dimension,
// so we don't need to use __VARIANT__ to get extra coverage.
export const debugRenderPhaseSideEffectsForStrictMode = __DEV__;
export const replayFailedUnitOfWorkWithInvokeGuardedCallback = __DEV__;

// TODO: These flags are hard-coded to the default values used in open source.
// Update the tests so that they pass in either mode, then set these
// to __VARIANT__.
export const enableTrustedTypesIntegration = false;
export const disableSchedulerTimeoutBasedOnReactExpirationTime = false;
export const enableModernEventSystem = false;
