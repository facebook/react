/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Manual extensions to generated types
use crate::{
    ArrowFunctionExpression, Class, ClassDeclaration, ClassExpression, Function,
    FunctionDeclaration, FunctionExpression, ImportDeclarationSpecifier, JSXElementName,
    JSXMemberExpression, JSXMemberExpressionOrIdentifier, Pattern, SourceRange, SourceType,
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

impl ImportDeclarationSpecifier {
    pub fn range(&self) -> Option<SourceRange> {
        match self {
            Self::ImportDefaultSpecifier(specifier) => specifier.range,
            Self::ImportNamespaceSpecifier(specifier) => specifier.range,
            Self::ImportSpecifier(specifier) => specifier.range,
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

pub trait IntoFunction: ESTreeNode {
    fn function(&self) -> &Function;

    fn into_function(self) -> Function;
}

impl IntoFunction for FunctionDeclaration {
    fn function(&self) -> &Function {
        &self.function
    }

    fn into_function(self) -> Function {
        self.function
    }
}

impl IntoFunction for FunctionExpression {
    fn function(&self) -> &Function {
        &self.function
    }

    fn into_function(self) -> Function {
        self.function
    }
}

impl IntoFunction for ArrowFunctionExpression {
    fn function(&self) -> &Function {
        &self.function
    }

    fn into_function(self) -> Function {
        self.function
    }
}

impl ESTreeNode for Function {}

impl IntoFunction for Function {
    fn function(&self) -> &Function {
        self
    }

    fn into_function(self) -> Function {
        self
    }
}

pub trait IntoClass: ESTreeNode {
    fn class(&self) -> &Class;

    fn into_class(self) -> Class;
}

impl IntoClass for ClassDeclaration {
    fn class(&self) -> &Class {
        &self.class
    }

    fn into_class(self) -> Class {
        self.class
    }
}

impl IntoClass for ClassExpression {
    fn class(&self) -> &Class {
        &self.class
    }

    fn into_class(self) -> Class {
        self.class
    }
}

impl ESTreeNode for Class {}

impl IntoClass for Class {
    fn class(&self) -> &Class {
        self
    }

    fn into_class(self) -> Class {
        self
    }
}
