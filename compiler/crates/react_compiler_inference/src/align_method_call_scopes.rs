// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

//! Ensures that method call instructions have scopes such that either:
//! - Both the MethodCall and its property have the same scope
//! - OR neither has a scope
//!
//! Ported from TypeScript `src/ReactiveScopes/AlignMethodCallScopes.ts`.

use std::cmp;
use std::collections::HashMap;

use indexmap::IndexMap;
use react_compiler_hir::environment::Environment;
use react_compiler_hir::{EvaluationOrder, HirFunction, IdentifierId, InstructionValue, ScopeId};

// =============================================================================
// DisjointSet<ScopeId>
// =============================================================================

/// A Union-Find data structure for grouping ScopeIds into disjoint sets.
/// Mirrors the TS `DisjointSet<ReactiveScope>` used in the original pass.
struct ScopeDisjointSet {
    entries: IndexMap<ScopeId, ScopeId>,
}

impl ScopeDisjointSet {
    fn new() -> Self {
        ScopeDisjointSet {
            entries: IndexMap::new(),
        }
    }

    /// Find the root of the set containing `item`, with path compression.
    fn find(&mut self, item: ScopeId) -> ScopeId {
        let parent = match self.entries.get(&item) {
            Some(&p) => p,
            None => {
                self.entries.insert(item, item);
                return item;
            }
        };
        if parent == item {
            return item;
        }
        let root = self.find(parent);
        self.entries.insert(item, root);
        root
    }

    /// Union two scope IDs into one set.
    fn union(&mut self, items: [ScopeId; 2]) {
        let root = self.find(items[0]);
        let item_root = self.find(items[1]);
        if item_root != root {
            self.entries.insert(item_root, root);
        }
    }

    /// Iterate over all (item, group_root) pairs.
    fn for_each<F>(&mut self, mut f: F)
    where
        F: FnMut(ScopeId, ScopeId),
    {
        let keys: Vec<ScopeId> = self.entries.keys().copied().collect();
        for item in keys {
            let group = self.find(item);
            f(item, group);
        }
    }
}

// =============================================================================
// Public API
// =============================================================================

/// Aligns method call scopes so that either both the MethodCall result and its
/// property operand share the same scope, or neither has a scope.
///
/// Corresponds to TS `alignMethodCallScopes(fn: HIRFunction): void`.
pub fn align_method_call_scopes(func: &mut HirFunction, env: &mut Environment) {
    // Maps an identifier to the scope it should be assigned to (or None to remove scope)
    let mut scope_mapping: HashMap<IdentifierId, Option<ScopeId>> = HashMap::new();
    let mut merged_scopes = ScopeDisjointSet::new();

    // Phase 1: Walk instructions and collect scope relationships
    for (_block_id, block) in &func.body.blocks {
        for &instr_id in &block.instructions {
            let instr = &func.instructions[instr_id.0 as usize];
            match &instr.value {
                InstructionValue::MethodCall { property, .. } => {
                    let lvalue_scope =
                        env.identifiers[instr.lvalue.identifier.0 as usize].scope;
                    let property_scope =
                        env.identifiers[property.identifier.0 as usize].scope;

                    match (lvalue_scope, property_scope) {
                        (Some(lvalue_sid), Some(property_sid)) => {
                            // Both have a scope: merge the scopes
                            merged_scopes.union([lvalue_sid, property_sid]);
                        }
                        (Some(lvalue_sid), None) => {
                            // Call has a scope but not the property:
                            // record that this property should be in this scope
                            scope_mapping
                                .insert(property.identifier, Some(lvalue_sid));
                        }
                        (None, Some(_)) => {
                            // Property has a scope but call doesn't:
                            // this property does not need a scope
                            scope_mapping.insert(property.identifier, None);
                        }
                        (None, None) => {
                            // Neither has a scope, nothing to do
                        }
                    }
                }
                InstructionValue::FunctionExpression { lowered_func, .. }
                | InstructionValue::ObjectMethod { lowered_func, .. } => {
                    // Recurse into inner functions
                    let func_id = lowered_func.func;
                    let mut inner_func = std::mem::replace(
                        &mut env.functions[func_id.0 as usize],
                        react_compiler_ssa::enter_ssa::placeholder_function(),
                    );
                    align_method_call_scopes(&mut inner_func, env);
                    env.functions[func_id.0 as usize] = inner_func;
                }
                _ => {}
            }
        }
    }

    // Phase 2: Merge scope ranges for unioned scopes
    // Collect the merged range updates first, then apply them
    let mut range_updates: Vec<(ScopeId, EvaluationOrder, EvaluationOrder)> = Vec::new();

    merged_scopes.for_each(|scope_id, root_id| {
        if scope_id == root_id {
            return;
        }
        let scope_range = env.scopes[scope_id.0 as usize].range.clone();
        let root_range = env.scopes[root_id.0 as usize].range.clone();

        let new_start = EvaluationOrder(cmp::min(scope_range.start.0, root_range.start.0));
        let new_end = EvaluationOrder(cmp::max(scope_range.end.0, root_range.end.0));

        range_updates.push((root_id, new_start, new_end));
    });

    for (root_id, new_start, new_end) in range_updates {
        env.scopes[root_id.0 as usize].range.start = new_start;
        env.scopes[root_id.0 as usize].range.end = new_end;
    }

    // Phase 3: Apply scope mappings and merged scope reassignments
    for (_block_id, block) in &func.body.blocks {
        for &instr_id in &block.instructions {
            let lvalue_id = func.instructions[instr_id.0 as usize].lvalue.identifier;

            if let Some(mapped_scope) = scope_mapping.get(&lvalue_id) {
                env.identifiers[lvalue_id.0 as usize].scope = *mapped_scope;
            } else if let Some(current_scope) =
                env.identifiers[lvalue_id.0 as usize].scope
            {
                let merged = merged_scopes.find(current_scope);
                // find() always returns a root; update if it was in the set
                if merged != current_scope {
                    env.identifiers[lvalue_id.0 as usize].scope = Some(merged);
                }
            }
        }
    }
}
