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
use react_compiler_hir::environment::{Environment, OutputMode};
use react_compiler_hir::ReactFunctionType;
use react_compiler_lowering::FunctionNode;

use super::compile_result::{CodegenFunction, DebugLogEntry};
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
    context: &mut ProgramContext,
) -> Result<CodegenFunction, CompilerError> {
    let mut env = Environment::new();
    env.fn_type = fn_type;
    env.output_mode = match mode {
        CompilerOutputMode::Ssr => OutputMode::Ssr,
        CompilerOutputMode::Client => OutputMode::Client,
        CompilerOutputMode::Lint => OutputMode::Lint,
    };

    let mut hir = react_compiler_lowering::lower(func, fn_name, scope_info, &mut env)?;

    let debug_hir = debug_print::debug_hir(&hir, &env);
    context.log_debug(DebugLogEntry::new("HIR", debug_hir));

    react_compiler_optimization::prune_maybe_throws(&mut hir).map_err(|diag| {
        let mut err = CompilerError::new();
        err.push_diagnostic(diag);
        err
    })?;

    let debug_prune = debug_print::debug_hir(&hir, &env);
    context.log_debug(DebugLogEntry::new("PruneMaybeThrows", debug_prune));

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
