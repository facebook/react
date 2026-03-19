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
use std::collections::HashSet;

use react_compiler_hir::{
    AliasingEffect, BlockId, Effect, EvaluationOrder, FunctionId, HirFunction, IdentifierId,
    InstructionValue, MutableRange, Place, ReactFunctionType, HIR,
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

    // Phase 2: Run inferMutationAliasingEffects on the inner function
    // Note: remaining sub-passes (deadCodeElimination, inferMutationAliasingRanges, etc.)
    // are not yet ported, so we just run the effects inference for now.
    crate::infer_mutation_aliasing_effects::infer_mutation_aliasing_effects(
        func, env, true,
    );

    // TODO: The following sub-passes are not yet ported:
    // deadCodeElimination(fn);
    // rewriteInstructionKindsBasedOnReassignment(fn);
    // inferReactiveScopeVariables(fn);

    // Collect function effects from instruction effects.
    // Ideally this would come from inferMutationAliasingRanges, but since that
    // pass isn't ported yet, we collect effects directly from instructions.
    // This is an approximation that gives downstream passes something to work with.
    let mut function_effects: Vec<AliasingEffect> = Vec::new();
    for (_block_id, block) in &func.body.blocks {
        for instr_id in &block.instructions {
            let instr = &func.instructions[instr_id.0 as usize];
            if let Some(ref effects) = instr.effects {
                function_effects.extend(effects.iter().cloned());
            }
        }
        // Also collect terminal effects
        if let Some(ref effects) = terminal_effects(&block.terminal) {
            function_effects.extend(effects.iter().cloned());
        }
    }
    func.aliasing_effects = Some(function_effects.clone());

    // Phase 3: Populate the Effect of each context variable to use in inferring
    // the outer function. Corresponds to TS Phase 2 in lowerWithMutationAliasing.
    //
    // We use instruction-level effects as an approximation for what
    // inferMutationAliasingRanges would return. We only consider effects that
    // directly reference a context variable's identifier to avoid over-counting
    // internal operations as captures.
    let context_ids: HashSet<IdentifierId> = func.context.iter()
        .map(|p| p.identifier)
        .collect();

    // Determine which context variables are captured or mutated.
    // Since we don't have inferMutationAliasingRanges, we approximate by
    // looking at instruction effects. We only consider:
    // - Direct mutations of context variable identifiers
    // - Capture/Alias/MaybeAlias where a context variable is the source
    //   (matching what inferMutationAliasingRanges would report)
    // - MutateFrozen/MutateGlobal of context variables
    let mut captured_or_mutated: HashSet<IdentifierId> = HashSet::new();
    for effect in &function_effects {
        match effect {
            AliasingEffect::Mutate { value, .. }
            | AliasingEffect::MutateTransitive { value }
            | AliasingEffect::MutateTransitiveConditionally { value }
            | AliasingEffect::MutateConditionally { value } => {
                if context_ids.contains(&value.identifier) {
                    captured_or_mutated.insert(value.identifier);
                }
            }
            AliasingEffect::MutateFrozen { place, .. }
            | AliasingEffect::MutateGlobal { place, .. } => {
                if context_ids.contains(&place.identifier) {
                    captured_or_mutated.insert(place.identifier);
                }
            }
            AliasingEffect::Capture { from, .. }
            | AliasingEffect::Alias { from, .. }
            | AliasingEffect::MaybeAlias { from, .. }
            | AliasingEffect::CreateFrom { from, .. }
            | AliasingEffect::Assign { from, .. } => {
                if context_ids.contains(&from.identifier) {
                    captured_or_mutated.insert(from.identifier);
                }
            }
            AliasingEffect::Impure { .. }
            | AliasingEffect::Render { .. }
            | AliasingEffect::CreateFunction { .. }
            | AliasingEffect::Create { .. }
            | AliasingEffect::Freeze { .. }
            | AliasingEffect::ImmutableCapture { .. }
            | AliasingEffect::Apply { .. } => {
                // no-op
            }
        }
    }

    for operand in &mut func.context {
        if captured_or_mutated.contains(&operand.identifier)
            || operand.effect == Effect::Capture
        {
            operand.effect = Effect::Capture;
        } else {
            operand.effect = Effect::Read;
        }
    }

    // Log the inner function's state (mirrors TS: fn.env.logger?.debugLogIRs)
    debug_logger(func, env);
}

/// Extract effects from a terminal, if any.
fn terminal_effects(terminal: &react_compiler_hir::Terminal) -> Option<Vec<AliasingEffect>> {
    match terminal {
        react_compiler_hir::Terminal::Return { effects, .. }
        | react_compiler_hir::Terminal::MaybeThrow { effects, .. } => {
            effects.clone()
        }
        _ => None,
    }
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
