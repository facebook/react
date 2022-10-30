/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This is only used by bundle tests so they can *read* the default feature flags.
// It lets us determine whether we're running in Fire mode without making tests internal.
const ReactFeatureFlags = require('../ReactFeatureFlags');
// Forbid writes because this wouldn't work with bundle tests.
module.exports = Object.freeze({...ReactFeatureFlags});
