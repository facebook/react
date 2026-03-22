// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

//! MergeReactiveScopesThatInvalidateTogether — merges adjacent or nested scopes
//! that share dependencies (and thus invalidate together) to reduce memoization overhead.
//!
//! Corresponds to `src/ReactiveScopes/MergeReactiveScopesThatInvalidateTogether.ts`.

use std::collections::{HashMap, HashSet};

use react_compiler_diagnostics::{CompilerDiagnostic, ErrorCategory};
use react_compiler_hir::{
    DeclarationId, DependencyPathEntry, EvaluationOrder, IdentifierId, InstructionKind,
    InstructionValue, ReactiveBlock, ReactiveFunction, ReactiveInstruction, ReactiveStatement,
    ReactiveTerminal, ReactiveTerminalStatement, ReactiveValue, ReactiveScopeBlock,
    ReactiveScopeDependency, ScopeId, Type,
    environment::Environment,
    object_shape::{BUILT_IN_ARRAY_ID, BUILT_IN_FUNCTION_ID, BUILT_IN_JSX_ID, BUILT_IN_OBJECT_ID},
};

// =============================================================================
// Public entry point
// =============================================================================

/// Merges adjacent reactive scopes that share dependencies (invalidate together).
/// TS: `mergeReactiveScopesThatInvalidateTogether`
pub fn merge_reactive_scopes_that_invalidate_together(
    func: &mut ReactiveFunction,
    env: &mut Environment,
) -> Result<(), CompilerDiagnostic> {
    // Pass 1: find last usage of each declaration
    let mut last_usage: HashMap<DeclarationId, EvaluationOrder> = HashMap::new();
    find_last_usage(&func.body, &mut last_usage, env);

    // Pass 2+3: merge scopes
    let mut temporaries: HashMap<DeclarationId, DeclarationId> = HashMap::new();
    visit_block_for_merge(&mut func.body, env, &last_usage, &mut temporaries, None)?;
    Ok(())
}

// =============================================================================
// Pass 1: FindLastUsageVisitor
// =============================================================================

fn find_last_usage(
    block: &ReactiveBlock,
    last_usage: &mut HashMap<DeclarationId, EvaluationOrder>,
    env: &Environment,
) {
    for stmt in block {
        match stmt {
            ReactiveStatement::Instruction(instr) => {
                find_last_usage_in_instruction(instr, last_usage, env);
            }
            ReactiveStatement::Terminal(term) => {
                find_last_usage_in_terminal(term, last_usage, env);
            }
            ReactiveStatement::Scope(scope) => {
                find_last_usage(&scope.instructions, last_usage, env);
            }
            ReactiveStatement::PrunedScope(scope) => {
                find_last_usage(&scope.instructions, last_usage, env);
            }
        }
    }
}

fn record_place_usage(
    id: EvaluationOrder,
    place: &react_compiler_hir::Place,
    last_usage: &mut HashMap<DeclarationId, EvaluationOrder>,
    env: &Environment,
) {
    let decl_id = env.identifiers[place.identifier.0 as usize].declaration_id;
    let entry = last_usage.entry(decl_id).or_insert(id);
    if id > *entry {
        *entry = id;
    }
}

fn find_last_usage_in_value(
    id: EvaluationOrder,
    value: &ReactiveValue,
    last_usage: &mut HashMap<DeclarationId, EvaluationOrder>,
    env: &Environment,
) {
    match value {
        ReactiveValue::Instruction(instr_value) => {
            for place in crate::visitors::each_instruction_value_operand_public(instr_value) {
                record_place_usage(id, place, last_usage, env);
            }
        }
        ReactiveValue::OptionalExpression { value: inner, .. } => {
            find_last_usage_in_value(id, inner, last_usage, env);
        }
        ReactiveValue::LogicalExpression { left, right, .. } => {
            find_last_usage_in_value(id, left, last_usage, env);
            find_last_usage_in_value(id, right, last_usage, env);
        }
        ReactiveValue::ConditionalExpression {
            test,
            consequent,
            alternate,
            ..
        } => {
            find_last_usage_in_value(id, test, last_usage, env);
            find_last_usage_in_value(id, consequent, last_usage, env);
            find_last_usage_in_value(id, alternate, last_usage, env);
        }
        ReactiveValue::SequenceExpression {
            instructions,
            id: seq_id,
            value: inner,
            ..
        } => {
            for instr in instructions {
                find_last_usage_in_instruction(instr, last_usage, env);
            }
            find_last_usage_in_value(*seq_id, inner, last_usage, env);
        }
    }
}

fn find_last_usage_in_instruction(
    instr: &ReactiveInstruction,
    last_usage: &mut HashMap<DeclarationId, EvaluationOrder>,
    env: &Environment,
) {
    if let Some(lvalue) = &instr.lvalue {
        record_place_usage(instr.id, lvalue, last_usage, env);
    }
    find_last_usage_in_value(instr.id, &instr.value, last_usage, env);
}

fn find_last_usage_in_terminal(
    stmt: &ReactiveTerminalStatement,
    last_usage: &mut HashMap<DeclarationId, EvaluationOrder>,
    env: &Environment,
) {
    let terminal = &stmt.terminal;
    match terminal {
        ReactiveTerminal::Break { .. } | ReactiveTerminal::Continue { .. } => {}
        ReactiveTerminal::Return { value, id, .. } => {
            record_place_usage(*id, value, last_usage, env);
        }
        ReactiveTerminal::Throw { value, id, .. } => {
            record_place_usage(*id, value, last_usage, env);
        }
        ReactiveTerminal::For {
            init,
            test,
            update,
            loop_block,
            id,
            ..
        } => {
            find_last_usage_in_value(*id, init, last_usage, env);
            find_last_usage_in_value(*id, test, last_usage, env);
            find_last_usage(loop_block, last_usage, env);
            if let Some(update) = update {
                find_last_usage_in_value(*id, update, last_usage, env);
            }
        }
        ReactiveTerminal::ForOf {
            init,
            test,
            loop_block,
            id,
            ..
        } => {
            find_last_usage_in_value(*id, init, last_usage, env);
            find_last_usage_in_value(*id, test, last_usage, env);
            find_last_usage(loop_block, last_usage, env);
        }
        ReactiveTerminal::ForIn {
            init,
            loop_block,
            id,
            ..
        } => {
            find_last_usage_in_value(*id, init, last_usage, env);
            find_last_usage(loop_block, last_usage, env);
        }
        ReactiveTerminal::DoWhile {
            loop_block,
            test,
            id,
            ..
        } => {
            find_last_usage(loop_block, last_usage, env);
            find_last_usage_in_value(*id, test, last_usage, env);
        }
        ReactiveTerminal::While {
            test,
            loop_block,
            id,
            ..
        } => {
            find_last_usage_in_value(*id, test, last_usage, env);
            find_last_usage(loop_block, last_usage, env);
        }
        ReactiveTerminal::If {
            test,
            consequent,
            alternate,
            id,
            ..
        } => {
            record_place_usage(*id, test, last_usage, env);
            find_last_usage(consequent, last_usage, env);
            if let Some(alt) = alternate {
                find_last_usage(alt, last_usage, env);
            }
        }
        ReactiveTerminal::Switch {
            test, cases, id, ..
        } => {
            record_place_usage(*id, test, last_usage, env);
            for case in cases {
                if let Some(t) = &case.test {
                    record_place_usage(*id, t, last_usage, env);
                }
                if let Some(block) = &case.block {
                    find_last_usage(block, last_usage, env);
                }
            }
        }
        ReactiveTerminal::Label { block, .. } => {
            find_last_usage(block, last_usage, env);
        }
        ReactiveTerminal::Try {
            block,
            handler_binding,
            handler,
            id,
            ..
        } => {
            find_last_usage(block, last_usage, env);
            if let Some(binding) = handler_binding {
                record_place_usage(*id, binding, last_usage, env);
            }
            find_last_usage(handler, last_usage, env);
        }
    }
}

// =============================================================================
// Pass 2+3: Transform — merge scopes
// =============================================================================

/// Visit a block to merge scopes. Also handles nested scope flattening when
/// parent_deps is provided and matches inner scope deps.
fn visit_block_for_merge(
    block: &mut ReactiveBlock,
    env: &mut Environment,
    last_usage: &HashMap<DeclarationId, EvaluationOrder>,
    temporaries: &mut HashMap<DeclarationId, DeclarationId>,
    parent_deps: Option<&Vec<ReactiveScopeDependency>>,
) -> Result<(), CompilerDiagnostic> {
    // First, process nested scopes (may flatten inner scopes)
    let mut i = 0;
    while i < block.len() {
        match &mut block[i] {
            ReactiveStatement::Scope(scope_block) => {
                let scope_id = scope_block.scope;
                let scope_deps = env.scopes[scope_id.0 as usize].dependencies.clone();
                // Recurse into the scope's instructions, passing this scope's deps
                // so nested scopes with identical deps can be flattened
                visit_block_for_merge(
                    &mut scope_block.instructions,
                    env,
                    last_usage,
                    temporaries,
                    Some(&scope_deps),
                )?;

                // Check if this scope should be flattened into its parent
                if let Some(p_deps) = parent_deps {
                    if are_equal_dependencies(p_deps, &scope_deps, env) {
                        // Flatten: replace this scope with its instructions
                        let instructions =
                            std::mem::take(&mut scope_block.instructions);
                        block.splice(i..=i, instructions);
                        // Don't increment i — we need to re-examine the replaced items
                        continue;
                    }
                }
            }
            ReactiveStatement::Terminal(term) => {
                visit_terminal_for_merge(term, env, last_usage, temporaries)?;
            }
            ReactiveStatement::PrunedScope(pruned) => {
                visit_block_for_merge(
                    &mut pruned.instructions,
                    env,
                    last_usage,
                    temporaries,
                    None,
                )?;
            }
            ReactiveStatement::Instruction(_) => {}
        }
        i += 1;
    }

    // Pass 2: identify scopes for merging
    struct MergedScope {
        /// Index of the first scope in the merge range
        scope_index: usize,
        /// Scope ID of the first (target) scope
        scope_id: ScopeId,
        from: usize,
        to: usize,
        lvalues: HashSet<DeclarationId>,
    }

    let mut current: Option<MergedScope> = None;
    let mut merged: Vec<MergedScope> = Vec::new();

    let block_len = block.len();
    for i in 0..block_len {
        match &block[i] {
            ReactiveStatement::Terminal(_) => {
                // Don't merge across terminals
                if let Some(c) = current.take() {
                    if c.to > c.from + 1 {
                        merged.push(c);
                    }
                }
            }
            ReactiveStatement::PrunedScope(_) => {
                // Don't merge across pruned scopes
                if let Some(c) = current.take() {
                    if c.to > c.from + 1 {
                        merged.push(c);
                    }
                }
            }
            ReactiveStatement::Instruction(instr) => {
                match &instr.value {
                    ReactiveValue::Instruction(iv) => {
                        match iv {
                            InstructionValue::BinaryExpression { .. }
                            | InstructionValue::ComputedLoad { .. }
                            | InstructionValue::JSXText { .. }
                            | InstructionValue::LoadGlobal { .. }
                            | InstructionValue::LoadLocal { .. }
                            | InstructionValue::Primitive { .. }
                            | InstructionValue::PropertyLoad { .. }
                            | InstructionValue::TemplateLiteral { .. }
                            | InstructionValue::UnaryExpression { .. } => {
                                if let Some(ref mut c) = current {
                                    if let Some(lvalue) = &instr.lvalue {
                                        let decl_id = env.identifiers
                                            [lvalue.identifier.0 as usize]
                                            .declaration_id;
                                        c.lvalues.insert(decl_id);
                                        if matches!(iv, InstructionValue::LoadLocal { place, .. })
                                        {
                                            if let InstructionValue::LoadLocal { place, .. } = iv {
                                                let src_decl = env.identifiers
                                                    [place.identifier.0 as usize]
                                                    .declaration_id;
                                                temporaries.insert(decl_id, src_decl);
                                            }
                                        }
                                    }
                                }
                            }
                            InstructionValue::StoreLocal { lvalue, value, .. } => {
                                if let Some(ref mut c) = current {
                                    if lvalue.kind == InstructionKind::Const {
                                        // Add the instruction lvalue (if any)
                                        if let Some(instr_lvalue) = &instr.lvalue {
                                            let decl_id = env.identifiers
                                                [instr_lvalue.identifier.0 as usize]
                                                .declaration_id;
                                            c.lvalues.insert(decl_id);
                                        }
                                        // Add the StoreLocal's lvalue place
                                        let store_decl = env.identifiers
                                            [lvalue.place.identifier.0 as usize]
                                            .declaration_id;
                                        c.lvalues.insert(store_decl);
                                        // Track temporary mapping
                                        let value_decl = env.identifiers
                                            [value.identifier.0 as usize]
                                            .declaration_id;
                                        let mapped = temporaries
                                            .get(&value_decl)
                                            .copied()
                                            .unwrap_or(value_decl);
                                        temporaries.insert(store_decl, mapped);
                                    } else {
                                        // Non-const StoreLocal — reset
                                        let c = current.take().unwrap();
                                        if c.to > c.from + 1 {
                                            merged.push(c);
                                        }
                                    }
                                }
                            }
                            _ => {
                                // Other instructions prevent merging
                                if let Some(c) = current.take() {
                                    if c.to > c.from + 1 {
                                        merged.push(c);
                                    }
                                }
                            }
                        }
                    }
                    _ => {
                        // Non-Instruction reactive values prevent merging
                        if let Some(c) = current.take() {
                            if c.to > c.from + 1 {
                                merged.push(c);
                            }
                        }
                    }
                }
            }
            ReactiveStatement::Scope(scope_block) => {
                let next_scope_id = scope_block.scope;
                if let Some(ref mut c) = current {
                    let current_scope_id = c.scope_id;
                    if can_merge_scopes(current_scope_id, next_scope_id, env, temporaries)
                        && are_lvalues_last_used_by_scope(
                            next_scope_id,
                            &c.lvalues,
                            last_usage,
                            env,
                        )
                    {
                        // Merge: extend the current scope's range
                        let next_range_end =
                            env.scopes[next_scope_id.0 as usize].range.end;
                        let current_range_end =
                            env.scopes[current_scope_id.0 as usize].range.end;
                        env.scopes[current_scope_id.0 as usize].range.end =
                            EvaluationOrder(current_range_end.0.max(next_range_end.0));

                        // Merge declarations from next into current
                        let next_decls =
                            env.scopes[next_scope_id.0 as usize].declarations.clone();
                        for (key, value) in next_decls {
                            // Add or replace
                            let current_decls =
                                &mut env.scopes[current_scope_id.0 as usize].declarations;
                            if let Some(existing) =
                                current_decls.iter_mut().find(|(k, _)| *k == key)
                            {
                                existing.1 = value;
                            } else {
                                current_decls.push((key, value));
                            }
                        }

                        // Prune declarations that are no longer used after the merged scope
                        update_scope_declarations(current_scope_id, last_usage, env);

                        c.to = i + 1;
                        c.lvalues.clear();

                        if !scope_is_eligible_for_merging(next_scope_id, env) {
                            let c = current.take().unwrap();
                            if c.to > c.from + 1 {
                                merged.push(c);
                            }
                        }
                    } else {
                        // Cannot merge — reset
                        let c = current.take().unwrap();
                        if c.to > c.from + 1 {
                            merged.push(c);
                        }
                        // Start new candidate if eligible
                        if scope_is_eligible_for_merging(next_scope_id, env) {
                            current = Some(MergedScope {
                                scope_index: i,
                                scope_id: next_scope_id,
                                from: i,
                                to: i + 1,
                                lvalues: HashSet::new(),
                            });
                        }
                    }
                } else {
                    // No current — start new candidate if eligible
                    if scope_is_eligible_for_merging(next_scope_id, env) {
                        current = Some(MergedScope {
                            scope_index: i,
                            scope_id: next_scope_id,
                            from: i,
                            to: i + 1,
                            lvalues: HashSet::new(),
                        });
                    }
                }
            }
        }
    }
    // Flush remaining
    if let Some(c) = current.take() {
        if c.to > c.from + 1 {
            merged.push(c);
        }
    }

    // Pass 3: apply merges
    if merged.is_empty() {
        return Ok(());
    }

    let mut next_instructions: Vec<ReactiveStatement> = Vec::new();
    let mut index = 0;
    // Take ownership of all statements
    let all_stmts: Vec<ReactiveStatement> = std::mem::take(block);

    for entry in &merged {
        // Push everything before the merge range
        while index < entry.from {
            next_instructions.push(all_stmts[index].clone());
            index += 1;
        }
        // The first item in the merge range must be a scope
        let mut merged_scope = match &all_stmts[entry.from] {
            ReactiveStatement::Scope(s) => s.clone(),
            _ => {
                return Err(CompilerDiagnostic::new(
                    ErrorCategory::Invariant,
                    "MergeConsecutiveScopes: Expected scope at starting index",
                    None,
                ));
            }
        };
        index += 1;
        while index < entry.to {
            let stmt = &all_stmts[index];
            index += 1;
            match stmt {
                ReactiveStatement::Scope(inner_scope) => {
                    // Merge the inner scope's instructions into the target
                    merged_scope
                        .instructions
                        .extend(inner_scope.instructions.clone());
                    // Record the merged scope ID
                    env.scopes[merged_scope.scope.0 as usize]
                        .merged
                        .push(inner_scope.scope);
                }
                _ => {
                    merged_scope.instructions.push(stmt.clone());
                }
            }
        }
        next_instructions.push(ReactiveStatement::Scope(merged_scope));
    }
    // Push remaining
    while index < all_stmts.len() {
        next_instructions.push(all_stmts[index].clone());
        index += 1;
    }

    *block = next_instructions;
    Ok(())
}

fn visit_terminal_for_merge(
    stmt: &mut ReactiveTerminalStatement,
    env: &mut Environment,
    last_usage: &HashMap<DeclarationId, EvaluationOrder>,
    temporaries: &mut HashMap<DeclarationId, DeclarationId>,
) -> Result<(), CompilerDiagnostic> {
    match &mut stmt.terminal {
        ReactiveTerminal::Break { .. } | ReactiveTerminal::Continue { .. } => {}
        ReactiveTerminal::Return { .. } | ReactiveTerminal::Throw { .. } => {}
        ReactiveTerminal::For {
            loop_block, ..
        } => {
            visit_block_for_merge(loop_block, env, last_usage, temporaries, None)?;
        }
        ReactiveTerminal::ForOf {
            loop_block, ..
        } => {
            visit_block_for_merge(loop_block, env, last_usage, temporaries, None)?;
        }
        ReactiveTerminal::ForIn {
            loop_block, ..
        } => {
            visit_block_for_merge(loop_block, env, last_usage, temporaries, None)?;
        }
        ReactiveTerminal::DoWhile {
            loop_block, ..
        } => {
            visit_block_for_merge(loop_block, env, last_usage, temporaries, None)?;
        }
        ReactiveTerminal::While {
            loop_block, ..
        } => {
            visit_block_for_merge(loop_block, env, last_usage, temporaries, None)?;
        }
        ReactiveTerminal::If {
            consequent,
            alternate,
            ..
        } => {
            visit_block_for_merge(consequent, env, last_usage, temporaries, None)?;
            if let Some(alt) = alternate {
                visit_block_for_merge(alt, env, last_usage, temporaries, None)?;
            }
        }
        ReactiveTerminal::Switch { cases, .. } => {
            for case in cases.iter_mut() {
                if let Some(block) = &mut case.block {
                    visit_block_for_merge(block, env, last_usage, temporaries, None)?;
                }
            }
        }
        ReactiveTerminal::Label { block, .. } => {
            visit_block_for_merge(block, env, last_usage, temporaries, None)?;
        }
        ReactiveTerminal::Try {
            block, handler, ..
        } => {
            visit_block_for_merge(block, env, last_usage, temporaries, None)?;
            visit_block_for_merge(handler, env, last_usage, temporaries, None)?;
        }
    }
    Ok(())
}

// =============================================================================
// Helper functions
// =============================================================================

/// Updates scope declarations to remove any that are not used after the scope.
fn update_scope_declarations(
    scope_id: ScopeId,
    last_usage: &HashMap<DeclarationId, EvaluationOrder>,
    env: &mut Environment,
) {
    let range_end = env.scopes[scope_id.0 as usize].range.end;
    env.scopes[scope_id.0 as usize]
        .declarations
        .retain(|(_id, decl)| {
            let decl_declaration_id = env.identifiers[decl.identifier.0 as usize].declaration_id;
            match last_usage.get(&decl_declaration_id) {
                Some(last_used_at) => *last_used_at >= range_end,
                // If not tracked, keep the declaration (conservative)
                None => true,
            }
        });
}

/// Returns whether all lvalues are last used at or before the given scope.
fn are_lvalues_last_used_by_scope(
    scope_id: ScopeId,
    lvalues: &HashSet<DeclarationId>,
    last_usage: &HashMap<DeclarationId, EvaluationOrder>,
    env: &Environment,
) -> bool {
    let range_end = env.scopes[scope_id.0 as usize].range.end;
    for lvalue in lvalues {
        if let Some(&last_used_at) = last_usage.get(lvalue) {
            if last_used_at >= range_end {
                return false;
            }
        }
    }
    true
}

/// Check if two scopes can be merged.
fn can_merge_scopes(
    current_id: ScopeId,
    next_id: ScopeId,
    env: &Environment,
    temporaries: &HashMap<DeclarationId, DeclarationId>,
) -> bool {
    let current = &env.scopes[current_id.0 as usize];
    let next = &env.scopes[next_id.0 as usize];

    // Don't merge scopes with reassignments
    if !current.reassignments.is_empty() || !next.reassignments.is_empty() {
        return false;
    }

    // Merge scopes whose dependencies are identical
    if are_equal_dependencies(&current.dependencies, &next.dependencies, env) {
        return true;
    }

    // Merge scopes where outputs of current are inputs of next
    // Build synthetic dependencies from current's declarations
    let current_decl_deps: Vec<ReactiveScopeDependency> = current
        .declarations
        .iter()
        .map(|(_key, decl)| ReactiveScopeDependency {
            identifier: decl.identifier,
            reactive: true,
            path: Vec::new(),
            loc: None,
        })
        .collect();

    if are_equal_dependencies(&current_decl_deps, &next.dependencies, env) {
        return true;
    }

    // Check if all next deps have empty paths, always-invalidating types,
    // and correspond to current declarations (possibly through temporaries)
    if !next.dependencies.is_empty()
        && next.dependencies.iter().all(|dep| {
            if !dep.path.is_empty() {
                return false;
            }
            let dep_type = &env.types[env.identifiers[dep.identifier.0 as usize].type_.0 as usize];
            if !is_always_invalidating_type(dep_type) {
                return false;
            }
            let dep_decl = env.identifiers[dep.identifier.0 as usize].declaration_id;
            current.declarations.iter().any(|(_key, decl)| {
                let decl_decl_id =
                    env.identifiers[decl.identifier.0 as usize].declaration_id;
                decl_decl_id == dep_decl
                    || temporaries.get(&dep_decl).copied() == Some(decl_decl_id)
            })
        })
    {
        return true;
    }

    false
}

/// Check if a type is always invalidating (guaranteed to change when inputs change).
pub fn is_always_invalidating_type(ty: &Type) -> bool {
    match ty {
        Type::Object { shape_id } => {
            if let Some(id) = shape_id {
                matches!(
                    id.as_str(),
                    s if s == BUILT_IN_ARRAY_ID
                        || s == BUILT_IN_OBJECT_ID
                        || s == BUILT_IN_FUNCTION_ID
                        || s == BUILT_IN_JSX_ID
                )
            } else {
                false
            }
        }
        Type::Function { .. } => true,
        _ => false,
    }
}

/// Check if two dependency lists are equal.
fn are_equal_dependencies(
    a: &[ReactiveScopeDependency],
    b: &[ReactiveScopeDependency],
    env: &Environment,
) -> bool {
    if a.len() != b.len() {
        return false;
    }
    for a_val in a {
        let a_decl = env.identifiers[a_val.identifier.0 as usize].declaration_id;
        let found = b.iter().any(|b_val| {
            let b_decl = env.identifiers[b_val.identifier.0 as usize].declaration_id;
            a_decl == b_decl && are_equal_paths(&a_val.path, &b_val.path)
        });
        if !found {
            return false;
        }
    }
    true
}

/// Check if two dependency paths are equal.
fn are_equal_paths(a: &[DependencyPathEntry], b: &[DependencyPathEntry]) -> bool {
    a.len() == b.len()
        && a.iter()
            .zip(b.iter())
            .all(|(ai, bi)| ai.property == bi.property && ai.optional == bi.optional)
}

/// Check if a scope is eligible for merging with subsequent scopes.
fn scope_is_eligible_for_merging(scope_id: ScopeId, env: &Environment) -> bool {
    let scope = &env.scopes[scope_id.0 as usize];
    if scope.dependencies.is_empty() {
        // No dependencies means output never changes — eligible
        return true;
    }
    scope.declarations.iter().any(|(_key, decl)| {
        let ty = &env.types[env.identifiers[decl.identifier.0 as usize].type_.0 as usize];
        is_always_invalidating_type(ty)
    })
}
