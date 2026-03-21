// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

//! PruneUnusedLValues (PruneTemporaryLValues)
//!
//! Nulls out lvalues for temporary variables that are never accessed later.
//!
//! Corresponds to `src/ReactiveScopes/PruneTemporaryLValues.ts`.

use std::collections::{HashMap, HashSet};

use react_compiler_hir::{
    DeclarationId, Place, ReactiveBlock, ReactiveFunction,
    ReactiveStatement, ReactiveTerminal, ReactiveTerminalStatement,
    ReactiveValue,
    environment::Environment,
};

/// Nulls out lvalues for unnamed temporaries that are never used.
/// TS: `pruneUnusedLValues`
///
/// Uses direct recursion with env access to look up declaration_ids.
/// Two-phase approach:
/// 1. Walk the tree in visitor order, tracking unnamed lvalue DeclarationIds and
///    removing them when referenced as operands.
/// 2. Null out remaining unused lvalues.
pub fn prune_unused_lvalues(func: &mut ReactiveFunction, env: &Environment) {
    // Phase 1: Walk to identify unused unnamed lvalues.
    // We track a map of DeclarationId -> bool ("is unused").
    // When we see an unnamed lvalue, we add its DeclarationId.
    // When we see a place reference, we remove its DeclarationId.
    // The TS visitor processes instructions in order:
    //   1. traverseInstruction (visits operands via visitPlace)
    //   2. then checks if lvalue is unnamed and adds to map
    //
    // Since we can't store mutable refs, we collect the set of unused DeclarationIds,
    // then do a second pass to null them out.

    let mut unused_lvalues: HashMap<DeclarationId, ()> = HashMap::new();
    walk_block_phase1(&func.body, env, &mut unused_lvalues);

    // Phase 2: Null out lvalues whose DeclarationId is in the unused set
    if !unused_lvalues.is_empty() {
        let unused_set: HashSet<DeclarationId> = unused_lvalues.keys().copied().collect();
        walk_block_phase2(&mut func.body, env, &unused_set);
    }
}

/// Phase 1: Walk the tree in visitor order, tracking unnamed lvalue DeclarationIds.
fn walk_block_phase1(
    block: &ReactiveBlock,
    env: &Environment,
    unused: &mut HashMap<DeclarationId, ()>,
) {
    for stmt in block {
        match stmt {
            ReactiveStatement::Instruction(instr) => {
                // First traverse operands (visitPlace removes from map)
                walk_value_phase1(&instr.value, env, unused);

                // Then check unnamed lvalue (adds to map)
                if let Some(lv) = &instr.lvalue {
                    let ident = &env.identifiers[lv.identifier.0 as usize];
                    if ident.name.is_none() {
                        unused.insert(ident.declaration_id, ());
                    }
                }
            }
            ReactiveStatement::Scope(scope) => {
                walk_block_phase1(&scope.instructions, env, unused);
            }
            ReactiveStatement::PrunedScope(scope) => {
                walk_block_phase1(&scope.instructions, env, unused);
            }
            ReactiveStatement::Terminal(stmt) => {
                walk_terminal_phase1(stmt, env, unused);
            }
        }
    }
}

fn visit_place_phase1(
    place: &Place,
    env: &Environment,
    unused: &mut HashMap<DeclarationId, ()>,
) {
    let ident = &env.identifiers[place.identifier.0 as usize];
    unused.remove(&ident.declaration_id);
}

fn walk_value_phase1(
    value: &ReactiveValue,
    env: &Environment,
    unused: &mut HashMap<DeclarationId, ()>,
) {
    match value {
        ReactiveValue::Instruction(instr_value) => {
            for place in crate::visitors::each_instruction_value_operand_public(instr_value) {
                visit_place_phase1(place, env, unused);
            }
        }
        ReactiveValue::SequenceExpression {
            instructions,
            value: inner,
            ..
        } => {
            for instr in instructions {
                walk_value_phase1(&instr.value, env, unused);
                if let Some(lv) = &instr.lvalue {
                    let ident = &env.identifiers[lv.identifier.0 as usize];
                    if ident.name.is_none() {
                        unused.insert(ident.declaration_id, ());
                    }
                }
            }
            walk_value_phase1(inner, env, unused);
        }
        ReactiveValue::LogicalExpression { left, right, .. } => {
            walk_value_phase1(left, env, unused);
            walk_value_phase1(right, env, unused);
        }
        ReactiveValue::ConditionalExpression {
            test,
            consequent,
            alternate,
            ..
        } => {
            walk_value_phase1(test, env, unused);
            walk_value_phase1(consequent, env, unused);
            walk_value_phase1(alternate, env, unused);
        }
        ReactiveValue::OptionalExpression { value: inner, .. } => {
            walk_value_phase1(inner, env, unused);
        }
    }
}

fn walk_terminal_phase1(
    stmt: &ReactiveTerminalStatement,
    env: &Environment,
    unused: &mut HashMap<DeclarationId, ()>,
) {
    match &stmt.terminal {
        ReactiveTerminal::Break { .. } | ReactiveTerminal::Continue { .. } => {}
        ReactiveTerminal::Return { value, .. } => {
            visit_place_phase1(value, env, unused);
        }
        ReactiveTerminal::Throw { value, .. } => {
            visit_place_phase1(value, env, unused);
        }
        ReactiveTerminal::For {
            init,
            test,
            update,
            loop_block,
            ..
        } => {
            walk_value_phase1(init, env, unused);
            walk_value_phase1(test, env, unused);
            walk_block_phase1(loop_block, env, unused);
            if let Some(update) = update {
                walk_value_phase1(update, env, unused);
            }
        }
        ReactiveTerminal::ForOf {
            init,
            test,
            loop_block,
            ..
        } => {
            walk_value_phase1(init, env, unused);
            walk_value_phase1(test, env, unused);
            walk_block_phase1(loop_block, env, unused);
        }
        ReactiveTerminal::ForIn {
            init, loop_block, ..
        } => {
            walk_value_phase1(init, env, unused);
            walk_block_phase1(loop_block, env, unused);
        }
        ReactiveTerminal::DoWhile {
            loop_block, test, ..
        } => {
            walk_block_phase1(loop_block, env, unused);
            walk_value_phase1(test, env, unused);
        }
        ReactiveTerminal::While {
            test, loop_block, ..
        } => {
            walk_value_phase1(test, env, unused);
            walk_block_phase1(loop_block, env, unused);
        }
        ReactiveTerminal::If {
            test,
            consequent,
            alternate,
            ..
        } => {
            visit_place_phase1(test, env, unused);
            walk_block_phase1(consequent, env, unused);
            if let Some(alt) = alternate {
                walk_block_phase1(alt, env, unused);
            }
        }
        ReactiveTerminal::Switch {
            test, cases, ..
        } => {
            visit_place_phase1(test, env, unused);
            for case in cases {
                if let Some(t) = &case.test {
                    visit_place_phase1(t, env, unused);
                }
                if let Some(block) = &case.block {
                    walk_block_phase1(block, env, unused);
                }
            }
        }
        ReactiveTerminal::Label { block, .. } => {
            walk_block_phase1(block, env, unused);
        }
        ReactiveTerminal::Try {
            block,
            handler_binding,
            handler,
            ..
        } => {
            walk_block_phase1(block, env, unused);
            if let Some(binding) = handler_binding {
                visit_place_phase1(binding, env, unused);
            }
            walk_block_phase1(handler, env, unused);
        }
    }
}

/// Phase 2: Null out lvalues whose DeclarationId is in the unused set.
fn walk_block_phase2(
    block: &mut ReactiveBlock,
    env: &Environment,
    unused: &HashSet<DeclarationId>,
) {
    for stmt in block.iter_mut() {
        match stmt {
            ReactiveStatement::Instruction(instr) => {
                if let Some(lv) = &instr.lvalue {
                    let ident = &env.identifiers[lv.identifier.0 as usize];
                    if unused.contains(&ident.declaration_id) {
                        instr.lvalue = None;
                    }
                }
                walk_value_phase2(&mut instr.value, env, unused);
            }
            ReactiveStatement::Scope(scope) => {
                walk_block_phase2(&mut scope.instructions, env, unused);
            }
            ReactiveStatement::PrunedScope(scope) => {
                walk_block_phase2(&mut scope.instructions, env, unused);
            }
            ReactiveStatement::Terminal(stmt) => {
                walk_terminal_phase2(stmt, env, unused);
            }
        }
    }
}

fn walk_value_phase2(
    value: &mut ReactiveValue,
    env: &Environment,
    unused: &HashSet<DeclarationId>,
) {
    match value {
        ReactiveValue::SequenceExpression {
            instructions,
            value: inner,
            ..
        } => {
            for instr in instructions.iter_mut() {
                if let Some(lv) = &instr.lvalue {
                    let ident = &env.identifiers[lv.identifier.0 as usize];
                    if unused.contains(&ident.declaration_id) {
                        instr.lvalue = None;
                    }
                }
                walk_value_phase2(&mut instr.value, env, unused);
            }
            walk_value_phase2(inner, env, unused);
        }
        ReactiveValue::LogicalExpression { left, right, .. } => {
            walk_value_phase2(left, env, unused);
            walk_value_phase2(right, env, unused);
        }
        ReactiveValue::ConditionalExpression {
            test,
            consequent,
            alternate,
            ..
        } => {
            walk_value_phase2(test, env, unused);
            walk_value_phase2(consequent, env, unused);
            walk_value_phase2(alternate, env, unused);
        }
        ReactiveValue::OptionalExpression { value: inner, .. } => {
            walk_value_phase2(inner, env, unused);
        }
        ReactiveValue::Instruction(_) => {}
    }
}

fn walk_terminal_phase2(
    stmt: &mut ReactiveTerminalStatement,
    env: &Environment,
    unused: &HashSet<DeclarationId>,
) {
    match &mut stmt.terminal {
        ReactiveTerminal::Break { .. } | ReactiveTerminal::Continue { .. } => {}
        ReactiveTerminal::Return { .. } | ReactiveTerminal::Throw { .. } => {}
        ReactiveTerminal::For {
            loop_block,
            init,
            test,
            update,
            ..
        } => {
            walk_value_phase2(init, env, unused);
            walk_value_phase2(test, env, unused);
            walk_block_phase2(loop_block, env, unused);
            if let Some(update) = update {
                walk_value_phase2(update, env, unused);
            }
        }
        ReactiveTerminal::ForOf {
            init,
            test,
            loop_block,
            ..
        } => {
            walk_value_phase2(init, env, unused);
            walk_value_phase2(test, env, unused);
            walk_block_phase2(loop_block, env, unused);
        }
        ReactiveTerminal::ForIn {
            init, loop_block, ..
        } => {
            walk_value_phase2(init, env, unused);
            walk_block_phase2(loop_block, env, unused);
        }
        ReactiveTerminal::DoWhile {
            loop_block, test, ..
        } => {
            walk_block_phase2(loop_block, env, unused);
            walk_value_phase2(test, env, unused);
        }
        ReactiveTerminal::While {
            test, loop_block, ..
        } => {
            walk_value_phase2(test, env, unused);
            walk_block_phase2(loop_block, env, unused);
        }
        ReactiveTerminal::If {
            consequent,
            alternate,
            ..
        } => {
            walk_block_phase2(consequent, env, unused);
            if let Some(alt) = alternate {
                walk_block_phase2(alt, env, unused);
            }
        }
        ReactiveTerminal::Switch { cases, .. } => {
            for case in cases.iter_mut() {
                if let Some(block) = &mut case.block {
                    walk_block_phase2(block, env, unused);
                }
            }
        }
        ReactiveTerminal::Label { block, .. } => {
            walk_block_phase2(block, env, unused);
        }
        ReactiveTerminal::Try {
            block, handler, ..
        } => {
            walk_block_phase2(block, env, unused);
            walk_block_phase2(handler, env, unused);
        }
    }
}
