# Review: compiler/crates/react_compiler/src/entrypoint/pipeline.rs

## Corresponding TypeScript file(s)
- `compiler/packages/babel-plugin-react-compiler/src/Entrypoint/Pipeline.ts`

## Summary
The Rust `pipeline.rs` ports the compilation pipeline from `Pipeline.ts`. The TS `run`/`runWithEnvironment` function runs the full compilation pipeline (lower -> many passes -> codegen). The Rust version currently implements a partial pipeline: lowering, PruneMaybeThrows, validateContextVariableLValues, validateUseMemo, DropManualMemoization, InlineIIFEs, MergeConsecutiveBlocks, EnterSSA, EliminateRedundantPhi, ConstantPropagation, InferTypes, validation hooks, and OptimizePropsMethodCalls. Many later passes are not yet implemented.

## Major Issues

1. **Most pipeline passes are missing**: The TS pipeline has ~40+ passes from lowering to codegen. The Rust version implements approximately 12 of these. All passes after `OptimizePropsMethodCalls` are missing:
   - `analyseFunctions`
   - `inferMutationAliasingEffects`
   - `optimizeForSSR`
   - `deadCodeElimination`
   - second `pruneMaybeThrows`
   - `inferMutationAliasingRanges`
   - All validation passes after InferTypes (validateLocalsNotReassignedAfterRender, assertValidMutableRanges, validateNoRefAccessInRender, validateNoSetStateInRender, validateNoDerivedComputationsInEffects, validateNoSetStateInEffects, validateNoJSXInTryStatement, validateNoFreezingKnownMutableFunctions)
   - `inferReactivePlaces`
   - `rewriteInstructionKindsBasedOnReassignment`
   - `validateStaticComponents`
   - `inferReactiveScopeVariables`
   - `memoizeFbtAndMacroOperandsInSameScope`
   - All reactive scope passes
   - `buildReactiveFunction`
   - `codegenFunction`
   - All post-codegen validations
   `/compiler/crates/react_compiler/src/entrypoint/pipeline.rs:28:1`

## Moderate Issues

1. **`validateUseMemo` return value handling differs**: In the TS, `validateUseMemo(hir)` is called as a void function -- it records errors on `env` via `env.recordError()`. The Rust version captures the return value and manually logs each error detail as a `CompileError` event. The TS version's `env.logErrors()` behavior is replicated but through a custom code path that converts diagnostics to `CompilerErrorDetailInfo` manually.
   `/compiler/crates/react_compiler/src/entrypoint/pipeline.rs:76:1`

2. **`enableDropManualMemoization` check is commented out**: The TS gates `dropManualMemoization` behind `env.enableDropManualMemoization`. The Rust comment says "TS gates this on `enableDropManualMemoization`, but it returns true for all output modes, so we run it unconditionally." While currently correct (the TS getter always returns `true`), if the TS logic changes, this would diverge.
   `/compiler/crates/react_compiler/src/entrypoint/pipeline.rs:120:1`

3. **Missing `assertConsistentIdentifiers` calls**: The TS pipeline calls `assertConsistentIdentifiers(hir)` after `mergeConsecutiveBlocks` and after `eliminateRedundantPhi`. The Rust version does not call any assertion/validation between passes (except the explicit ones like `validateContextVariableLValues`).
   `/compiler/crates/react_compiler/src/entrypoint/pipeline.rs:142:1`

4. **Missing `assertTerminalSuccessorsExist` call**: The TS calls `assertTerminalSuccessorsExist(hir)` after `mergeConsecutiveBlocks`. The Rust does not.
   `/compiler/crates/react_compiler/src/entrypoint/pipeline.rs:142:1`

5. **Missing `EnvironmentConfig` debug log**: The TS pipeline logs `{ kind: 'debug', name: 'EnvironmentConfig', value: prettyFormat(env.config) }` at the start. The Rust version logs this in `compile_program` (in `program.rs`) instead of in `compile_fn`. This means the config is logged once per program rather than once per function.
   `/compiler/crates/react_compiler/src/entrypoint/pipeline.rs:28:1`

6. **Missing `findContextIdentifiers` call**: The TS calls `findContextIdentifiers(func)` before creating the Environment and passes the result to the Environment constructor. The Rust version does not call this (context identifiers are presumably handled differently or not yet needed).
   `/compiler/crates/react_compiler/src/entrypoint/pipeline.rs:37:1`

7. **Invariant error handling after lowering**: The Rust has a special check after lowering: `if env.has_invariant_errors() { return Err(env.take_invariant_errors()); }`. The TS does not have this explicit check -- invariant errors in the TS throw immediately from `env.recordError()`, aborting `lower()`. The Rust version defers the check, which means lowering might produce a partial HIR before the invariant is checked. The comment explains this is by design.
   `/compiler/crates/react_compiler/src/entrypoint/pipeline.rs:51:1`

8. **Error conversion pattern**: The Rust wraps pass errors with `map_err(|diag| { let mut err = CompilerError::new(); err.push_diagnostic(diag); err })`. This is used for `prune_maybe_throws`, `drop_manual_memoization`, and `enter_ssa`. In the TS, these passes either throw `CompilerError` directly or record errors on `env`. The Rust pattern of wrapping individual diagnostics into `CompilerError` is consistent but verbose.
   `/compiler/crates/react_compiler/src/entrypoint/pipeline.rs:58:1`

9. **`validate_no_capitalized_calls` condition differs**: The TS checks `env.config.validateNoCapitalizedCalls` as a truthy value. The Rust checks `env.config.validate_no_capitalized_calls.is_some()`. If the TS config has a falsy non-null value, the behavior would differ, but the TS type is `ExternalFunction | null` so `null` = disabled, non-null = enabled. Equivalent.
   `/compiler/crates/react_compiler/src/entrypoint/pipeline.rs:185:1`

## Minor Issues

1. **`compile_fn` signature differs from TS `compileFn`**: The TS `compileFn` takes a Babel `NodePath`, `EnvironmentConfig`, `ReactFunctionType`, `CompilerOutputMode`, `ProgramContext`, `Logger | null`, `filename: string | null`, `code: string | null`. The Rust `compile_fn` takes `&FunctionNode`, `fn_name: Option<&str>`, `&ScopeInfo`, `ReactFunctionType`, `CompilerOutputMode`, `&EnvironmentConfig`, `&mut ProgramContext`. The Rust version doesn't take `logger`, `filename`, or `code` separately (they're on `ProgramContext`).
   `/compiler/crates/react_compiler/src/entrypoint/pipeline.rs:28:1`

2. **`run` and `runWithEnvironment` are merged**: The TS splits the pipeline into `run` (creates Environment) and `runWithEnvironment` (runs passes). The Rust combines both into a single `compile_fn`. The TS split was intentional to keep `config` out of scope during pass execution. The Rust version moves `env_config` into the Environment at the start, achieving the same effect differently.
   `/compiler/crates/react_compiler/src/entrypoint/pipeline.rs:28:1`

3. **Debug log kind**: The TS logs HIR as `{ kind: 'hir', name: '...', value: hir }`. The Rust logs as `DebugLogEntry::new("...", debug_string)` which always uses `kind: "debug"`. This means the TS logger receives structured HIR objects while the Rust logger receives stringified representations.
   `/compiler/crates/react_compiler/src/entrypoint/pipeline.rs:55:1`

4. **`throwUnknownException__testonly` not implemented**: The TS has a test-only flag that throws an unexpected error for testing error handling. Not present in Rust.
   `/compiler/crates/react_compiler/src/entrypoint/pipeline.rs:28:1`

5. **`enter_ssa` error conversion**: The Rust converts the `CompilerDiagnostic` from `enter_ssa` into a `CompilerErrorDetail` (extracting `primary_location`, `category`, `reason`, etc.). This is because the TS `EnterSSA` uses `CompilerError.throwTodo()` which creates a `CompilerErrorDetail`. The Rust conversion explicitly replicates this.
   `/compiler/crates/react_compiler/src/entrypoint/pipeline.rs:147:1`

## Architectural Differences

1. **Environment creation**: The TS creates an `Environment` with many constructor parameters including `func.scope`, `contextIdentifiers`, `func` (path), `logger`, `filename`, `code`, and `programContext`. The Rust creates a minimal `Environment` with just the config, then sets `fn_type` and `output_mode`.
   `/compiler/crates/react_compiler/src/entrypoint/pipeline.rs:37:1`

2. **Separate `env` and `hir`**: Per the architecture document, the Rust passes `env: &mut Environment` separately from `hir: &mut HirFunction`. The TS passes `hir` which contains an `env` reference.
   `/compiler/crates/react_compiler/src/entrypoint/pipeline.rs:45:1`

## Missing TypeScript Features

1. **~30 pipeline passes** from `analyseFunctions` through `codegenFunction` and post-codegen validation.
2. **`findContextIdentifiers`** pre-pass.
3. **`assertConsistentIdentifiers`** and **`assertTerminalSuccessorsExist`** debug assertions.
4. **Structured HIR/reactive function logging** (currently string-only).
5. **`throwUnknownException__testonly`** flag.
6. **`Result` return type** wrapping: The TS returns `Result<CodegenFunction, CompilerError>`. The Rust also returns `Result<CodegenFunction, CompilerError>`, which is consistent.
