// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

//! Port of OutlineFunctions from TypeScript (`Optimization/OutlineFunctions.ts`).
//!
//! Extracts anonymous function expressions that do not close over any local
//! variables into top-level outlined functions. The original instruction is
//! replaced with a `LoadGlobal` referencing the outlined function's generated name.
//!
//! Conditional on `env.config.enable_function_outlining`.

use std::collections::HashSet;

use react_compiler_hir::environment::Environment;
use react_compiler_hir::{
    FunctionId, HirFunction, IdentifierId, InstructionValue, NonLocalBinding,
};

/// Outline anonymous function expressions that have no captured context variables.
///
/// Ported from TS `outlineFunctions` in `Optimization/OutlineFunctions.ts`.
pub fn outline_functions(
    func: &mut HirFunction,
    env: &mut Environment,
    fbt_operands: &HashSet<IdentifierId>,
) {
    // Collect the changes we need to make, to avoid borrow conflicts.
    // Each entry: (instruction index in func.instructions, generated global name, FunctionId to outline)
    let mut replacements: Vec<(usize, String, FunctionId)> = Vec::new();

    // Also collect inner function IDs that need recursion
    let mut inner_function_ids: Vec<FunctionId> = Vec::new();

    for block in func.body.blocks.values() {
        for &instr_id in &block.instructions {
            let instr = &func.instructions[instr_id.0 as usize];
            let lvalue_id = instr.lvalue.identifier;

            match &instr.value {
                InstructionValue::FunctionExpression {
                    lowered_func,
                    name,
                    ..
                } => {
                    // Always recurse into inner functions
                    inner_function_ids.push(lowered_func.func);

                    let inner_func = &env.functions[lowered_func.func.0 as usize];

                    // Check outlining conditions:
                    // 1. No captured context variables
                    // 2. Anonymous (no explicit name / id on the inner function)
                    // 3. Not an fbt operand
                    if inner_func.context.is_empty()
                        && inner_func.id.is_none()
                        && name.is_none()
                        && !fbt_operands.contains(&lvalue_id)
                    {
                        // Clone the hint string before calling mutable env method
                        let hint: Option<String> = inner_func
                            .id
                            .clone()
                            .or_else(|| inner_func.name_hint.clone());
                        let generated_name =
                            env.generate_globally_unique_identifier_name(hint.as_deref());

                        replacements.push((
                            instr_id.0 as usize,
                            generated_name,
                            lowered_func.func,
                        ));
                    }
                }
                InstructionValue::ObjectMethod { lowered_func, .. } => {
                    // Recurse into object methods (but don't outline them)
                    inner_function_ids.push(lowered_func.func);
                }
                _ => {}
            }
        }
    }

    // Recurse into inner functions (clone out, recurse, put back)
    for function_id in inner_function_ids {
        let mut inner_func = env.functions[function_id.0 as usize].clone();
        outline_functions(&mut inner_func, env, fbt_operands);
        env.functions[function_id.0 as usize] = inner_func;
    }

    // Apply replacements: set function id, outline, and replace instruction value
    for (instr_idx, generated_name, function_id) in replacements {
        // Set the id on the inner function
        env.functions[function_id.0 as usize].id = Some(generated_name.clone());

        // Take the function out of the arena for outlining
        let outlined_func = env.functions[function_id.0 as usize].clone();
        env.outline_function(outlined_func, None);

        // Replace the instruction value with LoadGlobal
        let loc = func.instructions[instr_idx].value.loc().cloned();
        func.instructions[instr_idx].value = InstructionValue::LoadGlobal {
            binding: NonLocalBinding::Global {
                name: generated_name,
            },
            loc,
        };
    }
}
