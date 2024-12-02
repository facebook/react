/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

mod diagnostic;

pub use diagnostic::*;

/// Returns Ok(()) if the condition is true, otherwise returns Err()
/// with the diagnostic produced by the provided callback
pub fn invariant<F>(cond: bool, f: F) -> Result<(), Diagnostic>
where
    F: Fn() -> Diagnostic,
{
    if cond { Ok(()) } else { Err(f()) }
}
