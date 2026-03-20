# Review: react_compiler_inference/src/analyse_functions.rs

## Corresponding TypeScript source
- `compiler/packages/babel-plugin-react-compiler/src/Inference/AnalyseFunctions.ts`

## Summary
The Rust port is structurally accurate and complete. All core logic is preserved with appropriate architectural adaptations for arenas and the function callback pattern.

## Major Issues
None.

## Moderate Issues
None.

## Minor Issues

### 1. Missing logger call for invariant error case
**Location:** `analyse_functions.rs:66-69`
**TypeScript:** `AnalyseFunctions.ts` does not have an early return on invariant errors
**Issue:** The Rust version has early-return logic when `env.has_invariant_errors()` is true (lines 66-69), which differs from the TS version that doesn't explicitly check for errors during the loop. This is likely a Rust-specific addition to handle Result propagation, but should be verified as intentional.

### 2. Typo in panic message
**Location:** `analyse_functions.rs:158`
**TypeScript:** `AnalyseFunctions.ts:79`
**Issue:** Typo in panic message: `"[AnalyzeFunctions]"` should be `"[AnalyseFunctions]"` (note the 's' at the end) to match TS.

### 3. Debug logger signature difference
**Location:** `analyse_functions.rs:35-38, 174`
**TypeScript:** `AnalyseFunctions.ts:122-126`
**Issue:** The Rust version takes a `debug_logger: &mut F where F: FnMut(&HirFunction, &Environment)` callback parameter, while the TS version directly calls `fn.env.logger?.debugLogIRs?.(...)`. This is an architectural difference - the Rust version doesn't have `env.logger` available on functions, so it requires the callback to be passed in. This is intentional but worth documenting.

## Architectural Differences

### 1. Function arena and placeholder pattern
**Location:** `analyse_functions.rs:58-61, 87, 177-206`
**Reason:** Rust requires using `std::mem::replace` to temporarily move a function out of the arena to avoid simultaneous mutable borrows. The `placeholder_function()` helper creates a temporary dummy function that is never read. In TypeScript, the function objects are directly accessible via references without this complication.

### 2. Debug logger as callback parameter
**Location:** `analyse_functions.rs:35-38, 64, 94-96, 174`
**Reason:** TypeScript accesses `fn.env.logger?.debugLogIRs` directly. Rust separates `Environment` from `HirFunction` (per architecture doc), and doesn't store logger on env, so the caller must pass in a debug callback.

### 3. Manual scope field management
**Location:** `analyse_functions.rs:78-84`
**TypeScript:** `AnalyseFunctions.ts:28-39`
**Reason:** In TypeScript, `operand.identifier.scope = null` directly nulls the reference. In Rust, identifiers are accessed via arena index: `env.identifiers[operand.identifier.0 as usize].scope = None`. Additionally, the Rust version explicitly clears the scope field (line 83), while TypeScript relies on the range reset to effectively detach from the scope.

## Missing from Rust Port
None. All functions, logic paths, and error handling are present.

## Additional in Rust Port

### 1. Invariant error check and early return
**Location:** `analyse_functions.rs:66-69`
**Addition:** The Rust version checks `if env.has_invariant_errors()` and returns early from processing further inner functions. This is not present in TypeScript but aligns with Rust's error propagation model.

### 2. Placeholder function helper
**Location:** `analyse_functions.rs:177-206`
**Addition:** A helper function `placeholder_function()` is added to support the arena swap pattern. Not needed in TypeScript.

### 3. Explicit `use` statements
**Location:** `analyse_functions.rs:15-22`
**Addition:** Rust requires explicit imports. TypeScript equivalent is at `AnalyseFunctions.ts:8-15`.
