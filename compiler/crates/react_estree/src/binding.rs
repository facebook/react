/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Copy, Clone, Debug, PartialEq, Eq, Hash)]
pub enum Binding {
    Global,
    Module(BindingId),
    Local(BindingId),
}

#[derive(Serialize, Deserialize, Copy, Clone, Debug, PartialEq, Eq, Hash)]
pub struct BindingId(u32);

impl BindingId {
    pub fn new(value: u32) -> Self {
        Self(value)
    }
}

impl From<BindingId> for u32 {
    fn from(value: BindingId) -> Self {
        value.0
    }
}
