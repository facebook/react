// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

//! Aligns scopes of object method values to that of their enclosing object expressions.
//! To produce a well-formed JS program in Codegen, object methods and object expressions
//! must be in the same ReactiveBlock as object method definitions must be inlined.
//!
//! Ported from TypeScript `src/ReactiveScopes/AlignObjectMethodScopes.ts`.

use std::cmp;
use std::collections::{HashMap, HashSet};

use indexmap::IndexMap;
use react_compiler_hir::environment::Environment;
use react_compiler_hir::{
    EvaluationOrder, HirFunction, IdentifierId, InstructionValue, ObjectPropertyOrSpread, ScopeId,
};

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

    /// Iterate over all (item, group_root) pairs (canonicalized).
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
// findScopesToMerge
// =============================================================================

/// Identifies ObjectMethod lvalue identifiers and then finds ObjectExpression
/// instructions whose operands reference those methods. Returns a disjoint set
/// of scopes that must be merged.
fn find_scopes_to_merge(func: &HirFunction, env: &Environment) -> ScopeDisjointSet {
    let mut object_method_decls: HashSet<IdentifierId> = HashSet::new();
    let mut merged_scopes = ScopeDisjointSet::new();

    for (_block_id, block) in &func.body.blocks {
        for &instr_id in &block.instructions {
            let instr = &func.instructions[instr_id.0 as usize];
            match &instr.value {
                InstructionValue::ObjectMethod { .. } => {
                    object_method_decls.insert(instr.lvalue.identifier);
                }
                InstructionValue::ObjectExpression { properties, .. } => {
                    for prop_or_spread in properties {
                        let operand_place = match prop_or_spread {
                            ObjectPropertyOrSpread::Property(prop) => &prop.place,
                            ObjectPropertyOrSpread::Spread(spread) => &spread.place,
                        };
                        if object_method_decls.contains(&operand_place.identifier) {
                            let operand_scope =
                                env.identifiers[operand_place.identifier.0 as usize].scope;
                            let lvalue_scope =
                                env.identifiers[instr.lvalue.identifier.0 as usize].scope;

                            // TS: CompilerError.invariant(operandScope != null && lvalueScope != null, ...)
                            let operand_sid = operand_scope.expect(
                                "Internal error: Expected all ObjectExpressions and ObjectMethods to have non-null scope.",
                            );
                            let lvalue_sid = lvalue_scope.expect(
                                "Internal error: Expected all ObjectExpressions and ObjectMethods to have non-null scope.",
                            );
                            merged_scopes.union([operand_sid, lvalue_sid]);
                        }
                    }
                }
                _ => {}
            }
        }
    }

    merged_scopes
}

// =============================================================================
// Public API
// =============================================================================

/// Aligns object method scopes so that ObjectMethod values and their enclosing
/// ObjectExpression share the same scope.
///
/// Corresponds to TS `alignObjectMethodScopes(fn: HIRFunction): void`.
pub fn align_object_method_scopes(func: &mut HirFunction, env: &mut Environment) {
    // Handle inner functions first (TS recurses before processing the outer function)
    for (_block_id, block) in &func.body.blocks {
        for &instr_id in &block.instructions {
            let instr = &func.instructions[instr_id.0 as usize];
            match &instr.value {
                InstructionValue::FunctionExpression { lowered_func, .. }
                | InstructionValue::ObjectMethod { lowered_func, .. } => {
                    let func_id = lowered_func.func;
                    let mut inner_func = std::mem::replace(
                        &mut env.functions[func_id.0 as usize],
                        react_compiler_ssa::enter_ssa::placeholder_function(),
                    );
                    align_object_method_scopes(&mut inner_func, env);
                    env.functions[func_id.0 as usize] = inner_func;
                }
                _ => {}
            }
        }
    }

    let mut merged_scopes = find_scopes_to_merge(func, env);

    // Step 1: Merge affected scopes to their canonical root
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

    // Step 2: Repoint identifiers whose scopes were merged
    // Build a map from old scope -> root scope for quick lookup
    let mut scope_remap: HashMap<ScopeId, ScopeId> = HashMap::new();
    merged_scopes.for_each(|scope_id, root_id| {
        if scope_id != root_id {
            scope_remap.insert(scope_id, root_id);
        }
    });

    for (_block_id, block) in &func.body.blocks {
        for &instr_id in &block.instructions {
            let lvalue_id = func.instructions[instr_id.0 as usize].lvalue.identifier;

            if let Some(current_scope) = env.identifiers[lvalue_id.0 as usize].scope {
                if let Some(&root) = scope_remap.get(&current_scope) {
                    env.identifiers[lvalue_id.0 as usize].scope = Some(root);
                }
            }
        }
    }
}
