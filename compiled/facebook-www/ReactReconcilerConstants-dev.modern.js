/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 * @nolint
 * @preventMunge
 * @preserve-invariant-messages
 */

"use strict";
__DEV__ &&
  (require("warning"),
  require("ReactFeatureFlags"),
  (exports.ConcurrentRoot = 1),
  (exports.ContinuousEventPriority = 8),
  (exports.DefaultEventPriority = 32),
  (exports.DiscreteEventPriority = 2),
  (exports.IdleEventPriority = 268435456),
  (exports.LegacyRoot = 0),
  (exports.NoEventPriority = 0));
