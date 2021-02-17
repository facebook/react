/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export const enableSchedulerDebugging = false;
export const enableIsInputPending = false;
export const enableProfiling = __PROFILE__;

// TODO: enable to fix https://github.com/facebook/react/issues/20756.
// Once enabled, remove describe.skip() from SchedulerDOMSetImmediate-test.
export const enableSetImmediate = false;
