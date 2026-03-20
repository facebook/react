# Review: react_compiler_lowering/src/lib.rs

## Corresponding TypeScript source
- N/A (module aggregator, no direct TypeScript equivalent)

## Summary
This is a crate-level module file that re-exports the main lowering functions and types. No direct TypeScript equivalent exists as TypeScript modules work differently.

## Major Issues
None.

## Moderate Issues
None.

## Minor Issues
None.

## Architectural Differences
- **Rust module system**: This file uses `pub mod` declarations and re-exports to expose the crate's public API, which is idiomatic Rust. TypeScript files are directly importable without needing an index file.
- **FunctionNode enum**: Introduced as a Rust-idiomatic replacement for TypeScript's `NodePath<t.Function>` / `BabelFn` type, providing a type-safe way to reference function AST nodes.

## Missing from Rust Port
None.

## Additional in Rust Port
- `convert_binding_kind()`: Helper function to convert AST binding kinds to HIR binding kinds
- `FunctionNode` enum: Type-safe wrapper for function AST node references
