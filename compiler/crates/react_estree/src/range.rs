/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

use std::num::NonZeroU32;

use serde::ser::SerializeTuple;
use serde::{Deserialize, Serialize};

#[derive(Deserialize, Copy, Clone, Debug, PartialEq, PartialOrd, Hash)]
pub struct SourceRange {
    pub start: u32,
    pub end: NonZeroU32,
}

// ESTree and Babel store the `range` as `[start, end]`, so we customize
// the serialization to use a tuple representation.
impl Serialize for SourceRange {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let mut tuple = serializer.serialize_tuple(2)?;
        tuple.serialize_element(&self.start)?;
        tuple.serialize_element(&self.end)?;
        tuple.end()
    }
}
