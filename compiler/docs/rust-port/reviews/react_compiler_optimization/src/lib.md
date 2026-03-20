# Review: react_compiler_optimization/src/lib.rs

## Corresponding TypeScript source
- Various files in `compiler/packages/babel-plugin-react-compiler/src/Optimization/` and other directories

## Summary
The lib.rs file serves as the crate's public API, re-exporting all optimization passes. All expected passes are present except merge_consecutive_blocks which is intentionally not exported (used internally).

## Major Issues
None

## Moderate Issues
None

## Minor Issues

### Missing merge_consecutive_blocks export
- **Rust (line 5)**: Has `pub mod merge_consecutive_blocks` but no corresponding `pub use` statement
- **Impact**: None if intentional - the module is used internally by other passes (prune_maybe_throws, inline_iifes, constant_propagation) but may not need to be public API
- **TS equivalent**: `mergeConsecutiveBlocks` is exported from `src/HIR/MergeConsecutiveBlocks.ts` and used by multiple passes

## Architectural Differences
None - this is a standard Rust module structure file

## Missing from Rust Port
None of the declared modules are missing implementations (except outline_jsx which is a documented stub)

## Additional in Rust Port
None
