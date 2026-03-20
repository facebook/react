# Review: react_compiler/src/lib.rs

## Corresponding TypeScript source
- No direct TypeScript equivalent (Rust crate root)

## Summary
Simple crate root module that re-exports from sub-crates. No TypeScript correspondence needed.

## Major Issues
None.

## Moderate Issues
None.

## Minor Issues
None.

## Architectural Differences
None - This is a Rust-specific organizational file.

## Missing from Rust Port
N/A - No TypeScript equivalent exists.

## Additional in Rust Port
This module exists to provide backwards compatibility and a clean API surface for the react_compiler crate. It re-exports from:
- `react_compiler_diagnostics`
- `react_compiler_hir` (aliased as both `react_compiler_hir` and `hir`)
- `react_compiler_hir::environment`
- `react_compiler_lowering::lower`

The re-exports maintain a flat API surface similar to the TypeScript monolithic structure while leveraging Rust's modular crate system.
