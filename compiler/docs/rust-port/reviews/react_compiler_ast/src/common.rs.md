# Review: compiler/crates/react_compiler_ast/src/common.rs

## Corresponding TypeScript file(s)
- `@babel/types` (Babel AST node types: `BaseNode`, `Comment`, `SourceLocation`, `Position`)
- No direct file in `compiler/packages/babel-plugin-react-compiler/src/` -- these are Babel's built-in types

## Summary
This file defines shared AST types (`Position`, `SourceLocation`, `Comment`, `BaseNode`) that mirror Babel's node metadata. It also provides a `nullable_value` serde helper. The implementation is a faithful representation of Babel's node shape for serialization/deserialization round-tripping.

## Major Issues
None.

## Moderate Issues
1. **Babel `Position.index` is not optional in newer Babel versions**: In Babel 7.20+, `Position` has a non-optional `index` property of type `number`. The Rust code has `index: Option<u32>` at `/compiler/crates/react_compiler_ast/src/common.rs:24:5`. This means if Babel emits `index`, it will be preserved, but if the Rust code constructs a `Position` without it, the serialized output will differ. However, since this is for deserialization of Babel output, making it optional is defensive and acceptable.

2. **BaseNode `range` field typed as `Option<(u32, u32)>`**: At `/compiler/crates/react_compiler_ast/src/common.rs:78:5`, the `range` field is a tuple. In Babel's AST, `range` is `[number, number]` when present. The serde serialization of `(u32, u32)` produces a JSON array `[n, n]`, which matches. No functional issue, but the type `Option<[u32; 2]>` would be more idiomatic Rust for a fixed-size array. This is purely stylistic.

## Minor Issues
1. **Comment node structure**: At `/compiler/crates/react_compiler_ast/src/common.rs:42:1`, `Comment` is defined as a tagged enum with `CommentBlock` and `CommentLine` variants. In Babel, comments have type `"CommentBlock"` or `"CommentLine"` with fields `value`, `start`, `end`, `loc`. The Rust implementation uses `#[serde(tag = "type")]` which correctly handles this. The data fields are in `CommentData`. This matches Babel's structure.

2. **BaseNode `node_type` field**: At `/compiler/crates/react_compiler_ast/src/common.rs:70:5`, `node_type` captures the `"type"` field. The doc comment explains this is for round-trip fidelity when `BaseNode` is deserialized directly (not through a `#[serde(tag = "type")]` enum). This is a Rust-specific addition with no Babel counterpart -- it exists solely for serialization fidelity.

3. **No `_` prefixed fields**: Babel nodes can have internal properties like `_final`, `_blockHoist`. These would be lost during round-tripping unless captured in `extra` or another catch-all. This is acceptable since those properties are Babel-internal.

## Architectural Differences
1. **Serde-based serialization**: At `/compiler/crates/react_compiler_ast/src/common.rs:1:1`, the entire file uses `serde::Serialize` and `serde::Deserialize` derives for JSON round-tripping. This is an expected Rust-port-specific pattern for the JS-Rust boundary (documented in `rust-port-architecture.md` under "JS->Rust Boundary").

2. **`nullable_value` helper**: At `/compiler/crates/react_compiler_ast/src/common.rs:9:1`, this custom deserializer handles the distinction between absent and null JSON fields. This has no TypeScript equivalent (JavaScript naturally handles `undefined` vs `null`). This is a necessary Rust/serde adaptation.

## Missing TypeScript Features
None -- this file maps all of Babel's `BaseNode` metadata fields.
