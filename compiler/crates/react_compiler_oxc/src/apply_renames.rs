// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

//! Apply compiler binding renames to an OXC AST.
//!
//! When the React Compiler renames a binding (e.g., `x` → `x_0` to avoid
//! shadowing conflicts), compiled functions already contain the renamed
//! identifiers. However, uncompiled sibling functions that reference the same
//! binding still use the original name. This module walks the OXC program
//! and renames identifiers at positions recorded in the rewrite plan.

use std::collections::HashMap;

use oxc_allocator::FromIn;
use oxc_ast::ast::*;
use oxc_ast_visit::VisitMut;
use oxc_ast_visit::walk_mut;
use oxc_span::Atom;
use react_compiler::entrypoint::compile_result::BindingRenameInfo;
use react_compiler_ast::scope::BindingId;
use react_compiler_ast::scope::ScopeInfo;

/// Build a rewrite plan from the scope info and compiler renames.
///
/// Returns a map from source position to the new identifier name.
/// This uses the scope info's `ref_node_id_to_binding` to find all references
/// to renamed bindings. In OXC, node_id == span.start, so the positions
/// in the rewrite plan correspond to `span.start` values in the OXC AST.
pub fn build_rename_plan(
    scope_info: &ScopeInfo,
    renames: &[BindingRenameInfo],
) -> HashMap<u32, String> {
    if renames.is_empty() {
        return HashMap::new();
    }

    // Map declaration_start -> rename info
    let renames_by_declaration: HashMap<u32, &BindingRenameInfo> = renames
        .iter()
        .map(|rename| (rename.declaration_start, rename))
        .collect();

    // Find which BindingIds have been renamed
    let mut renamed_bindings: HashMap<BindingId, String> = HashMap::new();
    for binding in &scope_info.bindings {
        let Some(rename) = binding
            .declaration_start
            .and_then(|start| renames_by_declaration.get(&start))
        else {
            continue;
        };
        if binding.name == rename.original {
            renamed_bindings.insert(binding.id, rename.renamed.clone());
        }
    }

    if renamed_bindings.is_empty() {
        return HashMap::new();
    }

    // Build position -> new_name map from all references to renamed bindings.
    // Uses ref_node_id_to_binding (node-ID keyed; in OXC node_id == span.start).
    scope_info
        .ref_node_id_to_binding
        .iter()
        .filter_map(|(&position, binding_id)| {
            renamed_bindings
                .get(binding_id)
                .map(|renamed| (position, renamed.clone()))
        })
        .collect()
}

/// Apply renames to an OXC program using a pre-computed rewrite plan.
///
/// The rewrite plan maps span.start positions to new identifier names.
/// This function walks the AST and renames:
/// - `IdentifierReference` nodes (variable reads)
/// - `BindingIdentifier` nodes (variable declarations/params)
///
/// Special handling is applied for:
/// - Shorthand object properties `{x}` → `{x: x_0}`
/// - Shorthand binding properties `{x}` → `{x: x_0}` in destructuring patterns
pub fn apply_renames<'a>(
    program: &mut Program<'a>,
    rename_plan: &HashMap<u32, String>,
    allocator: &'a oxc_allocator::Allocator,
) {
    if rename_plan.is_empty() {
        return;
    }
    walk_mut::walk_program(
        &mut RenameApplyVisitor {
            rename_plan,
            allocator,
        },
        program,
    );
}

struct RenameApplyVisitor<'a, 'p> {
    rename_plan: &'p HashMap<u32, String>,
    allocator: &'a oxc_allocator::Allocator,
}

impl<'a, 'p> RenameApplyVisitor<'a, 'p> {
    fn renamed_at(&self, position: u32) -> Option<&str> {
        self.rename_plan.get(&position).map(|s| s.as_str())
    }
}

impl<'a> VisitMut<'a> for RenameApplyVisitor<'a, '_> {
    /// Rename identifier references (variable reads/uses).
    fn visit_identifier_reference(&mut self, ident: &mut IdentifierReference<'a>) {
        if let Some(renamed) = self.renamed_at(ident.span.start) {
            ident.name = Atom::from_in(renamed, self.allocator).into();
        }
    }

    /// Rename binding identifiers (variable declarations/params).
    fn visit_binding_identifier(&mut self, ident: &mut BindingIdentifier<'a>) {
        if let Some(renamed) = self.renamed_at(ident.span.start) {
            ident.name = Atom::from_in(renamed, self.allocator).into();
        }
    }

    /// Handle member expressions: only rename the object, not static property names.
    /// `obj.prop` — rename `obj` if needed, never rename `prop`.
    /// `obj[expr]` — rename `obj` and recurse into `expr`.
    fn visit_member_expression(&mut self, expr: &mut MemberExpression<'a>) {
        match expr {
            MemberExpression::StaticMemberExpression(static_expr) => {
                // Only visit the object, skip the property (it's a fixed name)
                self.visit_expression(&mut static_expr.object);
            }
            MemberExpression::ComputedMemberExpression(computed_expr) => {
                self.visit_expression(&mut computed_expr.object);
                self.visit_expression(&mut computed_expr.expression);
            }
            MemberExpression::PrivateFieldExpression(private_expr) => {
                self.visit_expression(&mut private_expr.object);
                // Private field names are never renamed
            }
        }
    }

    /// Handle object properties: convert shorthand `{x}` to `{x: x_0}` when renamed.
    fn visit_object_property(&mut self, prop: &mut ObjectProperty<'a>) {
        if prop.shorthand {
            // Shorthand property like `{x}` — check if the value identifier is renamed
            if let Expression::Identifier(ref ident) = prop.value {
                if let Some(renamed) = self.renamed_at(ident.span.start) {
                    // Convert shorthand to key-value: `{x}` → `{x: x_0}`
                    prop.shorthand = false;
                    // The key stays as the original name (already set)
                    // The value gets the renamed identifier
                    if let Expression::Identifier(ref mut ident) = prop.value {
                        ident.name = Atom::from_in(renamed, self.allocator).into();
                    }
                    return;
                }
            }
        }
        // For non-shorthand properties, only visit the value (and computed keys)
        if prop.computed {
            self.visit_property_key(&mut prop.key);
        }
        self.visit_expression(&mut prop.value);
    }

    /// Handle binding properties in destructuring: `{x}` → `{x: x_0}` when renamed.
    fn visit_binding_property(&mut self, prop: &mut BindingProperty<'a>) {
        if prop.shorthand {
            // Shorthand binding like `const {x} = obj` — check if binding is renamed
            if let BindingPattern::BindingIdentifier(ref ident) = prop.value {
                if let Some(renamed) = self.renamed_at(ident.span.start) {
                    // Convert shorthand to key-value: `{x}` → `{x: x_0}`
                    prop.shorthand = false;
                    // Rename the binding identifier
                    if let BindingPattern::BindingIdentifier(ref mut ident) = prop.value {
                        ident.name = Atom::from_in(renamed, self.allocator).into();
                    }
                    return;
                }
            }
        }
        // For non-shorthand, visit the value pattern (and computed keys)
        if prop.computed {
            self.visit_property_key(&mut prop.key);
        }
        self.visit_binding_pattern(&mut prop.value);
    }
}
