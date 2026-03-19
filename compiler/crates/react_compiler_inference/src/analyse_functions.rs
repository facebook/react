// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

//! Recursively analyzes nested function expressions and object methods to infer
//! their aliasing effect signatures.
//!
//! Ported from TypeScript `src/Inference/AnalyseFunctions.ts`.
//!
//! Currently a skeleton: iterates through instructions to find inner functions
//! and resets their context variable mutable ranges, but does not yet run the
//! sub-passes (inferMutationAliasingEffects, deadCodeElimination,
//! inferMutationAliasingRanges, rewriteInstructionKindsBasedOnReassignment,
//! inferReactiveScopeVariables) since those are not yet ported.

use indexmap::IndexMap;
use react_compiler_hir::environment::Environment;
use react_compiler_hir::{
    BlockId, Effect, EvaluationOrder, FunctionId, HirFunction, IdentifierId, InstructionValue,
    MutableRange, Place, ReactFunctionType, HIR,
};

/// Analyse all nested function expressions and object methods in `func`.
///
/// For each inner function found, runs `lower_with_mutation_aliasing` to infer
/// its aliasing effects, then resets context variable mutable ranges.
///
/// The optional `debug_logger` callback is invoked after processing each inner
/// function, receiving `(&HirFunction, &Environment)` so the caller can produce
/// debug output. This mirrors the TS `fn.env.logger?.debugLogIRs` call inside
/// `lowerWithMutationAliasing`.
///
/// Corresponds to TS `analyseFunctions(func: HIRFunction): void`.
pub fn analyse_functions<F>(func: &mut HirFunction, env: &mut Environment, debug_logger: &mut F)
where
    F: FnMut(&HirFunction, &Environment),
{
    // Collect FunctionIds from FunctionExpression/ObjectMethod instructions.
    // We collect first to avoid borrow conflicts with env.functions.
    let mut inner_func_ids: Vec<FunctionId> = Vec::new();
    for (_block_id, block) in &func.body.blocks {
        for instr_id in &block.instructions {
            let instr = &func.instructions[instr_id.0 as usize];
            match &instr.value {
                InstructionValue::FunctionExpression { lowered_func, .. }
                | InstructionValue::ObjectMethod { lowered_func, .. } => {
                    inner_func_ids.push(lowered_func.func);
                }
                _ => {}
            }
        }
    }

    // Process each inner function
    for func_id in inner_func_ids {
        // Take the inner function out of the arena to avoid borrow conflicts
        let mut inner_func = std::mem::replace(
            &mut env.functions[func_id.0 as usize],
            placeholder_function(),
        );

        lower_with_mutation_aliasing(&mut inner_func, env, debug_logger);

        // Reset mutable range for outer inferMutationAliasingEffects.
        //
        // NOTE: inferReactiveScopeVariables makes identifiers in the scope
        // point to the *same* mutableRange instance (in TS). In Rust, scopes
        // are stored in an arena, so we reset both the identifier's range
        // and clear its scope.
        for operand in &inner_func.context {
            let ident = &mut env.identifiers[operand.identifier.0 as usize];
            ident.mutable_range = MutableRange {
                start: EvaluationOrder(0),
                end: EvaluationOrder(0),
            };
            ident.scope = None;
        }

        // Put the function back
        env.functions[func_id.0 as usize] = inner_func;
    }
}

/// Run mutation/aliasing inference on an inner function.
///
/// Corresponds to TS `lowerWithMutationAliasing(fn: HIRFunction): void`.
///
/// TODO: Currently a skeleton. The sub-passes need to be ported:
/// - inferMutationAliasingEffects
/// - deadCodeElimination (for inner functions)
/// - inferMutationAliasingRanges
/// - rewriteInstructionKindsBasedOnReassignment
/// - inferReactiveScopeVariables
fn lower_with_mutation_aliasing<F>(func: &mut HirFunction, env: &mut Environment, debug_logger: &mut F)
where
    F: FnMut(&HirFunction, &Environment),
{
    // Phase 1: Recursively analyse nested functions first (depth-first)
    analyse_functions(func, env, debug_logger);

    // TODO: The following sub-passes are not yet ported:
    // inferMutationAliasingEffects(fn, {isFunctionExpression: true});
    // deadCodeElimination(fn);
    // let functionEffects = inferMutationAliasingRanges(fn, {isFunctionExpression: true});
    // rewriteInstructionKindsBasedOnReassignment(fn);
    // inferReactiveScopeVariables(fn);
    // fn.aliasingEffects = functionEffects;

    // Phase 2: populate the Effect of each context variable.
    // Since sub-passes are not yet ported, we skip effect classification.
    // The context variable effects remain as-is (their default from lowering).

    // Log the inner function's state (mirrors TS: fn.env.logger?.debugLogIRs)
    debug_logger(func, env);
}

/// Create a placeholder HirFunction for temporarily swapping an inner function
/// out of `env.functions` via `std::mem::replace`. The placeholder is never
/// read — the real function is swapped back immediately after processing.
fn placeholder_function() -> HirFunction {
    HirFunction {
        loc: None,
        id: None,
        name_hint: None,
        fn_type: ReactFunctionType::Other,
        params: Vec::new(),
        return_type_annotation: None,
        returns: Place {
            identifier: IdentifierId(0),
            effect: Effect::Unknown,
            reactive: false,
            loc: None,
        },
        context: Vec::new(),
        body: HIR {
            entry: BlockId(0),
            blocks: IndexMap::new(),
        },
        instructions: Vec::new(),
        generator: false,
        is_async: false,
        directives: Vec::new(),
        aliasing_effects: None,
    }
}
