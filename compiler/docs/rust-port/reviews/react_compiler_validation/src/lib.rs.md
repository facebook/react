# Review: compiler/crates/react_compiler_validation/src/lib.rs

## Corresponding TypeScript file(s)
- No direct TS equivalent; this is the Rust crate module root.

## Summary
The lib.rs file declares the four validation submodules and re-exports their public functions. It additionally exports `validate_context_variable_lvalues_with_errors`, which has no TS counterpart (it is a Rust-specific API for callers that want to provide their own error sink).

## Major Issues
None.

## Moderate Issues
None.

## Minor Issues

1. **Extra public export `validate_context_variable_lvalues_with_errors`**
   - File: `compiler/crates/react_compiler_validation/src/lib.rs`, line 6, col 1
   - The TS version only has a single export `validateContextVariableLValues`. The Rust version additionally exports `validate_context_variable_lvalues_with_errors`. This is an API surface difference, though it may be intentional for use during lowering.

## Architectural Differences
None beyond the standard Rust module/crate pattern.

## Missing TypeScript Features
None.
