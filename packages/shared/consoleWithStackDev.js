/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// We expect that our Rollup, Jest, and Flow configurations
// always shim this module with the corresponding environment
// (either rn or www).
//
// We should never resolve to this file, but it exists to make
// sure that if we *do* accidentally break the configuration,
// the failure isn't silent.

export function setSuppressWarning() {
  // TODO: Delete this and error when even importing this module.
}
