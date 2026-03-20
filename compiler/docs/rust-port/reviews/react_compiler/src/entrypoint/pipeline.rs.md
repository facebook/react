# Review: react_compiler/src/entrypoint/pipeline.rs

## Corresponding TypeScript source
- `compiler/packages/babel-plugin-react-compiler/src/Entrypoint/Pipeline.ts`

## Summary
Comprehensive port of compilation pipeline with all 31 HIR passes correctly orchestrated. Debug logging matches TypeScript output format. Some passes are TODOs but structure is complete.

## Major Issues
None - all ported passes are correctly implemented.

## Moderate Issues

### 1. Missing validation passes (pipeline.rs:272-289, 298-303)
Several validation passes commented as TODO:
- `validateLocalsNotReassignedAfterRender` (line 273)
- `validateNoRefAccessInRender` (line 279)
- `validateNoSetStateInRender` (line 284)
- `validateNoFreezingKnownMutableFunctions` (line 288)
- `validateExhaustiveDependencies` (line 301)

These are logged as "ok" but not actually run. Should either:
1. Port the validations, or
2. Remove the log entries until implemented

### 2. Missing reactive passes (pipeline.rs:397-408)
Many reactive passes are TODO comments:
- `buildReactiveFunction`
- `assertWellFormedBreakTargets`
- `pruneUnusedLabels`
- `assertScopeInstructionsWithinScopes`
- `pruneNonEscapingScopes`
- `pruneNonReactiveDependencies`
- `pruneUnusedScopes`
- `mergeReactiveScopesThatInvalidateTogether`
- `pruneAlwaysInvalidatingScopes`
- `propagateEarlyReturns`
- `pruneUnusedLValues`
- `promoteUsedTemporaries`
- `extractScopeDeclarationsFromDestructuring`
- `stabilizeBlockIds`
- `renameVariables`
- `pruneHoistedContexts`

These are all marked as skipped by test harness (kind: 'reactive', kind: 'ast').

**Status**: Expected - these are later pipeline stages not yet ported.

### 3. Inconsistent error handling patterns (pipeline.rs:126-130, 159-172, 235-246)
Three different error handling patterns used:

**Pattern 1** - map_err with manual error construction (line 58-64):
```rust
react_compiler_optimization::prune_maybe_throws(&mut hir, &mut env.functions).map_err(
    |diag| {
        let mut err = CompilerError::new();
        err.push_diagnostic(diag);
        err
    },
)?;
```

**Pattern 2** - check error count delta (line 234-244):
```rust
let errors_before = env.error_count();
react_compiler_inference::infer_mutation_aliasing_effects(&mut hir, &mut env, false);
if env.error_count() > errors_before {
    return Err(env.take_errors_since(errors_before));
}
```

**Pattern 3** - check has_invariant_errors (line 47-53, 220-226):
```rust
if env.has_invariant_errors() {
    return Err(env.take_invariant_errors());
}
```

**Issue**: Inconsistency makes it unclear which pattern to use where. Needs documentation.

**TypeScript** uses `env.tryRecord(() => pass())` wrapper consistently for validation passes, and lets other passes throw directly.

## Minor Issues

### 1. Placeholder CodegenFunction (pipeline.rs:424-432)
Returns zeroed memo stats. Expected placeholder until codegen ported.

### 2. VoidUseMemo error handling (pipeline.rs:79-122)
Complex manual mapping from `CompilerErrorOrDiagnostic` to `CompilerErrorItemInfo`. This could be simplified with a helper function.

### 3. Magic numbers in error logging (pipeline.rs:234, 242)
Uses `env.error_count()` deltas to detect new errors. Could be fragile if error count changes for other reasons.

## Architectural Differences

### 1. Early invariant error checking (pipeline.rs:47-53, 220-226)
**Intentional**: Rust checks `env.has_invariant_errors()` and returns early at strategic points:
- After lowering (line 47-53)
- After AnalyseFunctions (line 220-226)

This mimics TS behavior where `CompilerError.invariant()` throws immediately and aborts compilation.

### 2. Separate env parameter (pipeline.rs:28-36)
**Intentional**: `env: &mut Environment` passed separately from `hir`. TS has `env` embedded in `hir.env`.

Documented in rust-port-architecture.md. Allows precise borrow splitting.

### 3. Debug logging via context (pipeline.rs:56, 67, etc.)
**Rust**: `context.log_debug(DebugLogEntry::new(...))`
**TypeScript**: `env.logger?.debugLogIRs?.({...})`

Both achieve same result but Rust collects logs for later serialization instead of immediate callback.

### 4. Inner function logging (pipeline.rs:214-229)
Rust collects inner function logs in `Vec<String>` then emits them after AnalyseFunctions. TypeScript logs immediately via callback.

**Intentional**: Rust must collect before checking for errors to maintain correct log order.

## Missing from Rust Port

All TODO reactive/ast passes listed in Moderate Issues #2. Expected to be ported incrementally.

## Additional in Rust Port

### 1. Explicit error count tracking (pipeline.rs:234, 242)
Uses `env.error_count()` and `env.take_errors_since()` to detect errors during passes that don't return Result.

TypeScript doesn't need this - errors throw or are checked via `env.hasErrors()` at the end.

### 2. Invariant error separation (pipeline.rs:51)
Checks `env.has_invariant_errors()` separately from other errors.

TypeScript doesn't distinguish - all errors are in one collection and throwing an invariant aborts via exception.

Rust's Result-based approach requires explicit checking at strategic points.
