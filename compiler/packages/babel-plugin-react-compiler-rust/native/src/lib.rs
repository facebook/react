use napi_derive::napi;
use react_compiler_ast::{File, scope::ScopeInfo};
use react_compiler::entrypoint::{PluginOptions, compile_program};
use react_compiler::timing::TimingEntry;
use std::time::Instant;

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
    // Check if profiling is enabled by peeking at the options JSON
    let profiling = options_json.contains("\"__profiling\":true");

    let deser_start = Instant::now();

    let ast: File = serde_json::from_str(&ast_json)
        .map_err(|e| napi::Error::from_reason(format!("Failed to parse AST JSON: {}", e)))?;

    let scope: ScopeInfo = serde_json::from_str(&scope_json)
        .map_err(|e| napi::Error::from_reason(format!("Failed to parse scope JSON: {}", e)))?;

    let opts: PluginOptions = serde_json::from_str(&options_json)
        .map_err(|e| napi::Error::from_reason(format!("Failed to parse options JSON: {}", e)))?;

    let deser_duration = deser_start.elapsed();

    let compile_start = Instant::now();
    let mut result = compile_program(ast, scope, opts);
    let compile_duration = compile_start.elapsed();

    // If profiling is enabled, prepend NAPI deserialization timing and append serialization timing
    if profiling {
        let napi_deser_entry = TimingEntry {
            name: "napi_deserialize".to_string(),
            duration_us: deser_duration.as_micros() as u64,
        };

        // Insert NAPI timing entries
        match &mut result {
            react_compiler::entrypoint::CompileResult::Success { timing, .. } => {
                timing.insert(0, napi_deser_entry);
            }
            react_compiler::entrypoint::CompileResult::Error { timing, .. } => {
                timing.insert(0, napi_deser_entry);
            }
        }

        // Add compile_program duration (the total Rust compilation time including pass timing)
        let compile_entry = TimingEntry {
            name: "napi_compile_program".to_string(),
            duration_us: compile_duration.as_micros() as u64,
        };
        match &mut result {
            react_compiler::entrypoint::CompileResult::Success { timing, .. } => {
                timing.push(compile_entry);
            }
            react_compiler::entrypoint::CompileResult::Error { timing, .. } => {
                timing.push(compile_entry);
            }
        }
    }

    let ser_start = Instant::now();
    let result_json = serde_json::to_string(&result)
        .map_err(|e| napi::Error::from_reason(format!("Failed to serialize result: {}", e)))?;

    if profiling {
        // We need to inject the serialization timing into the already-serialized JSON.
        // Since timing is a JSON array at the end of the result, we can append to it.
        let ser_duration = ser_start.elapsed();
        let ser_entry = format!(
            r#"{{"name":"napi_serialize","duration_us":{}}}"#,
            ser_duration.as_micros()
        );

        // Find the timing array in the JSON and append our entry
        if let Some(pos) = result_json.rfind("\"timing\":[") {
            // Find the closing ] of the timing array
            let timing_start = pos + "\"timing\":[".len();
            if let Some(close_bracket) = result_json[timing_start..].rfind(']') {
                let abs_close = timing_start + close_bracket;
                let mut patched = result_json[..abs_close].to_string();
                if abs_close > timing_start {
                    // Array is non-empty, add comma
                    patched.push(',');
                }
                patched.push_str(&ser_entry);
                patched.push_str(&result_json[abs_close..]);
                return Ok(patched);
            }
        }
    }

    Ok(result_json)
}
