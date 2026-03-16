use napi_derive::napi;
use react_compiler_ast::{File, scope::ScopeInfo};
use react_compiler::entrypoint::{PluginOptions, compile_program};

/// Main entry point for the React Compiler.
///
/// Receives a full program AST, scope information, and resolved options
/// as JSON strings. Returns a JSON string containing the CompileResult.
///
/// This function is called by the JS shim (bridge.ts) via napi-rs.
#[napi]
pub fn compile(
    ast_json: String,
    scope_json: String,
    options_json: String,
) -> napi::Result<String> {
    let ast: File = serde_json::from_str(&ast_json)
        .map_err(|e| napi::Error::from_reason(format!("Failed to parse AST JSON: {}", e)))?;

    let scope: ScopeInfo = serde_json::from_str(&scope_json)
        .map_err(|e| napi::Error::from_reason(format!("Failed to parse scope JSON: {}", e)))?;

    let opts: PluginOptions = serde_json::from_str(&options_json)
        .map_err(|e| napi::Error::from_reason(format!("Failed to parse options JSON: {}", e)))?;

    let result = compile_program(ast, scope, opts);

    serde_json::to_string(&result)
        .map_err(|e| napi::Error::from_reason(format!("Failed to serialize result: {}", e)))
}
