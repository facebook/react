// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

use swc_ecma_ast::{
    ArrowExpr, AssignExpr, AssignTarget, Class, FnDecl, FnExpr, Module, Pat, SimpleAssignTarget,
    VarDeclarator,
};
use swc_ecma_visit::Visit;

/// Checks if a module contains React-like functions (components or hooks).
///
/// A React-like function is one whose name:
/// - Starts with an uppercase letter (component convention)
/// - Matches the pattern `use[A-Z0-9]` (hook convention)
pub fn has_react_like_functions(module: &Module) -> bool {
    let mut visitor = ReactLikeVisitor {
        found: false,
        current_name: None,
    };
    visitor.visit_module(module);
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

impl Visit for ReactLikeVisitor {
    fn visit_var_declarator(&mut self, decl: &VarDeclarator) {
        if self.found {
            return;
        }

        // Extract name from the binding identifier
        let name = match &decl.name {
            Pat::Ident(binding_ident) => Some(binding_ident.id.sym.to_string()),
            _ => None,
        };

        let prev_name = self.current_name.take();
        self.current_name = name;

        // Visit the initializer with the name in scope
        if let Some(init) = &decl.init {
            self.visit_expr(init);
        }

        self.current_name = prev_name;
    }

    fn visit_assign_expr(&mut self, expr: &AssignExpr) {
        if self.found {
            return;
        }

        let name = match &expr.left {
            AssignTarget::Simple(SimpleAssignTarget::Ident(binding_ident)) => {
                Some(binding_ident.id.sym.to_string())
            }
            _ => None,
        };

        let prev_name = self.current_name.take();
        self.current_name = name;

        self.visit_expr(&expr.right);

        self.current_name = prev_name;
    }

    fn visit_fn_decl(&mut self, decl: &FnDecl) {
        if self.found {
            return;
        }

        if is_react_like_name(&decl.ident.sym) {
            self.found = true;
            return;
        }

        // Don't traverse into the function body
    }

    fn visit_fn_expr(&mut self, expr: &FnExpr) {
        if self.found {
            return;
        }

        // Check explicit function name
        if let Some(id) = &expr.ident {
            if is_react_like_name(&id.sym) {
                self.found = true;
                return;
            }
        }

        // Check inferred name from parent context
        if expr.ident.is_none() {
            if let Some(name) = &self.current_name {
                if is_react_like_name(name) {
                    self.found = true;
                    return;
                }
            }
        }

        // Don't traverse into the function body
    }

    fn visit_arrow_expr(&mut self, _expr: &ArrowExpr) {
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

    fn visit_class(&mut self, _class: &Class) {
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
