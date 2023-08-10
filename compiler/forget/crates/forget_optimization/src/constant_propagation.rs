use std::collections::HashMap;

use forget_diagnostics::Diagnostic;
use forget_estree::{BinaryOperator, JsValue};
use forget_hir::{
    initialize_hir, merge_consecutive_blocks, BlockKind, Environment, Function, GotoKind,
    GotoTerminal, IdentifierId, Instruction, InstructionValue, LoadGlobal, Operand, Primitive,
    TerminalValue,
};
use forget_ssa::eliminate_redundant_phis;

pub fn constant_propagation(env: &Environment, fun: &mut Function) -> Result<(), Diagnostic> {
    let mut constants = Constants::new();
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
                if let Some(operand_value) = constants.get(&operand.id) {
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
            let mut instr = std::mem::replace(
                &mut fun.body.instructions[instr_ix].value,
                InstructionValue::Tombstone,
            );
            evaluate_instruction(env, &fun.body.instructions, &mut instr, constants)?;
            fun.body.instructions[instr_ix].value = instr;
        }

        // If the block ends in an `if` and the test value is a constant primitive,
        // then convert the terminal into a goto to either the consequent or alternate
        // in this case, only the selected branch is reachable
        if let TerminalValue::If(terminal) = &mut block.terminal.value {
            if let Some(primitive) =
                read_primitive_instruction(&fun.body.instructions, &terminal.test)
            {
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

fn read_primitive_instruction(instrs: &[Instruction], operand: &Operand) -> Option<Primitive> {
    let instr = &instrs[usize::from(operand.ix)].value;
    if let InstructionValue::Primitive(primitive) = instr {
        Some(primitive.clone())
    } else {
        None
    }
}

fn evaluate_instruction(
    env: &Environment,
    instrs: &[Instruction],
    mut instr: &mut InstructionValue,
    constants: &mut Constants,
) -> Result<(), Diagnostic> {
    let read_constant = |operand: &Operand| {
        let instr = &instrs[usize::from(operand.ix)].value;
        match instr {
            InstructionValue::Primitive(value) => Some(Constant::Primitive(value.clone())),
            InstructionValue::LoadGlobal(value) => Some(Constant::Global(value.clone())),
            _ => None,
        }
    };
    match &mut instr {
        InstructionValue::Binary(value) => {
            let left = read_primitive_instruction(instrs, &value.left);
            let right = read_primitive_instruction(instrs, &value.right);
            match (left, right) {
                (Some(left), Some(right)) => {
                    if let Some(result) = apply_binary_operator(env, left, value.operator, right) {
                        *instr = InstructionValue::Primitive(result);
                    }
                }
                _ => {
                    // no-op, not all operands are known
                }
            }
        }
        InstructionValue::LoadLocal(value) => {
            if let Some(const_value) = constants.get(&value.place.identifier.id) {
                *instr = const_value.into();
            }
        }
        InstructionValue::StoreLocal(value) => {
            if let Some(const_value) = read_constant(&value.value) {
                constants.insert(value.lvalue.identifier.identifier.id, const_value);
            }
        }
        InstructionValue::Function(value) => {
            // TODO: due to the outer fixpoint iteration this could visit the same
            // function many times. However we only strictly have to visit the function
            // again if the context variable's constant values have changed since last
            // time.
            // Instead, we can:
            // - Create a filtered Constants instance that extracts just the values for
            //   the function (using its context variables list)
            // - Track the last such filtered Constants instance we visited the function
            //   with. Only visit again if the Constants have changed.
            let mut inner_constants: Constants = value
                .lowered_function
                .context
                .iter()
                .filter_map(|id| {
                    let value = constants.get(&id.identifier.id);
                    value.map(|value| (id.identifier.id, value.clone()))
                })
                .collect();
            constant_propagation_impl(env, &mut value.lowered_function, &mut inner_constants)?;
        }
        _ => {
            // no-op, not all instructions can be processed
        }
    }
    Ok(())
}

fn apply_binary_operator(
    _env: &Environment,
    left: Primitive,
    operator: BinaryOperator,
    right: Primitive,
) -> Option<Primitive> {
    match (left.value, right.value) {
        (JsValue::Number(left), JsValue::Number(right)) => match operator {
            BinaryOperator::Add => Some(Primitive {
                value: JsValue::Number(left + right),
            }),
            BinaryOperator::Subtract => Some(Primitive {
                value: JsValue::Number(left - right),
            }),
            BinaryOperator::Multiply => Some(Primitive {
                value: JsValue::Number(left * right),
            }),
            BinaryOperator::Divide => Some(Primitive {
                value: JsValue::Number(left / right),
            }),
            BinaryOperator::LessThan => Some(Primitive {
                value: JsValue::Boolean(left < right),
            }),
            BinaryOperator::LessThanOrEqual => Some(Primitive {
                value: JsValue::Boolean(left <= right),
            }),
            BinaryOperator::GreaterThan => Some(Primitive {
                value: JsValue::Boolean(left > right),
            }),
            BinaryOperator::GreaterThanOrEqual => Some(Primitive {
                value: JsValue::Boolean(left >= right),
            }),
            BinaryOperator::Equals => Some(Primitive {
                value: JsValue::Boolean(left.equals(right)),
            }),
            BinaryOperator::NotEquals => Some(Primitive {
                value: JsValue::Boolean(left.not_equals(right)),
            }),
            BinaryOperator::StrictEquals => Some(Primitive {
                value: JsValue::Boolean(left.equals(right)),
            }),
            BinaryOperator::NotStrictEquals => Some(Primitive {
                value: JsValue::Boolean(left.not_equals(right)),
            }),
            _ => None,
        },
        (left, right) => match operator {
            BinaryOperator::Equals => left.loosely_equals(&right).map(|value| Primitive {
                value: JsValue::Boolean(value),
            }),
            BinaryOperator::NotEquals => left.not_loosely_equals(&right).map(|value| Primitive {
                value: JsValue::Boolean(value),
            }),
            BinaryOperator::StrictEquals => Some(Primitive {
                value: JsValue::Boolean(left.strictly_equals(&right)),
            }),
            BinaryOperator::NotStrictEquals => Some(Primitive {
                value: JsValue::Boolean(left.not_strictly_equals(&right)),
            }),
            _ => None,
        },
    }
}

type Constants = HashMap<IdentifierId, Constant>;

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
