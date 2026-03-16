// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

//! Compilation pipeline for a single function.
//!
//! Analogous to TS `Pipeline.ts` (`compileFn` → `run` → `runWithEnvironment`).
//! Currently only runs BuildHIR (lowering); optimization passes will be added later.

use react_compiler_ast::scope::ScopeInfo;
use react_compiler_hir::environment::Environment;
use react_compiler_hir::ReactFunctionType;
use react_compiler_lowering::FunctionNode;

use super::compile_result::DebugLogEntry;
use super::plugin_options::PluginOptions;
use crate::debug_print;

/// Error type for pipeline failures.
pub enum CompileError {
    Lowering(String),
}

/// Run the compilation pipeline on a single function.
///
/// Currently: creates an Environment, runs BuildHIR (lowering), and produces
/// debug output. Returns debug log entries on success.
pub fn compile_fn(
    func: &FunctionNode<'_>,
    fn_name: Option<&str>,
    scope_info: &ScopeInfo,
    fn_type: ReactFunctionType,
    _options: &PluginOptions,
) -> Result<Vec<DebugLogEntry>, CompileError> {
    let mut env = Environment::new();
    env.fn_type = fn_type;

    let hir = react_compiler_lowering::lower(func, fn_name, scope_info, &mut env)
        .map_err(|e| CompileError::Lowering(debug_print::format_errors(&e)))?;

    let debug_hir = debug_print::debug_hir(&hir, &env);

    Ok(vec![DebugLogEntry {
        kind: "hir",
        name: format!(
            "BuildHIR{}",
            fn_name.map(|n| format!(": {}", n)).unwrap_or_default()
        ),
        value: debug_hir,
    }])
}
