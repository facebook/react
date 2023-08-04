// Manual extensions to generated types
use crate::{
    JSXElementName, JSXMemberExpression, JSXMemberExpressionOrIdentifier, Pattern, SourceRange,
    SourceType,
};

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

impl JSXElementName {
    pub fn root_name(&self) -> &str {
        match self {
            Self::JSXIdentifier(name) => &name.name,
            Self::JSXMemberExpression(name) => name.root_name(),
            Self::JSXNamespacedName(name) => &name.namespace.name,
        }
    }
}

impl JSXMemberExpression {
    pub fn root_name(&self) -> &str {
        match &self.object {
            JSXMemberExpressionOrIdentifier::JSXMemberExpression(object) => object.root_name(),
            JSXMemberExpressionOrIdentifier::JSXIdentifier(object) => &object.name,
        }
    }
}
