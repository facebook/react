use std::num::NonZeroU32;

use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct SourceRange {
    pub start: u32,
    pub end: NonZeroU32,
}
