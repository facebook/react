// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

//! Visitor and transform traits for ReactiveFunction.
//!
//! Corresponds to `src/ReactiveScopes/visitors.ts` in the TypeScript compiler.

use react_compiler_hir::{
    EvaluationOrder, Place, PrunedReactiveScopeBlock, ReactiveBlock, ReactiveFunction,
    ReactiveInstruction, ReactiveStatement, ReactiveTerminal, ReactiveTerminalStatement,
    ReactiveValue, ReactiveScopeBlock,
};

// =============================================================================
// ReactiveFunctionVisitor trait
// =============================================================================

/// Visitor trait for walking a ReactiveFunction tree.
///
/// Override individual `visit_*` methods to customize behavior; call the
/// corresponding `traverse_*` to continue the default recursion.
///
/// TS: `class ReactiveFunctionVisitor<TState>`
pub trait ReactiveFunctionVisitor {
    type State;

    fn visit_id(&self, _id: EvaluationOrder, _state: &mut Self::State) {}

    fn visit_place(&self, _id: EvaluationOrder, _place: &Place, _state: &mut Self::State) {}

    fn visit_lvalue(&self, _id: EvaluationOrder, _lvalue: &Place, _state: &mut Self::State) {}

    fn visit_value(&self, id: EvaluationOrder, value: &ReactiveValue, state: &mut Self::State) {
        self.traverse_value(id, value, state);
    }

    fn traverse_value(&self, id: EvaluationOrder, value: &ReactiveValue, state: &mut Self::State) {
        match value {
            ReactiveValue::OptionalExpression { value: inner, .. } => {
                self.visit_value(id, inner, state);
            }
            ReactiveValue::LogicalExpression { left, right, .. } => {
                self.visit_value(id, left, state);
                self.visit_value(id, right, state);
            }
            ReactiveValue::ConditionalExpression {
                test,
                consequent,
                alternate,
                ..
            } => {
                self.visit_value(id, test, state);
                self.visit_value(id, consequent, state);
                self.visit_value(id, alternate, state);
            }
            ReactiveValue::SequenceExpression {
                instructions,
                id: seq_id,
                value: inner,
                ..
            } => {
                for instr in instructions {
                    self.visit_instruction(instr, state);
                }
                self.visit_value(*seq_id, inner, state);
            }
            ReactiveValue::Instruction(instr_value) => {
                for place in each_instruction_value_operand(instr_value) {
                    self.visit_place(id, place, state);
                }
            }
        }
    }

    fn visit_instruction(&self, instruction: &ReactiveInstruction, state: &mut Self::State) {
        self.traverse_instruction(instruction, state);
    }

    fn traverse_instruction(&self, instruction: &ReactiveInstruction, state: &mut Self::State) {
        self.visit_id(instruction.id, state);
        // Visit instruction-level lvalue
        if let Some(lvalue) = &instruction.lvalue {
            self.visit_lvalue(instruction.id, lvalue, state);
        }
        // Visit value-level lvalues (TS: eachInstructionValueLValue)
        for place in each_instruction_value_lvalue(&instruction.value) {
            self.visit_lvalue(instruction.id, place, state);
        }
        self.visit_value(instruction.id, &instruction.value, state);
    }

    fn visit_terminal(
        &self,
        stmt: &ReactiveTerminalStatement,
        state: &mut Self::State,
    ) {
        self.traverse_terminal(stmt, state);
    }

    fn traverse_terminal(
        &self,
        stmt: &ReactiveTerminalStatement,
        state: &mut Self::State,
    ) {
        let terminal = &stmt.terminal;
        let id = terminal_id(terminal);
        self.visit_id(id, state);
        match terminal {
            ReactiveTerminal::Break { .. } | ReactiveTerminal::Continue { .. } => {}
            ReactiveTerminal::Return { value, id, .. } => {
                self.visit_place(*id, value, state);
            }
            ReactiveTerminal::Throw { value, id, .. } => {
                self.visit_place(*id, value, state);
            }
            ReactiveTerminal::For {
                init,
                test,
                update,
                loop_block,
                id,
                ..
            } => {
                self.visit_value(*id, init, state);
                self.visit_value(*id, test, state);
                self.visit_block(loop_block, state);
                if let Some(update) = update {
                    self.visit_value(*id, update, state);
                }
            }
            ReactiveTerminal::ForOf {
                init,
                test,
                loop_block,
                id,
                ..
            } => {
                self.visit_value(*id, init, state);
                self.visit_value(*id, test, state);
                self.visit_block(loop_block, state);
            }
            ReactiveTerminal::ForIn {
                init,
                loop_block,
                id,
                ..
            } => {
                self.visit_value(*id, init, state);
                self.visit_block(loop_block, state);
            }
            ReactiveTerminal::DoWhile {
                loop_block,
                test,
                id,
                ..
            } => {
                self.visit_block(loop_block, state);
                self.visit_value(*id, test, state);
            }
            ReactiveTerminal::While {
                test,
                loop_block,
                id,
                ..
            } => {
                self.visit_value(*id, test, state);
                self.visit_block(loop_block, state);
            }
            ReactiveTerminal::If {
                test,
                consequent,
                alternate,
                id,
                ..
            } => {
                self.visit_place(*id, test, state);
                self.visit_block(consequent, state);
                if let Some(alt) = alternate {
                    self.visit_block(alt, state);
                }
            }
            ReactiveTerminal::Switch {
                test, cases, id, ..
            } => {
                self.visit_place(*id, test, state);
                for case in cases {
                    if let Some(t) = &case.test {
                        self.visit_place(*id, t, state);
                    }
                    if let Some(block) = &case.block {
                        self.visit_block(block, state);
                    }
                }
            }
            ReactiveTerminal::Label { block, .. } => {
                self.visit_block(block, state);
            }
            ReactiveTerminal::Try {
                block,
                handler_binding,
                handler,
                id,
                ..
            } => {
                self.visit_block(block, state);
                if let Some(binding) = handler_binding {
                    self.visit_place(*id, binding, state);
                }
                self.visit_block(handler, state);
            }
        }
    }

    fn visit_scope(&self, scope: &ReactiveScopeBlock, state: &mut Self::State) {
        self.traverse_scope(scope, state);
    }

    fn traverse_scope(&self, scope: &ReactiveScopeBlock, state: &mut Self::State) {
        self.visit_block(&scope.instructions, state);
    }

    fn visit_pruned_scope(
        &self,
        scope: &PrunedReactiveScopeBlock,
        state: &mut Self::State,
    ) {
        self.traverse_pruned_scope(scope, state);
    }

    fn traverse_pruned_scope(
        &self,
        scope: &PrunedReactiveScopeBlock,
        state: &mut Self::State,
    ) {
        self.visit_block(&scope.instructions, state);
    }

    fn visit_block(&self, block: &ReactiveBlock, state: &mut Self::State) {
        self.traverse_block(block, state);
    }

    fn traverse_block(&self, block: &ReactiveBlock, state: &mut Self::State) {
        for stmt in block {
            match stmt {
                ReactiveStatement::Instruction(instr) => {
                    self.visit_instruction(instr, state);
                }
                ReactiveStatement::Scope(scope) => {
                    self.visit_scope(scope, state);
                }
                ReactiveStatement::PrunedScope(scope) => {
                    self.visit_pruned_scope(scope, state);
                }
                ReactiveStatement::Terminal(terminal) => {
                    self.visit_terminal(terminal, state);
                }
            }
        }
    }
}

/// Entry point for visiting a reactive function.
/// TS: `visitReactiveFunction`
pub fn visit_reactive_function<V: ReactiveFunctionVisitor>(
    func: &ReactiveFunction,
    visitor: &V,
    state: &mut V::State,
) {
    visitor.visit_block(&func.body, state);
}

// =============================================================================
// Transformed / TransformedValue enums
// =============================================================================

/// Result of transforming a ReactiveStatement.
/// TS: `Transformed<T>`
pub enum Transformed<T> {
    Keep,
    Remove,
    Replace(T),
    ReplaceMany(Vec<T>),
}

/// Result of transforming a ReactiveValue.
/// TS: `TransformedValue`
#[allow(dead_code)]
pub enum TransformedValue {
    Keep,
    Replace(ReactiveValue),
}

// =============================================================================
// ReactiveFunctionTransform trait
// =============================================================================

/// Transform trait for modifying a ReactiveFunction tree in-place.
///
/// Extends the visitor pattern with `transform_*` methods that can modify
/// or remove statements. The `traverse_block` implementation handles applying
/// transform results to the block.
///
/// TS: `class ReactiveFunctionTransform<TState>`
pub trait ReactiveFunctionTransform {
    type State;

    fn visit_id(&mut self, _id: EvaluationOrder, _state: &mut Self::State) {}

    fn visit_place(&mut self, _id: EvaluationOrder, _place: &Place, _state: &mut Self::State) {}

    fn visit_lvalue(&mut self, _id: EvaluationOrder, _lvalue: &Place, _state: &mut Self::State) {}

    fn visit_value(
        &mut self,
        id: EvaluationOrder,
        value: &mut ReactiveValue,
        state: &mut Self::State,
    ) {
        self.traverse_value(id, value, state);
    }

    fn traverse_value(
        &mut self,
        id: EvaluationOrder,
        value: &mut ReactiveValue,
        state: &mut Self::State,
    ) {
        match value {
            ReactiveValue::OptionalExpression { value: inner, .. } => {
                self.visit_value(id, inner, state);
            }
            ReactiveValue::LogicalExpression { left, right, .. } => {
                self.visit_value(id, left, state);
                self.visit_value(id, right, state);
            }
            ReactiveValue::ConditionalExpression {
                test,
                consequent,
                alternate,
                ..
            } => {
                self.visit_value(id, test, state);
                self.visit_value(id, consequent, state);
                self.visit_value(id, alternate, state);
            }
            ReactiveValue::SequenceExpression {
                instructions,
                id: seq_id,
                value: inner,
                ..
            } => {
                let seq_id = *seq_id;
                for instr in instructions.iter_mut() {
                    self.visit_instruction(instr, state);
                }
                self.visit_value(seq_id, inner, state);
            }
            ReactiveValue::Instruction(instr_value) => {
                for place in each_instruction_value_operand(instr_value) {
                    self.visit_place(id, place, state);
                }
            }
        }
    }

    fn visit_instruction(
        &mut self,
        instruction: &mut ReactiveInstruction,
        state: &mut Self::State,
    ) {
        self.traverse_instruction(instruction, state);
    }

    fn traverse_instruction(
        &mut self,
        instruction: &mut ReactiveInstruction,
        state: &mut Self::State,
    ) {
        self.visit_id(instruction.id, state);
        if let Some(lvalue) = &instruction.lvalue {
            self.visit_lvalue(instruction.id, lvalue, state);
        }
        self.visit_value(instruction.id, &mut instruction.value, state);
    }

    fn visit_terminal(
        &mut self,
        stmt: &mut ReactiveTerminalStatement,
        state: &mut Self::State,
    ) {
        self.traverse_terminal(stmt, state);
    }

    fn traverse_terminal(
        &mut self,
        stmt: &mut ReactiveTerminalStatement,
        state: &mut Self::State,
    ) {
        let terminal = &mut stmt.terminal;
        let id = terminal_id(terminal);
        self.visit_id(id, state);
        match terminal {
            ReactiveTerminal::Break { .. } | ReactiveTerminal::Continue { .. } => {}
            ReactiveTerminal::Return { value, id, .. } => {
                self.visit_place(*id, value, state);
            }
            ReactiveTerminal::Throw { value, id, .. } => {
                self.visit_place(*id, value, state);
            }
            ReactiveTerminal::For {
                init,
                test,
                update,
                loop_block,
                id,
                ..
            } => {
                let id = *id;
                self.visit_value(id, init, state);
                self.visit_value(id, test, state);
                self.visit_block(loop_block, state);
                if let Some(update) = update {
                    self.visit_value(id, update, state);
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
                self.visit_value(id, init, state);
                self.visit_value(id, test, state);
                self.visit_block(loop_block, state);
            }
            ReactiveTerminal::ForIn {
                init,
                loop_block,
                id,
                ..
            } => {
                let id = *id;
                self.visit_value(id, init, state);
                self.visit_block(loop_block, state);
            }
            ReactiveTerminal::DoWhile {
                loop_block,
                test,
                id,
                ..
            } => {
                let id = *id;
                self.visit_block(loop_block, state);
                self.visit_value(id, test, state);
            }
            ReactiveTerminal::While {
                test,
                loop_block,
                id,
                ..
            } => {
                let id = *id;
                self.visit_value(id, test, state);
                self.visit_block(loop_block, state);
            }
            ReactiveTerminal::If {
                test,
                consequent,
                alternate,
                id,
                ..
            } => {
                self.visit_place(*id, test, state);
                self.visit_block(consequent, state);
                if let Some(alt) = alternate {
                    self.visit_block(alt, state);
                }
            }
            ReactiveTerminal::Switch {
                test, cases, id, ..
            } => {
                let id = *id;
                self.visit_place(id, test, state);
                for case in cases.iter_mut() {
                    if let Some(t) = &case.test {
                        self.visit_place(id, t, state);
                    }
                    if let Some(block) = &mut case.block {
                        self.visit_block(block, state);
                    }
                }
            }
            ReactiveTerminal::Label { block, .. } => {
                self.visit_block(block, state);
            }
            ReactiveTerminal::Try {
                block,
                handler_binding,
                handler,
                id,
                ..
            } => {
                let id = *id;
                self.visit_block(block, state);
                if let Some(binding) = handler_binding {
                    self.visit_place(id, binding, state);
                }
                self.visit_block(handler, state);
            }
        }
    }

    fn visit_scope(&mut self, scope: &mut ReactiveScopeBlock, state: &mut Self::State) {
        self.traverse_scope(scope, state);
    }

    fn traverse_scope(&mut self, scope: &mut ReactiveScopeBlock, state: &mut Self::State) {
        self.visit_block(&mut scope.instructions, state);
    }

    fn visit_pruned_scope(
        &mut self,
        scope: &mut PrunedReactiveScopeBlock,
        state: &mut Self::State,
    ) {
        self.traverse_pruned_scope(scope, state);
    }

    fn traverse_pruned_scope(
        &mut self,
        scope: &mut PrunedReactiveScopeBlock,
        state: &mut Self::State,
    ) {
        self.visit_block(&mut scope.instructions, state);
    }

    fn visit_block(&mut self, block: &mut ReactiveBlock, state: &mut Self::State) {
        self.traverse_block(block, state);
    }

    fn transform_instruction(
        &mut self,
        instruction: &mut ReactiveInstruction,
        state: &mut Self::State,
    ) -> Transformed<ReactiveStatement> {
        self.visit_instruction(instruction, state);
        Transformed::Keep
    }

    fn transform_terminal(
        &mut self,
        stmt: &mut ReactiveTerminalStatement,
        state: &mut Self::State,
    ) -> Transformed<ReactiveStatement> {
        self.visit_terminal(stmt, state);
        Transformed::Keep
    }

    fn transform_scope(
        &mut self,
        scope: &mut ReactiveScopeBlock,
        state: &mut Self::State,
    ) -> Transformed<ReactiveStatement> {
        self.visit_scope(scope, state);
        Transformed::Keep
    }

    fn transform_pruned_scope(
        &mut self,
        scope: &mut PrunedReactiveScopeBlock,
        state: &mut Self::State,
    ) -> Transformed<ReactiveStatement> {
        self.visit_pruned_scope(scope, state);
        Transformed::Keep
    }

    fn traverse_block(&mut self, block: &mut ReactiveBlock, state: &mut Self::State) {
        let mut next_block: Option<Vec<ReactiveStatement>> = None;
        let len = block.len();
        for i in 0..len {
            // Take the statement out temporarily
            let mut stmt = std::mem::replace(
                &mut block[i],
                // Placeholder — will be overwritten or discarded
                ReactiveStatement::Instruction(ReactiveInstruction {
                    id: EvaluationOrder(0),
                    lvalue: None,
                    value: ReactiveValue::Instruction(
                        react_compiler_hir::InstructionValue::Debugger { loc: None },
                    ),
                    effects: None,
                    loc: None,
                }),
            );
            let transformed = match &mut stmt {
                ReactiveStatement::Instruction(instr) => {
                    self.transform_instruction(instr, state)
                }
                ReactiveStatement::Scope(scope) => {
                    self.transform_scope(scope, state)
                }
                ReactiveStatement::PrunedScope(scope) => {
                    self.transform_pruned_scope(scope, state)
                }
                ReactiveStatement::Terminal(terminal) => {
                    self.transform_terminal(terminal, state)
                }
            };
            match transformed {
                Transformed::Keep => {
                    if let Some(ref mut nb) = next_block {
                        nb.push(stmt);
                    } else {
                        // Put it back
                        block[i] = stmt;
                    }
                }
                Transformed::Remove => {
                    if next_block.is_none() {
                        next_block = Some(block[..i].to_vec());
                    }
                }
                Transformed::Replace(replacement) => {
                    if next_block.is_none() {
                        next_block = Some(block[..i].to_vec());
                    }
                    next_block.as_mut().unwrap().push(replacement);
                }
                Transformed::ReplaceMany(replacements) => {
                    if next_block.is_none() {
                        next_block = Some(block[..i].to_vec());
                    }
                    next_block.as_mut().unwrap().extend(replacements);
                }
            }
        }
        if let Some(nb) = next_block {
            *block = nb;
        }
    }
}

/// Entry point for transforming a reactive function.
/// TS: `visitReactiveFunction` (used with transforms too)
pub fn transform_reactive_function<T: ReactiveFunctionTransform>(
    func: &mut ReactiveFunction,
    transform: &mut T,
    state: &mut T::State,
) {
    transform.visit_block(&mut func.body, state);
}

// =============================================================================
// Helper: extract terminal ID
// =============================================================================

fn terminal_id(terminal: &ReactiveTerminal) -> EvaluationOrder {
    match terminal {
        ReactiveTerminal::Break { id, .. }
        | ReactiveTerminal::Continue { id, .. }
        | ReactiveTerminal::Return { id, .. }
        | ReactiveTerminal::Throw { id, .. }
        | ReactiveTerminal::Switch { id, .. }
        | ReactiveTerminal::DoWhile { id, .. }
        | ReactiveTerminal::While { id, .. }
        | ReactiveTerminal::For { id, .. }
        | ReactiveTerminal::ForOf { id, .. }
        | ReactiveTerminal::ForIn { id, .. }
        | ReactiveTerminal::If { id, .. }
        | ReactiveTerminal::Label { id, .. }
        | ReactiveTerminal::Try { id, .. } => *id,
    }
}

// =============================================================================
// Helper: iterate operands of an InstructionValue (readonly)
// =============================================================================

/// Yields all lvalue Places from inside a ReactiveValue.
/// Corresponds to TS `eachInstructionValueLValue`.
pub fn each_instruction_value_lvalue(value: &ReactiveValue) -> Vec<&Place> {
    match value {
        ReactiveValue::Instruction(iv) => {
            each_hir_instruction_value_lvalue(iv)
        }
        _ => vec![],
    }
}

/// Yields all lvalue Places from inside an InstructionValue.
fn each_hir_instruction_value_lvalue(iv: &react_compiler_hir::InstructionValue) -> Vec<&Place> {
    use react_compiler_hir::InstructionValue::*;
    match iv {
        DeclareLocal { lvalue, .. } | StoreLocal { lvalue, .. } => {
            vec![&lvalue.place]
        }
        DeclareContext { lvalue, .. } | StoreContext { lvalue, .. } => {
            vec![&lvalue.place]
        }
        Destructure { lvalue, .. } => {
            each_pattern_operand_places(&lvalue.pattern)
        }
        PostfixUpdate { lvalue, .. } | PrefixUpdate { lvalue, .. } => {
            vec![lvalue]
        }
        _ => vec![],
    }
}

/// Yields all Place operands from a destructuring pattern.
fn each_pattern_operand_places(pattern: &react_compiler_hir::Pattern) -> Vec<&Place> {
    let mut places = Vec::new();
    match pattern {
        react_compiler_hir::Pattern::Array(arr) => {
            for item in &arr.items {
                match item {
                    react_compiler_hir::ArrayPatternElement::Place(place) => {
                        places.push(place);
                    }
                    react_compiler_hir::ArrayPatternElement::Spread(spread) => {
                        places.push(&spread.place);
                    }
                    react_compiler_hir::ArrayPatternElement::Hole => {}
                }
            }
        }
        react_compiler_hir::Pattern::Object(obj) => {
            for prop in &obj.properties {
                match prop {
                    react_compiler_hir::ObjectPropertyOrSpread::Property(p) => {
                        places.push(&p.place);
                    }
                    react_compiler_hir::ObjectPropertyOrSpread::Spread(spread) => {
                        places.push(&spread.place);
                    }
                }
            }
        }
    }
    places
}

/// Public wrapper for `each_instruction_value_operand`.
pub fn each_instruction_value_operand_public(value: &react_compiler_hir::InstructionValue) -> Vec<&Place> {
    each_instruction_value_operand(value)
}

/// Yields all Place operands (read positions) of an InstructionValue.
/// TS: `eachInstructionValueOperand`
fn each_instruction_value_operand(value: &react_compiler_hir::InstructionValue) -> Vec<&Place> {
    use react_compiler_hir::InstructionValue::*;
    let mut operands = Vec::new();
    match value {
        LoadLocal { place, .. } | LoadContext { place, .. } => {
            operands.push(place);
        }
        StoreLocal { value, .. } | StoreContext { value, .. } => {
            operands.push(value);
        }
        Destructure { value, .. } => {
            operands.push(value);
        }
        BinaryExpression { left, right, .. } => {
            operands.push(left);
            operands.push(right);
        }
        NewExpression { callee, args, .. } | CallExpression { callee, args, .. } => {
            operands.push(callee);
            for arg in args {
                match arg {
                    react_compiler_hir::PlaceOrSpread::Place(place) => operands.push(place),
                    react_compiler_hir::PlaceOrSpread::Spread(spread) => operands.push(&spread.place),
                }
            }
        }
        MethodCall {
            receiver,
            property,
            args,
            ..
        } => {
            operands.push(receiver);
            operands.push(property);
            for arg in args {
                match arg {
                    react_compiler_hir::PlaceOrSpread::Place(place) => operands.push(place),
                    react_compiler_hir::PlaceOrSpread::Spread(spread) => operands.push(&spread.place),
                }
            }
        }
        UnaryExpression { value, .. } => {
            operands.push(value);
        }
        TypeCastExpression { value, .. } => {
            operands.push(value);
        }
        JsxExpression {
            tag,
            props,
            children,
            ..
        } => {
            if let react_compiler_hir::JsxTag::Place(place) = tag {
                operands.push(place);
            }
            for prop in props {
                match prop {
                    react_compiler_hir::JsxAttribute::Attribute { place, .. } => {
                        operands.push(place);
                    }
                    react_compiler_hir::JsxAttribute::SpreadAttribute { argument, .. } => {
                        operands.push(argument);
                    }
                }
            }
            if let Some(children) = children {
                for child in children {
                    operands.push(child);
                }
            }
        }
        ObjectExpression { properties, .. } => {
            for prop in properties {
                match prop {
                    react_compiler_hir::ObjectPropertyOrSpread::Property(obj_prop) => {
                        if let react_compiler_hir::ObjectPropertyKey::Computed { name } = &obj_prop.key {
                            operands.push(name);
                        }
                        operands.push(&obj_prop.place);
                    }
                    react_compiler_hir::ObjectPropertyOrSpread::Spread(spread) => {
                        operands.push(&spread.place);
                    }
                }
            }
        }
        ArrayExpression { elements, .. } => {
            for elem in elements {
                match elem {
                    react_compiler_hir::ArrayElement::Place(place) => {
                        operands.push(place);
                    }
                    react_compiler_hir::ArrayElement::Spread(spread) => {
                        operands.push(&spread.place);
                    }
                    react_compiler_hir::ArrayElement::Hole => {}
                }
            }
        }
        JsxFragment { children, .. } => {
            for child in children {
                operands.push(child);
            }
        }
        PropertyStore { object, value, .. } => {
            operands.push(object);
            operands.push(value);
        }
        PropertyLoad { object, .. } | PropertyDelete { object, .. } => {
            operands.push(object);
        }
        ComputedStore {
            object,
            property,
            value,
            ..
        } => {
            operands.push(object);
            operands.push(property);
            operands.push(value);
        }
        ComputedLoad {
            object, property, ..
        }
        | ComputedDelete {
            object, property, ..
        } => {
            operands.push(object);
            operands.push(property);
        }
        StoreGlobal { value, .. } => {
            operands.push(value);
        }
        TaggedTemplateExpression { tag, .. } => {
            operands.push(tag);
        }
        TemplateLiteral { subexprs, .. } => {
            for expr in subexprs {
                operands.push(expr);
            }
        }
        Await { value, .. }
        | GetIterator { collection: value, .. }
        | NextPropertyOf { value, .. } => {
            operands.push(value);
        }
        IteratorNext {
            iterator,
            collection,
            ..
        } => {
            operands.push(iterator);
            operands.push(collection);
        }
        PrefixUpdate { lvalue, value, .. } | PostfixUpdate { lvalue, value, .. } => {
            operands.push(lvalue);
            operands.push(value);
        }
        FinishMemoize { decl, .. } => {
            operands.push(decl);
        }
        // These have no operands
        DeclareLocal { .. }
        | DeclareContext { .. }
        | Primitive { .. }
        | JSXText { .. }
        | RegExpLiteral { .. }
        | MetaProperty { .. }
        | LoadGlobal { .. }
        | Debugger { .. }
        | StartMemoize { .. }
        | UnsupportedNode { .. }
        | ObjectMethod { .. }
        | FunctionExpression { .. } => {}
    }
    operands
}
