# Review: compiler/crates/react_compiler_optimization/src/lib.rs

## Corresponding TypeScript file(s)
- No direct TS equivalent. This is the Rust crate module root.

## Summary
The lib.rs file declares and re-exports the public modules of the `react_compiler_optimization` crate. It correctly maps to the set of optimization passes. The `merge_consecutive_blocks` module is declared but not re-exported (it is used internally by other passes). This is a clean and minimal module root.

## Major Issues
None.

## Moderate Issues
None.

## Minor Issues

1. **`merge_consecutive_blocks` is declared as `pub mod` but not re-exported**
   - Rust file: `compiler/crates/react_compiler_optimization/src/lib.rs:5`
   - The module is `pub mod merge_consecutive_blocks` which makes it accessible from outside the crate, but it is not re-exported via `pub use`. The function is used by `constant_propagation` and `inline_iifes` internally via `crate::merge_consecutive_blocks::merge_consecutive_blocks`. This is intentional -- it's a utility used by other passes in the same crate.

## Architectural Differences

1. **Crate boundary: The TS `MergeConsecutiveBlocks` is in `src/HIR/`, not `src/Optimization/`**
   - Rust file: `compiler/crates/react_compiler_optimization/src/lib.rs:5`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/HIR/MergeConsecutiveBlocks.ts`
   - In TS, `mergeConsecutiveBlocks` is part of the HIR module. In Rust, it's part of the `react_compiler_optimization` crate. This is a deliberate organizational choice for the Rust port since it's primarily used by optimization passes.

2. **`DropManualMemoization` and `InlineIIFEs` are in `src/Inference/` in TS, but in `react_compiler_optimization` in Rust**
   - TS: `compiler/packages/babel-plugin-react-compiler/src/Inference/DropManualMemoization.ts`
   - TS: `compiler/packages/babel-plugin-react-compiler/src/Inference/InlineImmediatelyInvokedFunctionExpressions.ts`
   - Rust: `compiler/crates/react_compiler_optimization/src/`
   - These passes are categorized differently between TS and Rust.

## Missing TypeScript Features
None.
