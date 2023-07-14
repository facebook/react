use std::num::NonZeroU32;

use serde::{Deserialize, Serialize};

#[derive(
    Serialize,
    Deserialize,
    Copy,
    Clone,
    Debug,
    PartialEq,
    PartialOrd,
    Hash
)]
pub struct SourceRange {
    pub start: u32,
    pub end: NonZeroU32,
}
