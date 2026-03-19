# Review: compiler/crates/react_compiler/src/entrypoint/compile_result.rs

## Corresponding TypeScript file(s)
- `compiler/packages/babel-plugin-react-compiler/src/Entrypoint/Options.ts` (LoggerEvent types, CompilerOutputMode)
- `compiler/packages/babel-plugin-react-compiler/src/Entrypoint/Program.ts` (CompileResult type, CodegenFunction usage)
- `compiler/packages/babel-plugin-react-compiler/src/ReactiveScopes/CodegenFunction.ts` (CodegenFunction shape)

## Summary
This file defines the serializable result types returned from the Rust compiler to the JS shim. It combines types that are spread across several TS files. The `CompileResult` enum, `LoggerEvent` enum, `CodegenFunction`, and `DebugLogEntry` types are all novel Rust-side constructs for the JS-Rust bridge. The `LoggerEvent` variants correspond to the TS `LoggerEvent` union type, and `CompileResult` is a Rust-specific envelope for returning results via JSON serialization.

## Major Issues
None.

## Moderate Issues

1. **Missing `TimingEvent` variant**: The TS `LoggerEvent` union includes a `TimingEvent` variant with `kind: 'Timing'` and a `PerformanceMeasure` field. The Rust `LoggerEvent` enum does not include this variant.
   `/compiler/crates/react_compiler/src/entrypoint/compile_result.rs:120:1`

2. **Missing `CompileDiagnosticEvent` variant**: The TS `LoggerEvent` union includes `CompileDiagnosticEvent` with `kind: 'CompileDiagnostic'`. The Rust `LoggerEvent` does not have this variant.
   `/compiler/crates/react_compiler/src/entrypoint/compile_result.rs:120:1`

3. **`CompileResult` structure differs from TS**: In TS, `CompileResult` is `{ kind: 'original' | 'outlined'; originalFn: BabelFn; compiledFn: CodegenFunction }`. The Rust `CompileResult` is an enum of `Success { ast, events, ... }` or `Error { error, events, ... }`. These serve different purposes -- the Rust version is the top-level return type for the entire program compilation (like what `compileProgram` returns to JS), while the TS `CompileResult` is per-function. This is an architectural difference, not a bug.
   `/compiler/crates/react_compiler/src/entrypoint/compile_result.rs:9:1`

4. **`NonLocalImportSpecifier` missing `kind` field**: The TS `NonLocalImportSpecifier` type (in `HIR/Environment.ts`) has a `kind: 'ImportSpecifier'` field. The Rust `NonLocalImportSpecifier` in `imports.rs` omits this field. This could cause issues if the kind is checked downstream.
   `/compiler/crates/react_compiler/src/entrypoint/imports.rs:27:1`

## Minor Issues

1. **`CodegenFunction` is a placeholder**: The Rust `CodegenFunction` has only stub fields (`memo_slots_used: u32`, etc.) with no `id`, `params`, `body`, `async`, `generator` fields that the TS `CodegenFunction` has. This is expected since codegen is not yet implemented.
   `/compiler/crates/react_compiler/src/entrypoint/compile_result.rs:98:1`

2. **`OutlinedFunction` differs**: In TS, the outlined function type from `CodegenFunction.outlined` is `{ fn: CodegenFunction; type: ReactFunctionType | null }`. The Rust version uses `fn_type: Option<ReactFunctionType>` which matches the semantics.
   `/compiler/crates/react_compiler/src/entrypoint/compile_result.rs:111:1`

3. **`LoggerEvent::CompileSkip` uses `String` for reason**: The TS `CompileSkipEvent` has `reason: string` which matches, but the `loc` field in TS is `t.SourceLocation | null` while Rust uses `Option<SourceLocation>`. Both represent the same thing.
   `/compiler/crates/react_compiler/src/entrypoint/compile_result.rs:142:1`

4. **`DebugLogEntry.kind` is a static `&'static str`**: Always `"debug"`. In the TS, `CompilerPipelineValue` has multiple kinds: `'ast'`, `'hir'`, `'reactive'`, `'debug'`. The Rust version only supports the `'debug'` kind since it serializes HIR as strings rather than structured data.
   `/compiler/crates/react_compiler/src/entrypoint/compile_result.rs:81:1`

5. **`CompilerErrorInfo` / `CompilerErrorDetailInfo` are Rust-specific serialization types**: These don't have direct TS counterparts. They are used to serialize `CompilerError` / `CompilerErrorDetail` into JSON for the JS shim. The serialization format appears consistent with how the TS logger receives error details.
   `/compiler/crates/react_compiler/src/entrypoint/compile_result.rs:43:1`

## Architectural Differences

1. **Serialization boundary**: The entire `CompileResult` is `#[derive(Serialize)]` for JSON serialization to the JS shim. This is a Rust-specific concern. The TS version directly manipulates Babel AST nodes.
   `/compiler/crates/react_compiler/src/entrypoint/compile_result.rs:7:1`

2. **`OrderedLogItem` is Rust-specific**: The TS version doesn't need an ordered log since events are dispatched via callbacks. The Rust version collects all events and returns them as a batch.
   `/compiler/crates/react_compiler/src/entrypoint/compile_result.rs:34:1`

## Missing TypeScript Features

1. **`TimingEvent` / `PerformanceMeasure` support** is not implemented. This is a minor feature used for performance tracking.
2. **`CompileDiagnosticEvent`** is not implemented.
3. **Full `CodegenFunction`** fields (id, params, body, async, generator, etc.) are not present -- codegen is not yet implemented.
