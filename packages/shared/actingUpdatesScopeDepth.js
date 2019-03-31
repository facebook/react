/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// in a test-like environment, we want to warn if dispatchAction() is
// called outside of a TestUtils.act(...)/batchedUpdates/render call.
// so we have a a step counter for when we descend/ascend from
// actedUpdates() calls, and test on it for when to warn
export default {_: 0};
