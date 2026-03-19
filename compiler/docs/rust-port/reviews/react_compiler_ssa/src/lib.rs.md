# Review: compiler/crates/react_compiler_ssa/src/lib.rs

## Corresponding TypeScript file(s)
- compiler/packages/babel-plugin-react-compiler/src/SSA/index.ts

## Summary
The Rust `lib.rs` is a minimal module file that declares submodules and re-exports public functions. It closely mirrors the TS `index.ts` but is missing one export.

## Major Issues

None identified.

## Moderate Issues

None identified.

## Minor Issues

1. **`enter_ssa` module is `pub`, `eliminate_redundant_phi` is not**: In lib.rs:1-2, `enter_ssa` is declared as `pub mod` while `eliminate_redundant_phi` is just `mod`. The `eliminate_redundant_phi` function is still publicly re-exported (line 5), but the module internals (like `rewrite_place`, `rewrite_instruction_lvalues`, etc.) are not accessible from outside the crate. The `enter_ssa` module being `pub` exposes its internals (like `placeholder_function` which is `pub` and used by `eliminate_redundant_phi.rs` via `crate::enter_ssa::placeholder_function`). This is a Rust-specific design choice; making `enter_ssa` pub is needed so `eliminate_redundant_phi` can access `placeholder_function`.
   - Location: lib.rs:1-2

2. **Copyright header missing**: The Rust file lacks the Meta copyright header present in the TS file.
   - Location: lib.rs:1

## Architectural Differences

1. **Crate structure vs directory-based module**: The TS `index.ts` re-exports from a directory-based module system. The Rust `lib.rs` uses Rust's module system with `mod` declarations and `pub use` re-exports. Functionally equivalent.
   - TS location: compiler/packages/babel-plugin-react-compiler/src/SSA/index.ts
   - Rust location: compiler/crates/react_compiler_ssa/src/lib.rs

## Missing TypeScript Features

1. **`rewriteInstructionKindsBasedOnReassignment` not ported**: The TS index.ts (line 10) exports `rewriteInstructionKindsBasedOnReassignment` from `RewriteInstructionKindsBasedOnReassignment.ts`. This pass has no equivalent in the Rust crate. It may not yet be needed in the Rust pipeline or may be planned for later porting.
   - TS location: compiler/packages/babel-plugin-react-compiler/src/SSA/index.ts:10
   - TS implementation: compiler/packages/babel-plugin-react-compiler/src/SSA/RewriteInstructionKindsBasedOnReassignment.ts
