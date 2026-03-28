// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

//! PruneNonReactiveDependencies + CollectReactiveIdentifiers
//!
//! Corresponds to `src/ReactiveScopes/PruneNonReactiveDependencies.ts`
//! and `src/ReactiveScopes/CollectReactiveIdentifiers.ts`.

use std::collections::HashSet;

use react_compiler_hir::{
    EvaluationOrder, IdentifierId, InstructionValue, Place, PrunedReactiveScopeBlock,
    ReactiveBlock, ReactiveFunction, ReactiveInstruction, ReactiveStatement, ReactiveTerminal,
    ReactiveTerminalStatement, ReactiveValue, ReactiveScopeBlock,
    environment::Environment, is_primitive_type, is_use_ref_type, object_shape,
};

use crate::visitors::ReactiveFunctionVisitor;

// =============================================================================
// CollectReactiveIdentifiers
// =============================================================================

/// Collects identifiers that are reactive.
/// TS: `collectReactiveIdentifiers`
pub fn collect_reactive_identifiers(
    func: &ReactiveFunction,
    env: &Environment,
) -> HashSet<IdentifierId> {
    let visitor = CollectVisitor { env };
    let mut state = HashSet::new();
    crate::visitors::visit_reactive_function(func, &visitor, &mut state);
    state
}

struct CollectVisitor<'a> {
    env: &'a Environment,
}

impl<'a> ReactiveFunctionVisitor for CollectVisitor<'a> {
    type State = HashSet<IdentifierId>;

    fn env(&self) -> &Environment {
        self.env
    }

    fn visit_lvalue(&self, id: EvaluationOrder, lvalue: &Place, state: &mut Self::State) {
        // Visitors don't visit lvalues as places by default, but we want to visit all places
        self.visit_place(id, lvalue, state);
    }

    fn visit_place(&self, _id: EvaluationOrder, place: &Place, state: &mut Self::State) {
        if place.reactive {
            state.insert(place.identifier);
        }
    }

    fn visit_pruned_scope(
        &self,
        scope: &PrunedReactiveScopeBlock,
        state: &mut Self::State,
    ) {
        self.traverse_pruned_scope(scope, state);

        let scope_data = &self.env.scopes[scope.scope.0 as usize];
        for (_id, decl) in &scope_data.declarations {
            let identifier = &self.env.identifiers[decl.identifier.0 as usize];
            let ty = &self.env.types[identifier.type_.0 as usize];
            if !is_primitive_type(ty) && !is_stable_ref_type(ty, state, identifier.id) {
                state.insert(*_id);
            }
        }
    }
}

/// TS: `isStableRefType`
fn is_stable_ref_type(
    ty: &react_compiler_hir::Type,
    reactive_identifiers: &HashSet<IdentifierId>,
    id: IdentifierId,
) -> bool {
    is_use_ref_type(ty) && !reactive_identifiers.contains(&id)
}

// =============================================================================
// isStableType (ported from HIR.ts)
// =============================================================================

/// TS: `isStableType`
fn is_stable_type(ty: &react_compiler_hir::Type) -> bool {
    is_set_state_type(ty)
        || is_set_action_state_type(ty)
        || is_dispatcher_type(ty)
        || is_use_ref_type(ty)
        || is_start_transition_type(ty)
        || is_set_optimistic_type(ty)
}

fn is_set_state_type(ty: &react_compiler_hir::Type) -> bool {
    matches!(ty, react_compiler_hir::Type::Function { shape_id: Some(id), .. } if id == object_shape::BUILT_IN_SET_STATE_ID)
}

fn is_set_action_state_type(ty: &react_compiler_hir::Type) -> bool {
    matches!(ty, react_compiler_hir::Type::Function { shape_id: Some(id), .. } if id == object_shape::BUILT_IN_SET_ACTION_STATE_ID)
}

fn is_dispatcher_type(ty: &react_compiler_hir::Type) -> bool {
    matches!(ty, react_compiler_hir::Type::Function { shape_id: Some(id), .. } if id == object_shape::BUILT_IN_DISPATCH_ID)
}

fn is_start_transition_type(ty: &react_compiler_hir::Type) -> bool {
    matches!(ty, react_compiler_hir::Type::Function { shape_id: Some(id), .. } if id == object_shape::BUILT_IN_START_TRANSITION_ID)
}

fn is_set_optimistic_type(ty: &react_compiler_hir::Type) -> bool {
    matches!(ty, react_compiler_hir::Type::Function { shape_id: Some(id), .. } if id == object_shape::BUILT_IN_SET_OPTIMISTIC_ID)
}

// =============================================================================
// eachPatternOperand helper
// =============================================================================

/// Yields all Place operands from a destructuring pattern.
/// TS: `eachPatternOperand`
fn each_pattern_operand(pattern: &react_compiler_hir::Pattern) -> Vec<&Place> {
    let mut operands = Vec::new();
    match pattern {
        react_compiler_hir::Pattern::Array(array_pat) => {
            for item in &array_pat.items {
                match item {
                    react_compiler_hir::ArrayPatternElement::Place(place) => {
                        operands.push(place);
                    }
                    react_compiler_hir::ArrayPatternElement::Spread(spread) => {
                        operands.push(&spread.place);
                    }
                    react_compiler_hir::ArrayPatternElement::Hole => {}
                }
            }
        }
        react_compiler_hir::Pattern::Object(obj_pat) => {
            for prop in &obj_pat.properties {
                match prop {
                    react_compiler_hir::ObjectPropertyOrSpread::Property(p) => {
                        operands.push(&p.place);
                    }
                    react_compiler_hir::ObjectPropertyOrSpread::Spread(spread) => {
                        operands.push(&spread.place);
                    }
                }
            }
        }
    }
    operands
}

// =============================================================================
// PruneNonReactiveDependencies
// =============================================================================

/// Prunes dependencies that are guaranteed to be non-reactive.
/// TS: `pruneNonReactiveDependencies`
pub fn prune_non_reactive_dependencies(func: &mut ReactiveFunction, env: &mut Environment) {
    let mut reactive_ids = collect_reactive_identifiers(func, env);
    // Use direct recursion since we need to mutate both the reactive_ids set and env.scopes
    visit_block_for_prune(&mut func.body, &mut reactive_ids, env);
}

fn visit_block_for_prune(
    block: &mut ReactiveBlock,
    reactive_ids: &mut HashSet<IdentifierId>,
    env: &mut Environment,
) {
    for stmt in block.iter_mut() {
        match stmt {
            ReactiveStatement::Instruction(instr) => {
                visit_instruction_for_prune(instr, reactive_ids, env);
            }
            ReactiveStatement::Scope(scope) => {
                visit_scope_for_prune(scope, reactive_ids, env);
            }
            ReactiveStatement::PrunedScope(scope) => {
                visit_block_for_prune(&mut scope.instructions, reactive_ids, env);
            }
            ReactiveStatement::Terminal(stmt) => {
                visit_terminal_for_prune(stmt, reactive_ids, env);
            }
        }
    }
}

fn visit_instruction_for_prune(
    instruction: &mut ReactiveInstruction,
    reactive_ids: &mut HashSet<IdentifierId>,
    env: &mut Environment,
) {
    // First traverse the value (for nested values like SequenceExpression)
    visit_value_for_prune(&mut instruction.value, instruction.id, reactive_ids, env);

    let lvalue = &instruction.lvalue;
    match &instruction.value {
        ReactiveValue::Instruction(InstructionValue::LoadLocal { place, .. }) => {
            if let Some(lv) = lvalue {
                if reactive_ids.contains(&place.identifier) {
                    reactive_ids.insert(lv.identifier);
                }
            }
        }
        ReactiveValue::Instruction(InstructionValue::StoreLocal {
            value: store_value,
            lvalue: store_lvalue,
            ..
        }) => {
            if reactive_ids.contains(&store_value.identifier) {
                reactive_ids.insert(store_lvalue.place.identifier);
                if let Some(lv) = lvalue {
                    reactive_ids.insert(lv.identifier);
                }
            }
        }
        ReactiveValue::Instruction(InstructionValue::Destructure {
            value: destr_value,
            lvalue: destr_lvalue,
            ..
        }) => {
            if reactive_ids.contains(&destr_value.identifier) {
                for operand in each_pattern_operand(&destr_lvalue.pattern) {
                    let ident = &env.identifiers[operand.identifier.0 as usize];
                    let ty = &env.types[ident.type_.0 as usize];
                    if is_stable_type(ty) {
                        continue;
                    }
                    reactive_ids.insert(operand.identifier);
                }
                if let Some(lv) = lvalue {
                    reactive_ids.insert(lv.identifier);
                }
            }
        }
        ReactiveValue::Instruction(InstructionValue::PropertyLoad { object, .. }) => {
            if let Some(lv) = lvalue {
                let ident = &env.identifiers[lv.identifier.0 as usize];
                let ty = &env.types[ident.type_.0 as usize];
                if reactive_ids.contains(&object.identifier) && !is_stable_type(ty) {
                    reactive_ids.insert(lv.identifier);
                }
            }
        }
        ReactiveValue::Instruction(InstructionValue::ComputedLoad {
            object, property, ..
        }) => {
            if let Some(lv) = lvalue {
                if reactive_ids.contains(&object.identifier)
                    || reactive_ids.contains(&property.identifier)
                {
                    reactive_ids.insert(lv.identifier);
                }
            }
        }
        _ => {}
    }
}

fn visit_value_for_prune(
    value: &mut ReactiveValue,
    id: EvaluationOrder,
    reactive_ids: &mut HashSet<IdentifierId>,
    env: &mut Environment,
) {
    match value {
        ReactiveValue::SequenceExpression {
            instructions,
            id: seq_id,
            value: inner,
            ..
        } => {
            let seq_id = *seq_id;
            for instr in instructions.iter_mut() {
                visit_instruction_for_prune(instr, reactive_ids, env);
            }
            visit_value_for_prune(inner, seq_id, reactive_ids, env);
        }
        ReactiveValue::LogicalExpression { left, right, .. } => {
            visit_value_for_prune(left, id, reactive_ids, env);
            visit_value_for_prune(right, id, reactive_ids, env);
        }
        ReactiveValue::ConditionalExpression {
            test,
            consequent,
            alternate,
            ..
        } => {
            visit_value_for_prune(test, id, reactive_ids, env);
            visit_value_for_prune(consequent, id, reactive_ids, env);
            visit_value_for_prune(alternate, id, reactive_ids, env);
        }
        ReactiveValue::OptionalExpression { value: inner, .. } => {
            visit_value_for_prune(inner, id, reactive_ids, env);
        }
        ReactiveValue::Instruction(_) => {
            // leaf — no recursion needed for operands in this pass
        }
    }
}

fn visit_scope_for_prune(
    scope: &mut ReactiveScopeBlock,
    reactive_ids: &mut HashSet<IdentifierId>,
    env: &mut Environment,
) {
    visit_block_for_prune(&mut scope.instructions, reactive_ids, env);

    let scope_id = scope.scope;
    let scope_data = &mut env.scopes[scope_id.0 as usize];

    // Remove non-reactive dependencies
    scope_data
        .dependencies
        .retain(|dep| reactive_ids.contains(&dep.identifier));

    // If any deps remain, mark all declarations and reassignments as reactive
    if !scope_data.dependencies.is_empty() {
        let decl_ids: Vec<IdentifierId> = scope_data
            .declarations
            .iter()
            .map(|(_, decl)| decl.identifier)
            .collect();
        for id in decl_ids {
            reactive_ids.insert(id);
        }
        let reassign_ids: Vec<IdentifierId> = scope_data.reassignments.clone();
        for id in reassign_ids {
            reactive_ids.insert(id);
        }
    }
}

fn visit_terminal_for_prune(
    stmt: &mut ReactiveTerminalStatement,
    reactive_ids: &mut HashSet<IdentifierId>,
    env: &mut Environment,
) {
    match &mut stmt.terminal {
        ReactiveTerminal::Break { .. } | ReactiveTerminal::Continue { .. } => {}
        ReactiveTerminal::Return { .. } | ReactiveTerminal::Throw { .. } => {}
        ReactiveTerminal::For {
            init,
            test,
            update,
            loop_block,
            id,
            ..
        } => {
            let id = *id;
            visit_value_for_prune(init, id, reactive_ids, env);
            visit_value_for_prune(test, id, reactive_ids, env);
            visit_block_for_prune(loop_block, reactive_ids, env);
            if let Some(update) = update {
                visit_value_for_prune(update, id, reactive_ids, env);
            }
        }
        ReactiveTerminal::ForOf {
            init,
            test,
            loop_block,
            id,
            ..
        } => {
            let id = *id;
            visit_value_for_prune(init, id, reactive_ids, env);
            visit_value_for_prune(test, id, reactive_ids, env);
            visit_block_for_prune(loop_block, reactive_ids, env);
        }
        ReactiveTerminal::ForIn {
            init,
            loop_block,
            id,
            ..
        } => {
            let id = *id;
            visit_value_for_prune(init, id, reactive_ids, env);
            visit_block_for_prune(loop_block, reactive_ids, env);
        }
        ReactiveTerminal::DoWhile {
            loop_block,
            test,
            id,
            ..
        } => {
            let id = *id;
            visit_block_for_prune(loop_block, reactive_ids, env);
            visit_value_for_prune(test, id, reactive_ids, env);
        }
        ReactiveTerminal::While {
            test,
            loop_block,
            id,
            ..
        } => {
            let id = *id;
            visit_value_for_prune(test, id, reactive_ids, env);
            visit_block_for_prune(loop_block, reactive_ids, env);
        }
        ReactiveTerminal::If {
            consequent,
            alternate,
            ..
        } => {
            visit_block_for_prune(consequent, reactive_ids, env);
            if let Some(alt) = alternate {
                visit_block_for_prune(alt, reactive_ids, env);
            }
        }
        ReactiveTerminal::Switch { cases, .. } => {
            for case in cases.iter_mut() {
                if let Some(block) = &mut case.block {
                    visit_block_for_prune(block, reactive_ids, env);
                }
            }
        }
        ReactiveTerminal::Label { block, .. } => {
            visit_block_for_prune(block, reactive_ids, env);
        }
        ReactiveTerminal::Try {
            block, handler, ..
        } => {
            visit_block_for_prune(block, reactive_ids, env);
            visit_block_for_prune(handler, reactive_ids, env);
        }
    }
}
