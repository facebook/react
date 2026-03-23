// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

use oxc_ast::ast::{
    AssignmentTarget, Function, Program, VariableDeclarator,
};
use oxc_ast_visit::Visit;

/// Checks if a program contains React-like functions (components or hooks).
///
/// A React-like function is one whose name:
/// - Starts with an uppercase letter (component convention)
/// - Matches the pattern `use[A-Z0-9]` (hook convention)
pub fn has_react_like_functions(program: &Program) -> bool {
    let mut visitor = ReactLikeVisitor {
        found: false,
        current_name: None,
    };
    visitor.visit_program(program);
    visitor.found
}

/// Returns true if the name follows React naming conventions (component or hook).
fn is_react_like_name(name: &str) -> bool {
    if name.is_empty() {
        return false;
    }

    let first_char = name.as_bytes()[0];
    if first_char.is_ascii_uppercase() {
        return true;
    }

    // Check if matches use[A-Z0-9] pattern (hook)
    if name.len() >= 4 && name.starts_with("use") {
        let fourth = name.as_bytes()[3];
        if fourth.is_ascii_uppercase() || fourth.is_ascii_digit() {
            return true;
        }
    }

    false
}

struct ReactLikeVisitor {
    found: bool,
    current_name: Option<String>,
}

impl<'a> Visit<'a> for ReactLikeVisitor {
    fn visit_variable_declarator(&mut self, decl: &VariableDeclarator<'a>) {
        if self.found {
            return;
        }

        // Extract name from the binding identifier
        let name = match &decl.id {
            oxc_ast::ast::BindingPattern::BindingIdentifier(ident) => {
                Some(ident.name.to_string())
            }
            _ => None,
        };

        let prev_name = self.current_name.take();
        self.current_name = name;

        // Visit the initializer with the name in scope
        if let Some(init) = &decl.init {
            self.visit_expression(init);
        }

        self.current_name = prev_name;
    }

    fn visit_assignment_expression(
        &mut self,
        expr: &oxc_ast::ast::AssignmentExpression<'a>,
    ) {
        if self.found {
            return;
        }

        let name = match &expr.left {
            AssignmentTarget::AssignmentTargetIdentifier(ident) => {
                Some(ident.name.to_string())
            }
            _ => None,
        };

        let prev_name = self.current_name.take();
        self.current_name = name;

        self.visit_expression(&expr.right);

        self.current_name = prev_name;
    }

    fn visit_function(&mut self, func: &Function<'a>, _flags: oxc_semantic::ScopeFlags) {
        if self.found {
            return;
        }

        // Check explicit function name
        if let Some(id) = &func.id {
            if is_react_like_name(&id.name) {
                self.found = true;
                return;
            }
        }

        // Check inferred name from parent context
        if func.id.is_none() {
            if let Some(name) = &self.current_name {
                if is_react_like_name(name) {
                    self.found = true;
                    return;
                }
            }
        }

        // Don't traverse into the function body
    }

    fn visit_arrow_function_expression(
        &mut self,
        _expr: &oxc_ast::ast::ArrowFunctionExpression<'a>,
    ) {
        if self.found {
            return;
        }

        if let Some(name) = &self.current_name {
            if is_react_like_name(name) {
                self.found = true;
                return;
            }
        }

        // Don't traverse into the function body
    }

    fn visit_class(&mut self, _class: &oxc_ast::ast::Class<'a>) {
        // Skip class bodies entirely
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_is_react_like_name() {
        assert!(is_react_like_name("Component"));
        assert!(is_react_like_name("MyComponent"));
        assert!(is_react_like_name("A"));
        assert!(is_react_like_name("useState"));
        assert!(is_react_like_name("useEffect"));
        assert!(is_react_like_name("use0"));

        assert!(!is_react_like_name("component"));
        assert!(!is_react_like_name("myFunction"));
        assert!(!is_react_like_name("use"));
        assert!(!is_react_like_name("user"));
        assert!(!is_react_like_name("useful"));
        assert!(!is_react_like_name(""));
    }
}
