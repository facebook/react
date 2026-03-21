# Review: compiler/crates/react_compiler_inference/src/analyse_functions.rs

## Corresponding TypeScript Source
- `compiler/packages/babel-plugin-react-compiler/src/Inference/AnalyseFunctions.ts`

## Summary
This Rust port accurately translates the TypeScript implementation of recursive function analysis for nested function expressions and object methods. The port correctly handles the function arena pattern, error checking, and context variable mutable range resetting. The implementation is complete and follows the architectural patterns established for the Rust port.

## Issues

### Major Issues
None found.

### Moderate Issues

1. **compiler/crates/react_compiler_inference/src/analyse_functions.rs:66-69** - Early return on invariant errors differs from TS behavior
   - **TS behavior**: In TypeScript (line 23), `lowerWithMutationAliasing` is called without try-catch. If `inferMutationAliasingEffects` throws a `CompilerError.invariant()`, it propagates up immediately and terminates the entire compilation.
   - **Rust behavior**: The Rust code checks `env.has_invariant_errors()` after each inner function and returns early if found. This means subsequent inner functions in the same parent are not processed.
   - **Impact**: In TypeScript, an invariant error in one inner function would throw and abort the entire compilation pipeline. In Rust, it stops processing remaining inner functions in the current scope but doesn't immediately propagate the error. This could lead to different error reporting behavior if there are multiple inner functions and an early one has an invariant error.
   - **Recommendation**: This is consistent with the Rust port's error handling architecture but represents a behavioral difference from TypeScript worth documenting.

2. **compiler/crates/react_compiler_inference/src/analyse_functions.rs:122-125** - Error handling for `rewriteInstructionKindsBasedOnReassignment` differs from TS
   - **TS behavior**: TypeScript (line 58) calls `rewriteInstructionKindsBasedOnReassignment(fn)` without try-catch. Errors thrown from this function propagate up.
   - **Rust behavior**: Returns a `Result` and merges errors into `env.errors`, then returns early.
   - **Impact**: Non-fatal errors are accumulated rather than aborting. This matches Rust error handling architecture but changes control flow compared to TS.
   - **Note**: This is consistent with the Rust port's fault-tolerant error handling design described in the architecture document.

### Minor/Stylistic Issues

1. **compiler/crates/react_compiler_inference/src/analyse_functions.rs:161** - Panic vs invariant for Apply effects
   - Rust uses `panic!(...)` for unexpected Apply effects (line 161).
   - TS uses `CompilerError.invariant(false, {...})` (lines 79-82).
   - **Impact**: Rust panic will abort immediately, TS invariant throws. Both prevent further execution. Consider using `CompilerError::invariant()` for consistency with TS if a diagnostic error type is available.

2. **compiler/crates/react_compiler_inference/src/analyse_functions.rs:161** - Message typo in panic
   - The panic message says `"[AnalyzeFunctions]"` (line 161).
   - TS says `"[AnalyzeFunctions]"` (line 79).
   - **Impact**: Minor inconsistency in error message prefix. Both spellings appear in the codebase - "Analyze" in the message, "Analyse" in the filename.

## Architectural Differences

1. **Function Arena Pattern**: The Rust implementation uses `std::mem::replace` to temporarily extract functions from `env.functions` (lines 58-60, 87) to avoid borrow conflicts. TypeScript can directly access `instr.value.loweredFunc.func` since there's no borrow checker. This is a necessary and correct adaptation for Rust.

2. **Debug Logger as Callback**: The Rust version takes `debug_logger: &mut F` as a generic callback parameter (line 35), while TypeScript accesses `fn.env.logger?.debugLogIRs` directly (line 122). This is required because Rust separates `env` from `HirFunction` and the logger lives on `env` but needs to be called after function processing when the caller has access to both.

3. **Error Accumulation**: The Rust implementation accumulates errors in `env.errors` and checks `env.has_invariant_errors()`, while TypeScript relies on exceptions. This follows the Rust port's fault-tolerant error handling architecture where passes accumulate errors and check at the end rather than aborting on first error.

4. **Placeholder Function**: The `placeholder_function()` helper (lines 184-209) is Rust-specific, needed for the `mem::replace` pattern. TypeScript doesn't need this since it can keep references to functions being processed.

## Completeness

The Rust port is functionally complete compared to the TypeScript source:

✅ Recursive analysis of nested function expressions and object methods
✅ Correct pass ordering: `analyse_functions`, `inferMutationAliasingEffects`, `deadCodeElimination`, `inferMutationAliasingRanges`, `rewriteInstructionKindsBasedOnReassignment`, `inferReactiveScopeVariables`
✅ Context variable mutable range resetting (lines 77-84)
✅ Phase 2: Populate context variable effects based on function effects (lines 134-174)
✅ Debug logging callback (line 177)
✅ Aliasing effects assignment to `func.aliasing_effects` (line 130)
✅ All effect kinds handled in Phase 2 match (lines 136-163)

No missing functionality detected.
