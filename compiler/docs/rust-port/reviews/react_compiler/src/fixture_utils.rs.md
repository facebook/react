# Review: compiler/crates/react_compiler/src/fixture_utils.rs

## Corresponding TypeScript file(s)
- No direct TypeScript equivalent. This is a Rust-only utility for test fixtures. The TS test infrastructure uses Babel's AST traversal directly to find and extract functions.

## Summary
This file provides utilities for fixture testing: counting top-level functions in an AST and extracting the nth function. It is Rust-specific infrastructure that replaces the Babel traversal-based function discovery used in the TS test harness. There is no TS file to compare against.

## Major Issues
None (no TS counterpart to diverge from).

## Moderate Issues
None.

## Minor Issues
None.

## Architectural Differences
- This file exists because the Rust compiler cannot use Babel's traverse to walk AST nodes. Instead, it manually walks the program body to find top-level functions. This is structurally similar to `find_functions_to_compile` in `program.rs` but simpler (no type detection, just extraction).
  `/compiler/crates/react_compiler/src/fixture_utils.rs:1:1`

## Missing TypeScript Features
N/A - this file has no TS counterpart.
