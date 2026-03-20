# Review: react_compiler_ssa/src/lib.rs

## Corresponding TypeScript source
- `compiler/packages/babel-plugin-react-compiler/src/SSA/index.ts`

## Summary
The lib.rs file is a minimal module file that exports the three SSA-related passes. It correctly matches the TypeScript structure and exports all three passes that exist in the TypeScript SSA module.

## Major Issues
None.

## Moderate Issues
None.

## Minor Issues

1. **`enter_ssa` module is `pub mod` while others are private `mod`**: lib.rs:1
   - The `enter_ssa` module is declared as `pub mod` while `eliminate_redundant_phi` and `rewrite_instruction_kinds_based_on_reassignment` are private `mod`.
   - This is intentional: `enter_ssa` is `pub` so that `eliminate_redundant_phi.rs` can access `enter_ssa::placeholder_function()` (used at eliminate_redundant_phi.rs:6).
   - The functions themselves are still publicly re-exported via `pub use` (lines 5-7), so external crates can call all three passes.

2. **Copyright header missing**: lib.rs:1
   - The Rust file lacks the Meta copyright header present in the TypeScript file.

## Architectural Differences

1. **Rust crate structure vs TypeScript directory-based modules**:
   - The TS `index.ts` re-exports from separate files in the same directory.
   - The Rust `lib.rs` uses Rust's module system with `mod` declarations and `pub use` re-exports.
   - This is the standard pattern for each language and is functionally equivalent.

## Missing from Rust Port
None. All three passes from the TypeScript version are present:
- `enterSSA` → `enter_ssa`
- `eliminateRedundantPhi` → `eliminate_redundant_phi`
- `rewriteInstructionKindsBasedOnReassignment` → `rewrite_instruction_kinds_based_on_reassignment`

## Additional in Rust Port
None.
