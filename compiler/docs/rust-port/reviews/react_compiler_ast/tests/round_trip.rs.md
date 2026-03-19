# Review: compiler/crates/react_compiler_ast/tests/round_trip.rs

## Corresponding TypeScript file(s)
- No direct TypeScript equivalent. This is a Rust-specific test that verifies AST serialization fidelity.

## Summary
This test file verifies that Babel AST JSON fixtures can be deserialized into Rust types and re-serialized back to JSON without loss. It walks a `tests/fixtures` directory, parses each `.json` file into a `react_compiler_ast::File`, serializes it back, and compares after normalizing (sorting keys, normalizing integers). Scope and renamed fixtures are excluded.

## Major Issues
None.

## Moderate Issues
1. **Key sorting in `normalize_json` makes comparison order-independent**: At `/compiler/crates/react_compiler_ast/tests/round_trip.rs:12:1`, the normalization sorts all object keys. This means the test won't catch cases where the Rust code serializes keys in a different order than Babel. While this is generally acceptable for semantic equivalence, it could mask issues where field ordering matters for specific consumers.

2. **Number normalization may hide precision issues**: At `/compiler/crates/react_compiler_ast/tests/round_trip.rs:27:9`, whole-number floats are normalized to integers (`1.0` -> `1`). This is needed because Rust's serde serializes `f64` values like `1.0` as `1.0` while JavaScript would serialize them as `1`. However, this normalization could hide cases where the Rust code loses fractional precision in numeric literals.

## Minor Issues
1. **Only shows first 5 failures**: At `/compiler/crates/react_compiler_ast/tests/round_trip.rs:125:9`, the test limits output to the first 5 failures. This could make debugging difficult if there are many failures with different root causes.

2. **Diff truncated to 50 lines**: At `/compiler/crates/react_compiler_ast/tests/round_trip.rs:47:5`, `MAX_DIFF_LINES` limits diff output. For large AST differences, this truncation may hide important context.

3. **Test uses `walkdir` crate**: The test walks the fixture directory recursively. If the fixture directory is empty or missing, the test passes silently with `0/0 fixtures passed`. There's no assertion that at least one fixture was tested.

## Architectural Differences
1. **Fixture-based testing against Babel output**: This is a Rust-specific testing strategy. The TypeScript compiler uses Jest snapshot tests against expected compiler output. This test verifies the serialization boundary between JS and Rust.

2. **`normalize_json` function**: This utility is specific to the Rust test -- it handles the impedance mismatch between JavaScript's number representation and Rust/serde's representation.

## Missing TypeScript Features
None -- this is a test file with no TypeScript counterpart.
