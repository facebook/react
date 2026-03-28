// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

//! RenameVariables — renames variables for output, assigns unique names,
//! handles SSA renames.
//!
//! Corresponds to `src/ReactiveScopes/RenameVariables.ts`.

use std::collections::{HashMap, HashSet};

use react_compiler_hir::{
    DeclarationId, FunctionId, IdentifierId, IdentifierName, InstructionValue,
    ParamPattern, ReactiveBlock, ReactiveFunction, ReactiveInstruction, ReactiveStatement,
    ReactiveTerminal, ReactiveTerminalStatement, ReactiveValue, Terminal,
    environment::Environment,
};

// =============================================================================
// Scopes
// =============================================================================

struct Scopes {
    seen: HashMap<DeclarationId, IdentifierName>,
    stack: Vec<HashMap<String, DeclarationId>>,
    globals: HashSet<String>,
    names: HashSet<String>,
}

impl Scopes {
    fn new(globals: HashSet<String>) -> Self {
        Self {
            seen: HashMap::new(),
            stack: vec![HashMap::new()],
            globals,
            names: HashSet::new(),
        }
    }

    fn visit(&mut self, identifier_id: IdentifierId, env: &mut Environment) {
        let identifier = &env.identifiers[identifier_id.0 as usize];
        let original_name = match &identifier.name {
            Some(name) => name.clone(),
            None => return,
        };
        let declaration_id = identifier.declaration_id;

        if let Some(mapped_name) = self.seen.get(&declaration_id) {
            env.identifiers[identifier_id.0 as usize].name = Some(mapped_name.clone());
            return;
        }

        let original_value = original_name.value().to_string();
        let is_promoted = matches!(original_name, IdentifierName::Promoted(_));
        let is_promoted_temp = is_promoted && original_value.starts_with("#t");
        let is_promoted_jsx = is_promoted && original_value.starts_with("#T");

        let mut name: String;
        let mut id: u32 = 0;
        if is_promoted_temp {
            name = format!("t{}", id);
            id += 1;
        } else if is_promoted_jsx {
            name = format!("T{}", id);
            id += 1;
        } else {
            name = original_value.clone();
        }

        while self.lookup(&name).is_some() || self.globals.contains(&name) {
            if is_promoted_temp {
                name = format!("t{}", id);
                id += 1;
            } else if is_promoted_jsx {
                name = format!("T{}", id);
                id += 1;
            } else {
                name = format!("{}${}", original_value, id);
                id += 1;
            }
        }

        let identifier_name = IdentifierName::Named(name.clone());
        env.identifiers[identifier_id.0 as usize].name = Some(identifier_name.clone());
        self.seen.insert(declaration_id, identifier_name);
        self.stack.last_mut().unwrap().insert(name.clone(), declaration_id);
        self.names.insert(name);
    }

    fn lookup(&self, name: &str) -> Option<DeclarationId> {
        for scope in self.stack.iter().rev() {
            if let Some(id) = scope.get(name) {
                return Some(*id);
            }
        }
        None
    }

    fn enter(&mut self) {
        self.stack.push(HashMap::new());
    }

    fn leave(&mut self) {
        self.stack.pop();
    }
}

// =============================================================================
// Public entry point
// =============================================================================

/// Renames variables for output — assigns unique names, handles SSA renames.
/// Returns a Set of all unique variable names used.
/// TS: `renameVariables`
pub fn rename_variables(
    func: &mut ReactiveFunction,
    env: &mut Environment,
) -> HashSet<String> {
    let globals = collect_referenced_globals(&func.body, env);
    let mut scopes = Scopes::new(globals.clone());

    rename_variables_impl(func, &mut scopes, env);

    let mut result: HashSet<String> = scopes.names;
    result.extend(globals);
    result
}

fn rename_variables_impl(
    func: &mut ReactiveFunction,
    scopes: &mut Scopes,
    env: &mut Environment,
) {
    scopes.enter();
    for param in &func.params {
        let id = match param {
            ParamPattern::Place(p) => p.identifier,
            ParamPattern::Spread(s) => s.place.identifier,
        };
        scopes.visit(id, env);
    }
    visit_block(&mut func.body, scopes, env);
    scopes.leave();
}

fn visit_block(
    block: &mut ReactiveBlock,
    scopes: &mut Scopes,
    env: &mut Environment,
) {
    scopes.enter();
    visit_block_inner(block, scopes, env);
    scopes.leave();
}

/// Traverse block statements without pushing/popping a scope level.
/// Used by visit_block (which wraps with enter/leave) and for pruned scopes
/// (which should NOT push a new scope level, matching TS visitPrunedScope →
/// traverseBlock behavior).
fn visit_block_inner(
    block: &mut ReactiveBlock,
    scopes: &mut Scopes,
    env: &mut Environment,
) {
    for stmt in block.iter_mut() {
        match stmt {
            ReactiveStatement::Instruction(instr) => {
                visit_instruction(instr, scopes, env);
            }
            ReactiveStatement::Scope(scope) => {
                // Visit scope declarations first
                let scope_data = &env.scopes[scope.scope.0 as usize];
                let decl_ids: Vec<IdentifierId> = scope_data.declarations.iter()
                    .map(|(_, d)| d.identifier)
                    .collect();
                for id in decl_ids {
                    scopes.visit(id, env);
                }
                visit_block(&mut scope.instructions, scopes, env);
            }
            ReactiveStatement::PrunedScope(scope) => {
                // For pruned scopes, traverse instructions without pushing a new scope.
                // TS: visitPrunedScope calls traverseBlock (NOT visitBlock), so no
                // enter/leave. This ensures names assigned inside pruned scopes remain
                // visible in the enclosing scope, preventing name reuse.
                visit_block_inner(&mut scope.instructions, scopes, env);
            }
            ReactiveStatement::Terminal(terminal) => {
                visit_terminal(terminal, scopes, env);
            }
        }
    }
}

fn visit_instruction(
    instr: &mut ReactiveInstruction,
    scopes: &mut Scopes,
    env: &mut Environment,
) {
    // Visit instruction-level lvalue
    if let Some(lvalue) = &instr.lvalue {
        scopes.visit(lvalue.identifier, env);
    }
    // Visit value-level lvalues (TS: eachInstructionValueLValue)
    let value_lvalue_ids = each_instruction_value_lvalue(&instr.value);
    for id in value_lvalue_ids {
        scopes.visit(id, env);
    }
    visit_value(&mut instr.value, scopes, env);
}

/// Collects lvalue IdentifierIds from inside an InstructionValue.
/// Corresponds to TS `eachInstructionValueLValue`.
fn each_instruction_value_lvalue(value: &ReactiveValue) -> Vec<IdentifierId> {
    match value {
        ReactiveValue::Instruction(iv) => {
            match iv {
                InstructionValue::DeclareLocal { lvalue, .. }
                | InstructionValue::StoreLocal { lvalue, .. } => {
                    vec![lvalue.place.identifier]
                }
                InstructionValue::DeclareContext { lvalue, .. }
                | InstructionValue::StoreContext { lvalue, .. } => {
                    vec![lvalue.place.identifier]
                }
                InstructionValue::Destructure { lvalue, .. } => {
                    each_pattern_operand_ids(&lvalue.pattern)
                }
                InstructionValue::PostfixUpdate { lvalue, .. }
                | InstructionValue::PrefixUpdate { lvalue, .. } => {
                    vec![lvalue.identifier]
                }
                _ => vec![],
            }
        }
        _ => vec![],
    }
}

/// Collects IdentifierIds from a destructuring pattern.
/// Corresponds to TS `eachPatternOperand`.
fn each_pattern_operand_ids(pattern: &react_compiler_hir::Pattern) -> Vec<IdentifierId> {
    let mut ids = Vec::new();
    match pattern {
        react_compiler_hir::Pattern::Array(arr) => {
            for item in &arr.items {
                match item {
                    react_compiler_hir::ArrayPatternElement::Place(place) => {
                        ids.push(place.identifier);
                    }
                    react_compiler_hir::ArrayPatternElement::Spread(spread) => {
                        ids.push(spread.place.identifier);
                    }
                    react_compiler_hir::ArrayPatternElement::Hole => {}
                }
            }
        }
        react_compiler_hir::Pattern::Object(obj) => {
            for prop in &obj.properties {
                match prop {
                    react_compiler_hir::ObjectPropertyOrSpread::Property(p) => {
                        ids.push(p.place.identifier);
                    }
                    react_compiler_hir::ObjectPropertyOrSpread::Spread(spread) => {
                        ids.push(spread.place.identifier);
                    }
                }
            }
        }
    }
    ids
}

/// Traverses an inner HIR function, visiting params, instructions (with lvalues,
/// value-lvalues, and operands), terminal operands, and recursing into nested
/// function expressions.
/// Corresponds to TS `visitHirFunction` in the reactive visitor.
fn visit_hir_function(
    func_id: FunctionId,
    scopes: &mut Scopes,
    env: &mut Environment,
) {
    // Collect params
    let inner_func = &env.functions[func_id.0 as usize];
    let param_ids: Vec<IdentifierId> = inner_func.params.iter()
        .map(|p| match p {
            ParamPattern::Place(p) => p.identifier,
            ParamPattern::Spread(s) => s.place.identifier,
        })
        .collect();
    for id in param_ids {
        scopes.visit(id, env);
    }

    // Collect block order and instruction IDs
    let inner_func = &env.functions[func_id.0 as usize];
    let block_ids: Vec<_> = inner_func.body.blocks.keys().copied().collect();

    for block_id in block_ids {
        let inner_func = &env.functions[func_id.0 as usize];
        let block = &inner_func.body.blocks[&block_id];
        let instr_ids: Vec<_> = block.instructions.clone();
        let terminal_operand_ids = each_terminal_operand(&block.terminal);

        for instr_id in &instr_ids {
            // Collect all IDs to visit from this instruction in one pass
            let (lvalue_id, value_lvalue_ids, operand_ids, nested_func) = {
                let inner_func = &env.functions[func_id.0 as usize];
                let instr = &inner_func.instructions[instr_id.0 as usize];
                let lvalue_id = instr.lvalue.identifier;
                let value_lvalue_ids = each_hir_value_lvalue(&instr.value);
                // The canonical function already includes FunctionExpression/ObjectMethod context
                let operand_ids: Vec<IdentifierId> =
                    crate::visitors::each_instruction_value_operand_public(&instr.value, env)
                        .iter()
                        .map(|p| p.identifier)
                        .collect();
                let nested_func = match &instr.value {
                    InstructionValue::FunctionExpression { lowered_func, .. }
                    | InstructionValue::ObjectMethod { lowered_func, .. } => {
                        Some(lowered_func.func)
                    }
                    _ => None,
                };
                (lvalue_id, value_lvalue_ids, operand_ids, nested_func)
            };

            // Visit lvalue
            scopes.visit(lvalue_id, env);
            // Visit value-level lvalues
            for id in value_lvalue_ids {
                scopes.visit(id, env);
            }
            // Visit operands (includes FunctionExpression/ObjectMethod context)
            for id in operand_ids {
                scopes.visit(id, env);
            }
            // Recurse into inner functions
            if let Some(nested_func_id) = nested_func {
                visit_hir_function(nested_func_id, scopes, env);
            }
        }

        // Visit terminal operands
        for id in terminal_operand_ids {
            scopes.visit(id, env);
        }
    }
}

/// Collects lvalue IdentifierIds from inside an HIR InstructionValue.
fn each_hir_value_lvalue(value: &InstructionValue) -> Vec<IdentifierId> {
    match value {
        InstructionValue::DeclareLocal { lvalue, .. }
        | InstructionValue::StoreLocal { lvalue, .. } => {
            vec![lvalue.place.identifier]
        }
        InstructionValue::DeclareContext { lvalue, .. }
        | InstructionValue::StoreContext { lvalue, .. } => {
            vec![lvalue.place.identifier]
        }
        InstructionValue::Destructure { lvalue, .. } => {
            each_pattern_operand_ids(&lvalue.pattern)
        }
        InstructionValue::PostfixUpdate { lvalue, .. }
        | InstructionValue::PrefixUpdate { lvalue, .. } => {
            vec![lvalue.identifier]
        }
        _ => vec![],
    }
}

/// Collects operand IdentifierIds from an HIR terminal.
/// Corresponds to TS `eachTerminalOperand`.
fn each_terminal_operand(terminal: &Terminal) -> Vec<IdentifierId> {
    match terminal {
        Terminal::If { test, .. } | Terminal::Branch { test, .. } => {
            vec![test.identifier]
        }
        Terminal::Switch { test, cases, .. } => {
            let mut ids = vec![test.identifier];
            for case in cases {
                if let Some(t) = &case.test {
                    ids.push(t.identifier);
                }
            }
            ids
        }
        Terminal::Return { value, .. } | Terminal::Throw { value, .. } => {
            vec![value.identifier]
        }
        Terminal::Try { handler_binding, .. } => {
            if let Some(binding) = handler_binding {
                vec![binding.identifier]
            } else {
                vec![]
            }
        }
        _ => vec![],
    }
}

fn visit_value(
    value: &mut ReactiveValue,
    scopes: &mut Scopes,
    env: &mut Environment,
) {
    match value {
        ReactiveValue::Instruction(iv) => {
            // Visit operands (canonical function includes FunctionExpression/ObjectMethod context)
            let operand_ids: Vec<IdentifierId> =
                crate::visitors::each_instruction_value_operand_public(iv, env)
                    .iter()
                    .map(|p| p.identifier)
                    .collect();
            for id in operand_ids {
                scopes.visit(id, env);
            }
            // Visit inner functions (TS: visitHirFunction)
            match iv {
                InstructionValue::FunctionExpression { lowered_func, .. }
                | InstructionValue::ObjectMethod { lowered_func, .. } => {
                    visit_hir_function(lowered_func.func, scopes, env);
                }
                _ => {}
            }
        }
        ReactiveValue::SequenceExpression { instructions, value: inner, .. } => {
            for instr in instructions.iter_mut() {
                visit_instruction(instr, scopes, env);
            }
            visit_value(inner, scopes, env);
        }
        ReactiveValue::ConditionalExpression { test, consequent, alternate, .. } => {
            visit_value(test, scopes, env);
            visit_value(consequent, scopes, env);
            visit_value(alternate, scopes, env);
        }
        ReactiveValue::LogicalExpression { left, right, .. } => {
            visit_value(left, scopes, env);
            visit_value(right, scopes, env);
        }
        ReactiveValue::OptionalExpression { value: inner, .. } => {
            visit_value(inner, scopes, env);
        }
    }
}

fn visit_terminal(
    stmt: &mut ReactiveTerminalStatement,
    scopes: &mut Scopes,
    env: &mut Environment,
) {
    match &mut stmt.terminal {
        ReactiveTerminal::Break { .. } | ReactiveTerminal::Continue { .. } => {}
        ReactiveTerminal::Return { value, .. } | ReactiveTerminal::Throw { value, .. } => {
            scopes.visit(value.identifier, env);
        }
        ReactiveTerminal::For { init, test, update, loop_block, .. } => {
            visit_value(init, scopes, env);
            visit_value(test, scopes, env);
            visit_block(loop_block, scopes, env);
            if let Some(update) = update {
                visit_value(update, scopes, env);
            }
        }
        ReactiveTerminal::ForOf { init, test, loop_block, .. } => {
            visit_value(init, scopes, env);
            visit_value(test, scopes, env);
            visit_block(loop_block, scopes, env);
        }
        ReactiveTerminal::ForIn { init, loop_block, .. } => {
            visit_value(init, scopes, env);
            visit_block(loop_block, scopes, env);
        }
        ReactiveTerminal::DoWhile { loop_block, test, .. } => {
            visit_block(loop_block, scopes, env);
            visit_value(test, scopes, env);
        }
        ReactiveTerminal::While { test, loop_block, .. } => {
            visit_value(test, scopes, env);
            visit_block(loop_block, scopes, env);
        }
        ReactiveTerminal::If { test, consequent, alternate, .. } => {
            scopes.visit(test.identifier, env);
            visit_block(consequent, scopes, env);
            if let Some(alt) = alternate {
                visit_block(alt, scopes, env);
            }
        }
        ReactiveTerminal::Switch { test, cases, .. } => {
            scopes.visit(test.identifier, env);
            for case in cases.iter_mut() {
                if let Some(t) = &case.test {
                    scopes.visit(t.identifier, env);
                }
                if let Some(block) = &mut case.block {
                    visit_block(block, scopes, env);
                }
            }
        }
        ReactiveTerminal::Label { block, .. } => {
            visit_block(block, scopes, env);
        }
        ReactiveTerminal::Try { block, handler_binding, handler, .. } => {
            visit_block(block, scopes, env);
            if let Some(binding) = handler_binding {
                scopes.visit(binding.identifier, env);
            }
            visit_block(handler, scopes, env);
        }
    }
}

// =============================================================================
// CollectReferencedGlobals
// =============================================================================

/// Collects all globally referenced names from the reactive function.
/// TS: `collectReferencedGlobals`
fn collect_referenced_globals(block: &ReactiveBlock, env: &Environment) -> HashSet<String> {
    let mut globals = HashSet::new();
    collect_globals_block(block, &mut globals, env);
    globals
}

fn collect_globals_block(
    block: &ReactiveBlock,
    globals: &mut HashSet<String>,
    env: &Environment,
) {
    for stmt in block {
        match stmt {
            ReactiveStatement::Instruction(instr) => {
                collect_globals_value(&instr.value, globals, env);
            }
            ReactiveStatement::Scope(scope) => {
                collect_globals_block(&scope.instructions, globals, env);
            }
            ReactiveStatement::PrunedScope(scope) => {
                collect_globals_block(&scope.instructions, globals, env);
            }
            ReactiveStatement::Terminal(terminal) => {
                collect_globals_terminal(terminal, globals, env);
            }
        }
    }
}

fn collect_globals_value(
    value: &ReactiveValue,
    globals: &mut HashSet<String>,
    env: &Environment,
) {
    match value {
        ReactiveValue::Instruction(iv) => {
            if let InstructionValue::LoadGlobal { binding, .. } = iv {
                globals.insert(binding.name().to_string());
            }
            // Visit inner functions
            match iv {
                InstructionValue::FunctionExpression { lowered_func, .. }
                | InstructionValue::ObjectMethod { lowered_func, .. } => {
                    collect_globals_hir_function(lowered_func.func, globals, env);
                }
                _ => {}
            }
        }
        ReactiveValue::SequenceExpression { instructions, value: inner, .. } => {
            for instr in instructions {
                collect_globals_value(&instr.value, globals, env);
            }
            collect_globals_value(inner, globals, env);
        }
        ReactiveValue::ConditionalExpression { test, consequent, alternate, .. } => {
            collect_globals_value(test, globals, env);
            collect_globals_value(consequent, globals, env);
            collect_globals_value(alternate, globals, env);
        }
        ReactiveValue::LogicalExpression { left, right, .. } => {
            collect_globals_value(left, globals, env);
            collect_globals_value(right, globals, env);
        }
        ReactiveValue::OptionalExpression { value: inner, .. } => {
            collect_globals_value(inner, globals, env);
        }
    }
}

/// Recursively collects LoadGlobal names from an inner HIR function.
fn collect_globals_hir_function(
    func_id: FunctionId,
    globals: &mut HashSet<String>,
    env: &Environment,
) {
    let inner_func = &env.functions[func_id.0 as usize];
    let block_ids: Vec<_> = inner_func.body.blocks.keys().copied().collect();
    for block_id in block_ids {
        let inner_func = &env.functions[func_id.0 as usize];
        let block = &inner_func.body.blocks[&block_id];
        for instr_id in &block.instructions {
            let instr = &inner_func.instructions[instr_id.0 as usize];
            if let InstructionValue::LoadGlobal { binding, .. } = &instr.value {
                globals.insert(binding.name().to_string());
            }
            // Recurse into nested function expressions
            match &instr.value {
                InstructionValue::FunctionExpression { lowered_func, .. }
                | InstructionValue::ObjectMethod { lowered_func, .. } => {
                    collect_globals_hir_function(lowered_func.func, globals, env);
                }
                _ => {}
            }
        }
    }
}

fn collect_globals_terminal(
    stmt: &ReactiveTerminalStatement,
    globals: &mut HashSet<String>,
    env: &Environment,
) {
    match &stmt.terminal {
        ReactiveTerminal::Break { .. } | ReactiveTerminal::Continue { .. } => {}
        ReactiveTerminal::Return { .. } | ReactiveTerminal::Throw { .. } => {}
        ReactiveTerminal::For { init, test, update, loop_block, .. } => {
            collect_globals_value(init, globals, env);
            collect_globals_value(test, globals, env);
            collect_globals_block(loop_block, globals, env);
            if let Some(update) = update {
                collect_globals_value(update, globals, env);
            }
        }
        ReactiveTerminal::ForOf { init, test, loop_block, .. } => {
            collect_globals_value(init, globals, env);
            collect_globals_value(test, globals, env);
            collect_globals_block(loop_block, globals, env);
        }
        ReactiveTerminal::ForIn { init, loop_block, .. } => {
            collect_globals_value(init, globals, env);
            collect_globals_block(loop_block, globals, env);
        }
        ReactiveTerminal::DoWhile { loop_block, test, .. } => {
            collect_globals_block(loop_block, globals, env);
            collect_globals_value(test, globals, env);
        }
        ReactiveTerminal::While { test, loop_block, .. } => {
            collect_globals_value(test, globals, env);
            collect_globals_block(loop_block, globals, env);
        }
        ReactiveTerminal::If { consequent, alternate, .. } => {
            collect_globals_block(consequent, globals, env);
            if let Some(alt) = alternate {
                collect_globals_block(alt, globals, env);
            }
        }
        ReactiveTerminal::Switch { cases, .. } => {
            for case in cases {
                if let Some(block) = &case.block {
                    collect_globals_block(block, globals, env);
                }
            }
        }
        ReactiveTerminal::Label { block, .. } => {
            collect_globals_block(block, globals, env);
        }
        ReactiveTerminal::Try { block, handler, .. } => {
            collect_globals_block(block, globals, env);
            collect_globals_block(handler, globals, env);
        }
    }
}
