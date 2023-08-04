// Manual extensions to generated types
use crate::{Pattern, SourceRange, SourceType};

/// Sentinel trait to distinguish AST *node* types
pub trait ESTreeNode {}

impl Default for SourceType {
    fn default() -> Self {
        Self::Module
    }
}

impl Pattern {
    pub fn range(&self) -> Option<SourceRange> {
        match self {
            Self::ArrayPattern(pattern) => pattern.range,
            Self::AssignmentPattern(pattern) => pattern.range,
            Self::Identifier(pattern) => pattern.range,
            Self::ObjectPattern(pattern) => pattern.range,
            Self::RestElement(pattern) => pattern.range,
        }
    }
}
