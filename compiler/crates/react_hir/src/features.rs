/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

use serde::{Deserialize, Serialize};

/// Describes the feature flags available to control compilation and validation.
/// This type is serializable in order to support parsing from config files or
/// serialized values when invoked from other languages.
#[derive(Serialize, Deserialize, Debug)]
pub struct Features {
    /// Validate that mutable lambdas are not passed where a frozen value is expected,
    /// since mutable lambdas cannot be frozen. The only mutation allowed inside a
    /// frozen lambda is of ref values.
    pub validate_frozen_lambdas: bool,
}
