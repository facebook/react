/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

use std::collections::HashMap;

use react_diagnostics::Diagnostic;
use react_estree::{BinaryOperator, JsValue};
use react_hir::{
    initialize_hir, merge_consecutive_blocks, BlockKind, Environment, Function, GotoKind,
    GotoTerminal, IdentifierId, InstructionValue, LoadGlobal, Primitive, TerminalValue,
};
use react_ssa::eliminate_redundant_phis;

pub fn constant_propagation(env: &Environment, fun: &mut Function) -> Result<(), Diagnostic> {
    let mut constants = Constants::default();
    constant_propagation_impl(env, fun, &mut constants)
}

fn constant_propagation_impl(
    env: &Environment,
    fun: &mut Function,
    constants: &mut Constants,
) -> Result<(), Diagnostic> {
    loop {
        let have_terminals_changed = apply_constant_propagation(env, fun, constants)?;
        if !have_terminals_changed {
            break;
        }
        // If terminals have changed then blocks may have become newly unreachable,
        // so reinitialize the HIR
        // TODO handle errors
        initialize_hir(&mut fun.body).unwrap();

        // Now that predecessors have changed, prune phi operands for unreachable blocks
        // for example, a phi node whose operand was eliminated because it was set in a
        // block that is no longer reached
        for block in fun.body.blocks.iter_mut() {
            // TODO: avoid the clone here
            let predecessors = block.predecessors.clone();
            for phi in block.phis.iter_mut() {
                phi.operands
                    .retain(|predecessor, _| predecessors.contains(predecessor))
            }
        }

        // By removing some phi operands, there may be phis that were not previously
        // redundant but now are
        eliminate_redundant_phis(env, fun);

        // Finally, merge together any blocks that are now guaranteed to execute
        // consecutively
        merge_consecutive_blocks(env, fun)?;
    }
    Ok(())
}

fn apply_constant_propagation(
    env: &Environment,
    fun: &mut Function,
    constants: &mut Constants,
) -> Result<bool, Diagnostic> {
    let mut has_changes = false;

    for block in fun.body.blocks.iter_mut() {
        for phi in block.phis.iter() {
            let mut value: Option<Constant> = None;
            for (_, operand) in &phi.operands {
                if let Some(operand_value) = constants.get(operand.id) {
                    match &mut value {
                        Some(value) if value == operand_value => {
                            // no-op
                        }
                        Some(_) => {
                            value = None;
                            break;
                        }
                        None => {
                            value = Some(operand_value.clone());
                        }
                    }
                } else {
                    // This phi operand's value is unknown, bail out of replacing it
                    value = None;
                    break;
                }
            }
            if let Some(value) = value {
                constants.insert(phi.identifier.id, value);
            }
        }
        for (ix, instr_ix) in block.instructions.iter().enumerate() {
            if block.kind == BlockKind::Sequence && ix == block.instructions.len() - 1 {
                // Evaluating the last value of a sequence can break order of evaluation
                // so skip these instructions
                continue;
            }
            let instr_ix = usize::from(*instr_ix);
            let lvalue_id = fun.body.instructions[instr_ix].lvalue.identifier.id;
            let mut value = std::mem::replace(
                &mut fun.body.instructions[instr_ix].value,
                InstructionValue::Tombstone,
            );
            let const_value = evaluate_instruction(env, &mut value, constants)?;
            if let Some(const_value) = const_value {
                constants.insert(lvalue_id, const_value);
            }
            fun.body.instructions[instr_ix].value = value;
        }

        // If the block ends in an `if` and the test value is a constant primitive,
        // then convert the terminal into a goto to either the consequent or alternate
        // in this case, only the selected branch is reachable
        if let TerminalValue::If(terminal) = &mut block.terminal.value {
            if let Some(primitive) = constants.get_primitive(terminal.test.identifier.id) {
                let target_block_id = if primitive.value.is_truthy() {
                    terminal.consequent
                } else {
                    terminal.alternate
                };
                block.terminal.value = TerminalValue::Goto(GotoTerminal {
                    block: target_block_id,
                    kind: GotoKind::Break,
                });
                has_changes = true;
            }
        }
    }

    Ok(has_changes)
}

fn evaluate_instruction(
    env: &Environment,
    mut instr: &mut InstructionValue,
    constants: &mut Constants,
) -> Result<Option<Constant>, Diagnostic> {
    match &mut instr {
        InstructionValue::Primitive(value) => Ok(Some(Constant::Primitive(value.clone()))),
        InstructionValue::LoadGlobal(value) => Ok(Some(Constant::Global(value.clone()))),
        InstructionValue::Binary(value) => {
            let left = constants.get_primitive(value.left.identifier.id);
            let right = constants.get_primitive(value.right.identifier.id);
            match (left, right) {
                (Some(left), Some(right)) => {
                    if let Some(result) =
                        apply_binary_operator(env, &left.value, value.operator, &right.value)
                    {
                        *instr = InstructionValue::Primitive(Primitive {
                            value: result.clone(),
                        });
                        Ok(Some(Constant::Primitive(Primitive { value: result })))
                    } else {
                        Ok(None)
                    }
                }
                _ => {
                    // no-op, not all operands are known
                    Ok(None)
                }
            }
        }
        InstructionValue::LoadLocal(value) => {
            if let Some(const_value) = constants.get(value.place.identifier.id) {
                *instr = const_value.into();
                Ok(Some(const_value.clone()))
            } else {
                Ok(None)
            }
        }
        InstructionValue::StoreLocal(value) => {
            if let Some(const_value) = constants.get(value.value.identifier.id).cloned() {
                constants.insert(value.lvalue.identifier.identifier.id, const_value.clone());
                Ok(Some(const_value))
            } else {
                Ok(None)
            }
        }
        InstructionValue::Function(value) => {
            // TODO: due to the outer fixpoint iteration this could visit the same
            // function many times. However we only strictly have to visit the function
            // again if the context variable's constant values have changed since last
            // time. Improve this by tracking the inner_constants value with which we
            // last visited, and skip visiting if the same
            let mut inner_constants: Constants = value
                .lowered_function
                .context
                .iter()
                .filter_map(|id| {
                    let value = constants.get(id.identifier.id);
                    value.map(|value| (id.identifier.id, value.clone()))
                })
                .collect();
            constant_propagation_impl(env, &mut value.lowered_function, &mut inner_constants)?;
            Ok(None)
        }
        _ => {
            // no-op, not all instructions can be processed
            Ok(None)
        }
    }
}

fn apply_binary_operator(
    _env: &Environment,
    left: &JsValue,
    operator: BinaryOperator,
    right: &JsValue,
) -> Option<JsValue> {
    match (left, right) {
        (JsValue::Number(left), JsValue::Number(right)) => match operator {
            BinaryOperator::Add => Some(JsValue::Number(*left + *right)),
            BinaryOperator::Subtract => Some(JsValue::Number(*left - *right)),
            BinaryOperator::Multiply => Some(JsValue::Number(*left * *right)),
            BinaryOperator::Divide => Some(JsValue::Number(*left / *right)),
            BinaryOperator::LessThan => Some(JsValue::Boolean(*left < *right)),
            BinaryOperator::LessThanOrEqual => Some(JsValue::Boolean(*left <= *right)),
            BinaryOperator::GreaterThan => Some(JsValue::Boolean(*left > *right)),
            BinaryOperator::GreaterThanOrEqual => Some(JsValue::Boolean(*left >= *right)),
            BinaryOperator::Equals => Some(JsValue::Boolean(left.equals(*right))),
            BinaryOperator::NotEquals => Some(JsValue::Boolean(left.not_equals(*right))),
            BinaryOperator::StrictEquals => Some(JsValue::Boolean(left.equals(*right))),
            BinaryOperator::NotStrictEquals => Some(JsValue::Boolean(left.not_equals(*right))),
            _ => None,
        },
        (left, right) => match operator {
            BinaryOperator::Equals => left.loosely_equals(right).map(JsValue::Boolean),
            BinaryOperator::NotEquals => left.not_loosely_equals(right).map(JsValue::Boolean),
            BinaryOperator::StrictEquals => Some(JsValue::Boolean(left.strictly_equals(right))),
            BinaryOperator::NotStrictEquals => {
                Some(JsValue::Boolean(left.not_strictly_equals(right)))
            }
            _ => None,
        },
    }
}

#[derive(Default)]
struct Constants {
    data: HashMap<IdentifierId, Constant>,
}

impl Constants {
    fn get_primitive(&self, id: IdentifierId) -> Option<&Primitive> {
        if let Some(Constant::Primitive(primitive)) = &self.data.get(&id) {
            Some(primitive)
        } else {
            None
        }
    }

    fn get(&self, id: IdentifierId) -> Option<&Constant> {
        self.data.get(&id)
    }

    fn insert(&mut self, id: IdentifierId, constant: Constant) {
        self.data.insert(id, constant);
    }
}

impl FromIterator<(IdentifierId, Constant)> for Constants {
    fn from_iter<T: IntoIterator<Item = (IdentifierId, Constant)>>(iter: T) -> Self {
        Self {
            data: FromIterator::from_iter(iter),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
enum Constant {
    Global(LoadGlobal),
    Primitive(Primitive),
}

impl From<&Constant> for InstructionValue {
    fn from(value: &Constant) -> Self {
        match value {
            Constant::Global(value) => InstructionValue::LoadGlobal(value.clone()),
            Constant::Primitive(value) => InstructionValue::Primitive(value.clone()),
        }
    }
}

impl From<Constant> for InstructionValue {
    fn from(value: Constant) -> Self {
        match value {
            Constant::Global(value) => InstructionValue::LoadGlobal(value),
            Constant::Primitive(value) => InstructionValue::Primitive(value),
        }
    }
}
