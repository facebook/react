use react_compiler_ast::{File, scope::ScopeInfo};
use super::compile_result::{CompileResult, LoggerEvent};
use super::plugin_options::PluginOptions;

/// Main entry point for the React Compiler.
///
/// Receives a full program AST, scope information, and resolved options.
/// Returns a CompileResult indicating whether the AST was modified,
/// along with any logger events.
///
/// This function implements the logic from the TS entrypoint (Program.ts):
/// - shouldSkipCompilation
/// - findFunctionsToCompile
/// - per-function compilation
/// - gating rewrites
/// - import insertion
/// - outlined function insertion
pub fn compile_program(
    _ast: File,
    _scope: ScopeInfo,
    options: PluginOptions,
) -> CompileResult {
    let events: Vec<LoggerEvent> = Vec::new();

    // Check if we should compile this file
    if !options.should_compile {
        return CompileResult::Success {
            ast: None,
            events,
        };
    }

    // TODO: Implement the full compilation pipeline:
    // 1. shouldSkipCompilation (check for existing runtime imports)
    // 2. findFunctionsToCompile (traverse program, apply compilation mode)
    // 3. Per-function compilation (directives, suppressions, compileFn)
    // 4. Apply compiled functions (gating, imports, outlined functions)
    //
    // For now, return no changes (the pipeline passes are not yet implemented)
    CompileResult::Success {
        ast: None,
        events,
    }
}
