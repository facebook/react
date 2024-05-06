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

'use strict';

if (__DEV__) {
  (function() {
'use strict';

// This refers to a WWW module.
require('warning');

// Re-export dynamic flags from the www version.
require('ReactFeatureFlags');

var NoLane =
/*                          */
0;
var SyncLane =
/*                        */
2;
var InputContinuousLane =
/*             */
8;
var DefaultLane =
/*                     */
32;
var IdleLane =
/*                        */
268435456;

var NoEventPriority = NoLane;
var DiscreteEventPriority = SyncLane;
var ContinuousEventPriority = InputContinuousLane;
var DefaultEventPriority = DefaultLane;
var IdleEventPriority = IdleLane;

var LegacyRoot = 0;
var ConcurrentRoot = 1;

exports.ConcurrentRoot = ConcurrentRoot;
exports.ContinuousEventPriority = ContinuousEventPriority;
exports.DefaultEventPriority = DefaultEventPriority;
exports.DiscreteEventPriority = DiscreteEventPriority;
exports.IdleEventPriority = IdleEventPriority;
exports.LegacyRoot = LegacyRoot;
exports.NoEventPriority = NoEventPriority;
  })();
}
