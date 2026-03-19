# Review: compiler/crates/react_compiler_lowering/src/lib.rs

## Corresponding TypeScript file(s)
- No single direct TS equivalent. This is a Rust crate entry point that re-exports from submodules and provides shared types used across `BuildHIR.ts` and `HIRBuilder.ts`.

## Summary
This file is the crate root for `react_compiler_lowering`. It declares submodules, provides a `convert_binding_kind` helper, defines the `FunctionNode` enum (analogous to Babel's `NodePath<t.Function>`), and re-exports key functions. The file is clean and well-structured.

## Major Issues
None.

## Moderate Issues
1. **Missing `ObjectMethod` variant in `FunctionNode`**: The TypeScript `BabelFn` type (used in `FindContextIdentifiers.ts:25-29`) includes `ObjectMethod`. The Rust `FunctionNode` enum at `lib.rs:26-30` only has `FunctionDeclaration`, `FunctionExpression`, and `ArrowFunctionExpression`. While `FunctionNode` is primarily used for the top-level `lower()` entry point (where `ObjectMethod` would not appear), the omission means the type does not fully mirror the TS type. Object methods are lowered separately via `lower_function_for_object_method` in `build_hir.rs`, so this is not a functional bug, but it is a structural divergence.

## Minor Issues
1. **Re-export list differs from TS exports**: At `lib.rs:36-46`, several utility functions are re-exported (`remove_dead_do_while_statements`, `remove_unnecessary_try_catch`, `remove_unreachable_for_updates`). In TS, these are all exported from `HIRBuilder.ts` directly. The Rust re-exports additionally include `each_terminal_successor` and `terminal_fallthrough`, which in TS are in a separate file `visitors.ts`, not `HIRBuilder.ts`. This is a minor organizational difference.

2. **`convert_binding_kind` is in lib.rs, not in a submodule**: This utility function at `lib.rs:11-22` has no direct TS equivalent (TS doesn't need explicit conversion since both sides use the same type). This is a Rust-specific utility.

## Architectural Differences
1. **`FunctionNode` enum vs Babel `NodePath<t.Function>`**: At `lib.rs:26-30`, uses a Rust enum with borrowed references instead of Babel's runtime path type. This is an expected architectural difference per the Rust port architecture.

2. **Crate structure**: The `react_compiler_lowering` crate combines `BuildHIR.ts` and `HIRBuilder.ts` into a single crate, as documented in `rust-port-architecture.md`.

## Missing TypeScript Features
None from a crate entry point perspective.
