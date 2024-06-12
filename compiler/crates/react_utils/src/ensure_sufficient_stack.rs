/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

pub fn ensure_sufficient_stack<R>(f: impl FnOnce() -> R) -> R {
    f()
}
