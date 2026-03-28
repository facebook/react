// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

//! StabilizeBlockIds
//!
//! Rewrites block IDs to sequential values so that the output is deterministic
//! regardless of the order in which blocks were created.
//!
//! Corresponds to `src/ReactiveScopes/StabilizeBlockIds.ts`.

use std::collections::HashMap;

use indexmap::IndexSet;
use react_compiler_hir::{
    BlockId, ReactiveBlock, ReactiveFunction,
    ReactiveStatement, ReactiveTerminal, ReactiveTerminalStatement, ReactiveValue,
    ReactiveScopeBlock,
    environment::Environment,
};

use crate::visitors::{ReactiveFunctionVisitor, visit_reactive_function};

/// Rewrites block IDs to sequential values.
/// TS: `stabilizeBlockIds`
pub fn stabilize_block_ids(func: &mut ReactiveFunction, env: &mut Environment) {
    // Pass 1: Collect referenced labels (preserving insertion order to match TS Set behavior)
    let mut referenced: IndexSet<BlockId> = IndexSet::new();
    let collector = CollectReferencedLabels { env: &*env };
    visit_reactive_function(func, &collector, &mut referenced);

    // Build mappings: referenced block IDs -> sequential IDs (insertion-order deterministic)
    let mut mappings: HashMap<BlockId, BlockId> = HashMap::new();
    for block_id in &referenced {
        let len = mappings.len() as u32;
        mappings.entry(*block_id).or_insert(BlockId(len));
    }

    // Pass 2: Rewrite block IDs using direct recursion (need mutable access)
    rewrite_block(&mut func.body, &mut mappings, env);
}

// =============================================================================
// Pass 1: CollectReferencedLabels
// =============================================================================

struct CollectReferencedLabels<'a> {
    env: &'a Environment,
}

impl<'a> ReactiveFunctionVisitor for CollectReferencedLabels<'a> {
    type State = IndexSet<BlockId>;

    fn env(&self) -> &Environment { self.env }

    fn visit_scope(
        &self,
        scope: &ReactiveScopeBlock,
        state: &mut Self::State,
    ) {
        let scope_data = &self.env.scopes[scope.scope.0 as usize];
        if let Some(ref early_return) = scope_data.early_return_value {
            state.insert(early_return.label);
        }
        self.traverse_scope(scope, state);
    }

    fn visit_terminal(
        &self,
        stmt: &ReactiveTerminalStatement,
        state: &mut Self::State,
    ) {
        if let Some(ref label) = stmt.label {
            if !label.implicit {
                state.insert(label.id);
            }
        }
        self.traverse_terminal(stmt, state);
    }
}

// =============================================================================
// Pass 2: Rewrite block IDs
// =============================================================================

fn get_or_insert_mapping(mappings: &mut HashMap<BlockId, BlockId>, id: BlockId) -> BlockId {
    let len = mappings.len() as u32;
    *mappings.entry(id).or_insert(BlockId(len))
}

fn rewrite_block(
    block: &mut ReactiveBlock,
    mappings: &mut HashMap<BlockId, BlockId>,
    env: &mut Environment,
) {
    for stmt in block.iter_mut() {
        match stmt {
            ReactiveStatement::Instruction(instr) => {
                rewrite_value(&mut instr.value, mappings, env);
            }
            ReactiveStatement::Scope(scope) => {
                rewrite_scope(scope, mappings, env);
            }
            ReactiveStatement::PrunedScope(scope) => {
                rewrite_block(&mut scope.instructions, mappings, env);
            }
            ReactiveStatement::Terminal(stmt) => {
                rewrite_terminal(stmt, mappings, env);
            }
        }
    }
}

fn rewrite_scope(
    scope: &mut ReactiveScopeBlock,
    mappings: &mut HashMap<BlockId, BlockId>,
    env: &mut Environment,
) {
    let scope_data = &mut env.scopes[scope.scope.0 as usize];
    if let Some(ref mut early_return) = scope_data.early_return_value {
        early_return.label = get_or_insert_mapping(mappings, early_return.label);
    }
    rewrite_block(&mut scope.instructions, mappings, env);
}

fn rewrite_terminal(
    stmt: &mut ReactiveTerminalStatement,
    mappings: &mut HashMap<BlockId, BlockId>,
    env: &mut Environment,
) {
    if let Some(ref mut label) = stmt.label {
        label.id = get_or_insert_mapping(mappings, label.id);
    }

    match &mut stmt.terminal {
        ReactiveTerminal::Break { target, .. } | ReactiveTerminal::Continue { target, .. } => {
            *target = get_or_insert_mapping(mappings, *target);
        }
        ReactiveTerminal::For {
            init,
            test,
            update,
            loop_block,
            ..
        } => {
            rewrite_value(init, mappings, env);
            rewrite_value(test, mappings, env);
            rewrite_block(loop_block, mappings, env);
            if let Some(update) = update {
                rewrite_value(update, mappings, env);
            }
        }
        ReactiveTerminal::ForOf {
            init,
            test,
            loop_block,
            ..
        } => {
            rewrite_value(init, mappings, env);
            rewrite_value(test, mappings, env);
            rewrite_block(loop_block, mappings, env);
        }
        ReactiveTerminal::ForIn {
            init, loop_block, ..
        } => {
            rewrite_value(init, mappings, env);
            rewrite_block(loop_block, mappings, env);
        }
        ReactiveTerminal::DoWhile {
            loop_block, test, ..
        } => {
            rewrite_block(loop_block, mappings, env);
            rewrite_value(test, mappings, env);
        }
        ReactiveTerminal::While {
            test, loop_block, ..
        } => {
            rewrite_value(test, mappings, env);
            rewrite_block(loop_block, mappings, env);
        }
        ReactiveTerminal::If {
            consequent,
            alternate,
            ..
        } => {
            rewrite_block(consequent, mappings, env);
            if let Some(alt) = alternate {
                rewrite_block(alt, mappings, env);
            }
        }
        ReactiveTerminal::Switch { cases, .. } => {
            for case in cases.iter_mut() {
                if let Some(block) = &mut case.block {
                    rewrite_block(block, mappings, env);
                }
            }
        }
        ReactiveTerminal::Label { block, .. } => {
            rewrite_block(block, mappings, env);
        }
        ReactiveTerminal::Try {
            block, handler, ..
        } => {
            rewrite_block(block, mappings, env);
            rewrite_block(handler, mappings, env);
        }
        ReactiveTerminal::Return { .. } | ReactiveTerminal::Throw { .. } => {}
    }
}

fn rewrite_value(
    value: &mut ReactiveValue,
    mappings: &mut HashMap<BlockId, BlockId>,
    env: &mut Environment,
) {
    match value {
        ReactiveValue::SequenceExpression {
            instructions,
            value: inner,
            ..
        } => {
            for instr in instructions.iter_mut() {
                rewrite_value(&mut instr.value, mappings, env);
            }
            rewrite_value(inner, mappings, env);
        }
        ReactiveValue::LogicalExpression { left, right, .. } => {
            rewrite_value(left, mappings, env);
            rewrite_value(right, mappings, env);
        }
        ReactiveValue::ConditionalExpression {
            test,
            consequent,
            alternate,
            ..
        } => {
            rewrite_value(test, mappings, env);
            rewrite_value(consequent, mappings, env);
            rewrite_value(alternate, mappings, env);
        }
        ReactiveValue::OptionalExpression { value: inner, .. } => {
            rewrite_value(inner, mappings, env);
        }
        ReactiveValue::Instruction(_) => {}
    }
}
