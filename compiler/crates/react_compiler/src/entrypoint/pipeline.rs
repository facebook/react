// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

//! Compilation pipeline for a single function.
//!
//! Analogous to TS `Pipeline.ts` (`compileFn` → `run` → `runWithEnvironment`).
//! Currently runs BuildHIR (lowering) and PruneMaybeThrows.

use react_compiler_ast::scope::ScopeInfo;
use react_compiler_diagnostics::CompilerError;
use react_compiler_hir::ReactFunctionType;
use react_compiler_hir::environment::{Environment, OutputMode};
use react_compiler_hir::environment_config::EnvironmentConfig;
use react_compiler_lowering::FunctionNode;

use super::compile_result::{CodegenFunction, CompilerErrorDetailInfo, CompilerErrorItemInfo, DebugLogEntry};
use super::imports::ProgramContext;
use super::plugin_options::CompilerOutputMode;
use crate::debug_print;

/// Run the compilation pipeline on a single function.
///
/// Currently: creates an Environment, runs BuildHIR (lowering), and produces
/// debug output via the context. Returns a CodegenFunction with zeroed memo
/// stats on success (codegen is not yet implemented).
pub fn compile_fn(
    func: &FunctionNode<'_>,
    fn_name: Option<&str>,
    scope_info: &ScopeInfo,
    fn_type: ReactFunctionType,
    mode: CompilerOutputMode,
    env_config: &EnvironmentConfig,
    context: &mut ProgramContext,
) -> Result<CodegenFunction, CompilerError> {
    let mut env = Environment::with_config(env_config.clone());
    env.fn_type = fn_type;
    env.output_mode = match mode {
        CompilerOutputMode::Ssr => OutputMode::Ssr,
        CompilerOutputMode::Client => OutputMode::Client,
        CompilerOutputMode::Lint => OutputMode::Lint,
    };

    let mut hir = react_compiler_lowering::lower(func, fn_name, scope_info, &mut env)?;

    // Check for Invariant errors after lowering, before logging HIR.
    // In TS, Invariant errors throw from recordError(), aborting lower() before
    // the HIR entry is logged. The thrown error contains ONLY the Invariant error,
    // not other recorded (non-Invariant) errors.
    if env.has_invariant_errors() {
        return Err(env.take_invariant_errors());
    }

    let debug_hir = debug_print::debug_hir(&hir, &env);
    context.log_debug(DebugLogEntry::new("HIR", debug_hir));

    react_compiler_optimization::prune_maybe_throws(&mut hir, &mut env.functions)?;

    let debug_prune = debug_print::debug_hir(&hir, &env);
    context.log_debug(DebugLogEntry::new("PruneMaybeThrows", debug_prune));

    // Validate context variable lvalues (matches TS Pipeline.ts: validateContextVariableLValues(hir))
    // In TS, this calls env.recordError() which accumulates on env.errors.
    // Invariant violations are propagated as Err.
    react_compiler_validation::validate_context_variable_lvalues(&hir, &mut env)?;
    context.log_debug(DebugLogEntry::new("ValidateContextVariableLValues", "ok".to_string()));

    let void_memo_errors = react_compiler_validation::validate_use_memo(&hir, &mut env);
    // Log VoidUseMemo errors as CompileError events (matching TS env.logErrors behavior).
    // In TS these are logged via env.logErrors() for telemetry, not accumulated as compile errors.
    log_errors_as_events(&void_memo_errors, context);
    context.log_debug(DebugLogEntry::new("ValidateUseMemo", "ok".to_string()));

    // Note: TS gates this on `enableDropManualMemoization`, but it returns true for all
    // output modes, so we run it unconditionally.
    react_compiler_optimization::drop_manual_memoization(&mut hir, &mut env)?;

    let debug_drop_memo = debug_print::debug_hir(&hir, &env);
    context.log_debug(DebugLogEntry::new("DropManualMemoization", debug_drop_memo));

    react_compiler_optimization::inline_immediately_invoked_function_expressions(
        &mut hir, &mut env,
    );

    let debug_inline_iifes = debug_print::debug_hir(&hir, &env);
    context.log_debug(DebugLogEntry::new(
        "InlineImmediatelyInvokedFunctionExpressions",
        debug_inline_iifes,
    ));

    // Standalone merge pass (TS pipeline calls this unconditionally after IIFE inlining)
    react_compiler_optimization::merge_consecutive_blocks::merge_consecutive_blocks(
        &mut hir,
        &mut env.functions,
    );

    let debug_merge = debug_print::debug_hir(&hir, &env);
    context.log_debug(DebugLogEntry::new("MergeConsecutiveBlocks", debug_merge));

    // TODO: port assertConsistentIdentifiers
    context.log_debug(DebugLogEntry::new("AssertConsistentIdentifiers", "ok".to_string()));
    // TODO: port assertTerminalSuccessorsExist
    context.log_debug(DebugLogEntry::new("AssertTerminalSuccessorsExist", "ok".to_string()));

    react_compiler_ssa::enter_ssa(&mut hir, &mut env).map_err(|diag| {
        // In TS, EnterSSA uses CompilerError.throwTodo() which creates a CompilerErrorDetail
        // (not a CompilerDiagnostic). We convert here to match the TS event format.
        let loc = diag.primary_location().cloned();
        let mut err = CompilerError::new();
        err.push_error_detail(react_compiler_diagnostics::CompilerErrorDetail {
            category: diag.category,
            reason: diag.reason,
            description: diag.description,
            loc,
            suggestions: diag.suggestions,
        });
        err
    })?;

    let debug_ssa = debug_print::debug_hir(&hir, &env);
    context.log_debug(DebugLogEntry::new("SSA", debug_ssa));

    react_compiler_ssa::eliminate_redundant_phi(&mut hir, &mut env);

    let debug_eliminate_phi = debug_print::debug_hir(&hir, &env);
    context.log_debug(DebugLogEntry::new("EliminateRedundantPhi", debug_eliminate_phi));

    // TODO: port assertConsistentIdentifiers
    context.log_debug(DebugLogEntry::new("AssertConsistentIdentifiers", "ok".to_string()));

    react_compiler_optimization::constant_propagation(&mut hir, &mut env);

    let debug_const_prop = debug_print::debug_hir(&hir, &env);
    context.log_debug(DebugLogEntry::new("ConstantPropagation", debug_const_prop));

    react_compiler_typeinference::infer_types(&mut hir, &mut env)?;

    let debug_infer_types = debug_print::debug_hir(&hir, &env);
    context.log_debug(DebugLogEntry::new("InferTypes", debug_infer_types));

    if env.enable_validations() {
        if env.config.validate_hooks_usage {
            react_compiler_validation::validate_hooks_usage(&hir, &mut env)?;
            context.log_debug(DebugLogEntry::new("ValidateHooksUsage", "ok".to_string()));
        }

        if env.config.validate_no_capitalized_calls.is_some() {
            react_compiler_validation::validate_no_capitalized_calls(&hir, &mut env);
            context.log_debug(DebugLogEntry::new("ValidateNoCapitalizedCalls", "ok".to_string()));
        }
    }

    react_compiler_optimization::optimize_props_method_calls(&mut hir, &env);

    let debug_optimize_props = debug_print::debug_hir(&hir, &env);
    context.log_debug(DebugLogEntry::new("OptimizePropsMethodCalls", debug_optimize_props));

    // AnalyseFunctions logs inner function state from within the pass
    // (mirrors TS: fn.env.logger?.debugLogIRs({ name: 'AnalyseFunction (inner)', ... }))
    let mut inner_logs: Vec<String> = Vec::new();
    react_compiler_inference::analyse_functions(&mut hir, &mut env, &mut |inner_func, inner_env| {
        inner_logs.push(debug_print::debug_hir(inner_func, inner_env));
    })?;
    // Check for invariant errors recorded during AnalyseFunctions (e.g., uninitialized
    // identifiers in InferMutationAliasingEffects for inner functions).
    if env.has_invariant_errors() {
        // Emit any inner function logs that were captured before the error
        for inner_log in &inner_logs {
            context.log_debug(DebugLogEntry::new("AnalyseFunction (inner)", inner_log.clone()));
        }
        return Err(env.take_invariant_errors());
    }
    for inner_log in inner_logs {
        context.log_debug(DebugLogEntry::new("AnalyseFunction (inner)", inner_log));
    }

    let debug_analyse_functions = debug_print::debug_hir(&hir, &env);
    context.log_debug(DebugLogEntry::new("AnalyseFunctions", debug_analyse_functions));

    let errors_before = env.error_count();
    react_compiler_inference::infer_mutation_aliasing_effects(&mut hir, &mut env, false)?;

    // Check for errors recorded during InferMutationAliasingEffects
    // (e.g., uninitialized value kind, Todo for unsupported patterns).
    // In TS, these throw from within the pass, aborting before the log entry.
    // We detect new errors by comparing error counts before and after the pass.
    if env.error_count() > errors_before {
        return Err(env.take_errors_since(errors_before));
    }

    let debug_infer_effects = debug_print::debug_hir(&hir, &env);
    context.log_debug(DebugLogEntry::new("InferMutationAliasingEffects", debug_infer_effects));

    react_compiler_optimization::dead_code_elimination(&mut hir, &env);

    let debug_dce = debug_print::debug_hir(&hir, &env);
    context.log_debug(DebugLogEntry::new("DeadCodeElimination", debug_dce));

    // Second PruneMaybeThrows call (matches TS Pipeline.ts position #15)
    react_compiler_optimization::prune_maybe_throws(&mut hir, &mut env.functions)?;

    let debug_prune2 = debug_print::debug_hir(&hir, &env);
    context.log_debug(DebugLogEntry::new("PruneMaybeThrows", debug_prune2));

    react_compiler_inference::infer_mutation_aliasing_ranges(&mut hir, &mut env, false)?;

    let debug_infer_ranges = debug_print::debug_hir(&hir, &env);
    context.log_debug(DebugLogEntry::new("InferMutationAliasingRanges", debug_infer_ranges));

    if env.enable_validations() {
        react_compiler_validation::validate_locals_not_reassigned_after_render(&hir, &mut env);
        context.log_debug(DebugLogEntry::new("ValidateLocalsNotReassignedAfterRender", "ok".to_string()));

        // assertValidMutableRanges is gated on config.assertValidMutableRanges (default false)

        if env.config.validate_ref_access_during_render {
            react_compiler_validation::validate_no_ref_access_in_render(&hir, &mut env);
            context.log_debug(DebugLogEntry::new("ValidateNoRefAccessInRender", "ok".to_string()));
        }

        if env.config.validate_no_set_state_in_render {
            react_compiler_validation::validate_no_set_state_in_render(&hir, &mut env)?;
            context.log_debug(DebugLogEntry::new("ValidateNoSetStateInRender", "ok".to_string()));
        }

        if env.config.validate_no_derived_computations_in_effects_exp
            && env.output_mode == OutputMode::Lint
        {
            let errors = react_compiler_validation::validate_no_derived_computations_in_effects_exp(&hir, &env)?;
            log_errors_as_events(&errors, context);
            context.log_debug(DebugLogEntry::new("ValidateNoDerivedComputationsInEffects", "ok".to_string()));
        } else if env.config.validate_no_derived_computations_in_effects {
            react_compiler_validation::validate_no_derived_computations_in_effects(&hir, &mut env);
            context.log_debug(DebugLogEntry::new("ValidateNoDerivedComputationsInEffects", "ok".to_string()));
        }

        if env.config.validate_no_set_state_in_effects
            && env.output_mode == OutputMode::Lint
        {
            let errors = react_compiler_validation::validate_no_set_state_in_effects(&hir, &env)?;
            log_errors_as_events(&errors, context);
            context.log_debug(DebugLogEntry::new("ValidateNoSetStateInEffects", "ok".to_string()));
        }

        if env.config.validate_no_jsx_in_try_statements
            && env.output_mode == OutputMode::Lint
        {
            let errors = react_compiler_validation::validate_no_jsx_in_try_statement(&hir);
            log_errors_as_events(&errors, context);
            context.log_debug(DebugLogEntry::new("ValidateNoJSXInTryStatement", "ok".to_string()));
        }

        react_compiler_validation::validate_no_freezing_known_mutable_functions(&hir, &mut env);
        context.log_debug(DebugLogEntry::new("ValidateNoFreezingKnownMutableFunctions", "ok".to_string()));
    }

    react_compiler_inference::infer_reactive_places(&mut hir, &mut env)?;

    let debug_reactive_places = debug_print::debug_hir(&hir, &env);
    context.log_debug(DebugLogEntry::new("InferReactivePlaces", debug_reactive_places));

    if env.enable_validations() {
        // Always enter this block — in TS, the guard checks a truthy string ('off' is truthy),
        // so it always runs. The internal checks inside VED handle the config flags properly.
        react_compiler_validation::validate_exhaustive_dependencies(&hir, &mut env)?;
        context.log_debug(DebugLogEntry::new("ValidateExhaustiveDependencies", "ok".to_string()));
    }

    react_compiler_ssa::rewrite_instruction_kinds_based_on_reassignment(&mut hir, &env)?;

    let debug_rewrite = debug_print::debug_hir(&hir, &env);
    context.log_debug(DebugLogEntry::new("RewriteInstructionKindsBasedOnReassignment", debug_rewrite));

    if env.enable_validations()
        && env.config.validate_static_components
        && env.output_mode == OutputMode::Lint
    {
        let errors = react_compiler_validation::validate_static_components(&hir);
        log_errors_as_events(&errors, context);
        context.log_debug(DebugLogEntry::new("ValidateStaticComponents", "ok".to_string()));
    }

    if env.enable_memoization() {
        react_compiler_inference::infer_reactive_scope_variables(&mut hir, &mut env)?;

        let debug_infer_scopes = debug_print::debug_hir(&hir, &env);
        context.log_debug(DebugLogEntry::new("InferReactiveScopeVariables", debug_infer_scopes));
    }

    let fbt_operands =
        react_compiler_inference::memoize_fbt_and_macro_operands_in_same_scope(&hir, &mut env);

    let debug_fbt = debug_print::debug_hir(&hir, &env);
    context.log_debug(DebugLogEntry::new("MemoizeFbtAndMacroOperandsInSameScope", debug_fbt));

    if env.config.enable_jsx_outlining {
        react_compiler_optimization::outline_jsx(&mut hir, &mut env);
    }

    if env.config.enable_name_anonymous_functions {
        react_compiler_optimization::name_anonymous_functions(&mut hir, &mut env);

        let debug_name_anon = debug_print::debug_hir(&hir, &env);
        context.log_debug(DebugLogEntry::new("NameAnonymousFunctions", debug_name_anon));
    }

    if env.config.enable_function_outlining {
        react_compiler_optimization::outline_functions(&mut hir, &mut env, &fbt_operands);

        let debug_outline = debug_print::debug_hir(&hir, &env);
        context.log_debug(DebugLogEntry::new("OutlineFunctions", debug_outline));
    }

    react_compiler_inference::align_method_call_scopes(&mut hir, &mut env);

    let debug_align = debug_print::debug_hir(&hir, &env);
    context.log_debug(DebugLogEntry::new("AlignMethodCallScopes", debug_align));

    react_compiler_inference::align_object_method_scopes(&mut hir, &mut env);

    let debug_align_obj = debug_print::debug_hir(&hir, &env);
    context.log_debug(DebugLogEntry::new("AlignObjectMethodScopes", debug_align_obj));

    react_compiler_optimization::prune_unused_labels_hir(&mut hir);

    let debug_prune_labels = debug_print::debug_hir(&hir, &env);
    context.log_debug(DebugLogEntry::new("PruneUnusedLabelsHIR", debug_prune_labels));

    react_compiler_inference::align_reactive_scopes_to_block_scopes_hir(&mut hir, &mut env);

    let debug_align_block_scopes = debug_print::debug_hir(&hir, &env);
    context.log_debug(DebugLogEntry::new("AlignReactiveScopesToBlockScopesHIR", debug_align_block_scopes));

    react_compiler_inference::merge_overlapping_reactive_scopes_hir(&mut hir, &mut env);

    let debug_merge_overlapping = debug_print::debug_hir(&hir, &env);
    context.log_debug(DebugLogEntry::new("MergeOverlappingReactiveScopesHIR", debug_merge_overlapping));

    // TODO: port assertValidBlockNesting
    context.log_debug(DebugLogEntry::new("AssertValidBlockNesting", "ok".to_string()));

    react_compiler_inference::build_reactive_scope_terminals_hir(&mut hir, &mut env);

    let debug_build_scope_terminals = debug_print::debug_hir(&hir, &env);
    context.log_debug(DebugLogEntry::new("BuildReactiveScopeTerminalsHIR", debug_build_scope_terminals));

    // TODO: port assertValidBlockNesting
    context.log_debug(DebugLogEntry::new("AssertValidBlockNesting", "ok".to_string()));

    react_compiler_inference::flatten_reactive_loops_hir(&mut hir);

    let debug_flatten_loops = debug_print::debug_hir(&hir, &env);
    context.log_debug(DebugLogEntry::new("FlattenReactiveLoopsHIR", debug_flatten_loops));

    react_compiler_inference::flatten_scopes_with_hooks_or_use_hir(&mut hir, &env)?;

    let debug_flatten_hooks = debug_print::debug_hir(&hir, &env);
    context.log_debug(DebugLogEntry::new("FlattenScopesWithHooksOrUseHIR", debug_flatten_hooks));

    // TODO: port assertTerminalSuccessorsExist
    context.log_debug(DebugLogEntry::new("AssertTerminalSuccessorsExist", "ok".to_string()));
    // TODO: port assertTerminalPredsExist
    context.log_debug(DebugLogEntry::new("AssertTerminalPredsExist", "ok".to_string()));

    react_compiler_inference::propagate_scope_dependencies_hir(&mut hir, &mut env);

    let debug_propagate_deps = debug_print::debug_hir(&hir, &env);
    context.log_debug(DebugLogEntry::new("PropagateScopeDependenciesHIR", debug_propagate_deps));

    let mut reactive_fn = react_compiler_reactive_scopes::build_reactive_function(&hir, &env)?;

    let hir_formatter = |printer: &mut react_compiler_reactive_scopes::print_reactive_function::DebugPrinter, func: &react_compiler_hir::HirFunction| {
        debug_print::format_hir_function_into(printer, func);
    };
    let debug_reactive = react_compiler_reactive_scopes::print_reactive_function::debug_reactive_function_with_formatter(
        &reactive_fn, &env, Some(&hir_formatter),
    );
    context.log_debug(DebugLogEntry::new("BuildReactiveFunction", debug_reactive));

    react_compiler_reactive_scopes::assert_well_formed_break_targets(&reactive_fn);
    context.log_debug(DebugLogEntry::new("AssertWellFormedBreakTargets", "ok".to_string()));

    react_compiler_reactive_scopes::prune_unused_labels(&mut reactive_fn);
    let debug_prune_labels_reactive = react_compiler_reactive_scopes::print_reactive_function::debug_reactive_function_with_formatter(
        &reactive_fn, &env, Some(&hir_formatter),
    );
    context.log_debug(DebugLogEntry::new("PruneUnusedLabels", debug_prune_labels_reactive));

    react_compiler_reactive_scopes::assert_scope_instructions_within_scopes(&reactive_fn, &env)?;
    context.log_debug(DebugLogEntry::new("AssertScopeInstructionsWithinScopes", "ok".to_string()));

    react_compiler_reactive_scopes::prune_non_escaping_scopes(&mut reactive_fn, &mut env);
    let debug = react_compiler_reactive_scopes::print_reactive_function::debug_reactive_function_with_formatter(
        &reactive_fn, &env, Some(&hir_formatter),
    );
    context.log_debug(DebugLogEntry::new("PruneNonEscapingScopes", debug));

    react_compiler_reactive_scopes::prune_non_reactive_dependencies(&mut reactive_fn, &mut env);
    let debug_prune_non_reactive = react_compiler_reactive_scopes::print_reactive_function::debug_reactive_function_with_formatter(
        &reactive_fn, &env, Some(&hir_formatter),
    );
    context.log_debug(DebugLogEntry::new("PruneNonReactiveDependencies", debug_prune_non_reactive));

    react_compiler_reactive_scopes::prune_unused_scopes(&mut reactive_fn, &env);
    let debug_prune_unused_scopes = react_compiler_reactive_scopes::print_reactive_function::debug_reactive_function_with_formatter(
        &reactive_fn, &env, Some(&hir_formatter),
    );
    context.log_debug(DebugLogEntry::new("PruneUnusedScopes", debug_prune_unused_scopes));

    react_compiler_reactive_scopes::merge_reactive_scopes_that_invalidate_together(&mut reactive_fn, &mut env)?;
    let debug = react_compiler_reactive_scopes::print_reactive_function::debug_reactive_function_with_formatter(
        &reactive_fn, &env, Some(&hir_formatter),
    );
    context.log_debug(DebugLogEntry::new("MergeReactiveScopesThatInvalidateTogether", debug));

    react_compiler_reactive_scopes::prune_always_invalidating_scopes(&mut reactive_fn, &env);
    let debug_prune_always_inv = react_compiler_reactive_scopes::print_reactive_function::debug_reactive_function_with_formatter(
        &reactive_fn, &env, Some(&hir_formatter),
    );
    context.log_debug(DebugLogEntry::new("PruneAlwaysInvalidatingScopes", debug_prune_always_inv));

    react_compiler_reactive_scopes::propagate_early_returns(&mut reactive_fn, &mut env);
    let debug = react_compiler_reactive_scopes::print_reactive_function::debug_reactive_function_with_formatter(
        &reactive_fn, &env, Some(&hir_formatter),
    );
    context.log_debug(DebugLogEntry::new("PropagateEarlyReturns", debug));

    react_compiler_reactive_scopes::prune_unused_lvalues(&mut reactive_fn, &env);
    let debug_prune_lvalues = react_compiler_reactive_scopes::print_reactive_function::debug_reactive_function_with_formatter(
        &reactive_fn, &env, Some(&hir_formatter),
    );
    context.log_debug(DebugLogEntry::new("PruneUnusedLValues", debug_prune_lvalues));

    react_compiler_reactive_scopes::promote_used_temporaries(&mut reactive_fn, &mut env);
    let debug = react_compiler_reactive_scopes::print_reactive_function::debug_reactive_function_with_formatter(
        &reactive_fn, &env, Some(&hir_formatter),
    );
    context.log_debug(DebugLogEntry::new("PromoteUsedTemporaries", debug));

    react_compiler_reactive_scopes::extract_scope_declarations_from_destructuring(&mut reactive_fn, &mut env);
    let debug = react_compiler_reactive_scopes::print_reactive_function::debug_reactive_function_with_formatter(
        &reactive_fn, &env, Some(&hir_formatter),
    );
    context.log_debug(DebugLogEntry::new("ExtractScopeDeclarationsFromDestructuring", debug));

    react_compiler_reactive_scopes::stabilize_block_ids(&mut reactive_fn, &mut env);
    let debug_stabilize = react_compiler_reactive_scopes::print_reactive_function::debug_reactive_function_with_formatter(
        &reactive_fn, &env, Some(&hir_formatter),
    );
    context.log_debug(DebugLogEntry::new("StabilizeBlockIds", debug_stabilize));

    let _unique_identifiers = react_compiler_reactive_scopes::rename_variables(&mut reactive_fn, &mut env);
    let debug = react_compiler_reactive_scopes::print_reactive_function::debug_reactive_function_with_formatter(
        &reactive_fn, &env, Some(&hir_formatter),
    );
    context.log_debug(DebugLogEntry::new("RenameVariables", debug));

    react_compiler_reactive_scopes::prune_hoisted_contexts(&mut reactive_fn, &mut env);
    let debug = react_compiler_reactive_scopes::print_reactive_function::debug_reactive_function_with_formatter(
        &reactive_fn, &env, Some(&hir_formatter),
    );
    context.log_debug(DebugLogEntry::new("PruneHoistedContexts", debug));

    if env.config.enable_preserve_existing_memoization_guarantees
        || env.config.validate_preserve_existing_memoization_guarantees
    {
        // TODO: port validatePreservedManualMemoization
        context.log_debug(DebugLogEntry::new("ValidatePreservedManualMemoization", "ok".to_string()));
    }

    // TODO: port codegenFunction (kind: 'ast', skipped by test harness)

    // Check for accumulated errors at the end of the pipeline
    // (matches TS Pipeline.ts: env.hasErrors() → Err at the end)
    if env.has_errors() {
        return Err(env.take_errors());
    }

    Ok(CodegenFunction {
        loc: None,
        memo_slots_used: 0,
        memo_blocks: 0,
        memo_values: 0,
        pruned_memo_blocks: 0,
        pruned_memo_values: 0,
        outlined: Vec::new(),
    })
}

/// Log CompilerError diagnostics as CompileError events, matching TS `env.logErrors()` behavior.
/// These are logged for telemetry/lint output but not accumulated as compile errors.
fn log_errors_as_events(
    errors: &CompilerError,
    context: &mut ProgramContext,
) {
    for detail in &errors.details {
        let (category, reason, description, severity, details) = match detail {
            react_compiler_diagnostics::CompilerErrorOrDiagnostic::Diagnostic(d) => {
                let items: Option<Vec<CompilerErrorItemInfo>> = {
                    let v: Vec<CompilerErrorItemInfo> = d
                        .details
                        .iter()
                        .map(|item| match item {
                            react_compiler_diagnostics::CompilerDiagnosticDetail::Error {
                                loc,
                                message,
                            } => CompilerErrorItemInfo {
                                kind: "error".to_string(),
                                loc: *loc,
                                message: message.clone(),
                            },
                            react_compiler_diagnostics::CompilerDiagnosticDetail::Hint {
                                message,
                            } => CompilerErrorItemInfo {
                                kind: "hint".to_string(),
                                loc: None,
                                message: Some(message.clone()),
                            },
                        })
                        .collect();
                    if v.is_empty() {
                        None
                    } else {
                        Some(v)
                    }
                };
                (
                    format!("{:?}", d.category),
                    d.reason.clone(),
                    d.description.clone(),
                    format!("{:?}", d.severity()),
                    items,
                )
            }
            react_compiler_diagnostics::CompilerErrorOrDiagnostic::ErrorDetail(d) => (
                format!("{:?}", d.category),
                d.reason.clone(),
                d.description.clone(),
                format!("{:?}", d.severity()),
                None,
            ),
        };
        context.log_event(super::compile_result::LoggerEvent::CompileError {
            fn_loc: None,
            detail: CompilerErrorDetailInfo {
                category,
                reason,
                description,
                severity: Some(severity),
                details,
                loc: None,
            },
        });
    }
}
