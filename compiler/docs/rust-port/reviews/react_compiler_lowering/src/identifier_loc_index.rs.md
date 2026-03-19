# Review: compiler/crates/react_compiler_lowering/src/identifier_loc_index.rs

## Corresponding TypeScript file(s)
- No direct TS equivalent. This is a Rust-specific replacement for Babel's scope traversal (`path.node.loc`) and the serialized `referenceLocs`/`jsxReferencePositions` data. In TS, source locations are obtained on-the-fly via Babel's `NodePath` API. In Rust, the AST is walked upfront to build this index.

## Summary
This file builds an index mapping byte offsets to source locations for all `Identifier` and `JSXIdentifier` nodes in a function's AST. It serves as the Rust-side replacement for Babel's ability to query `path.node.loc` on any node during traversal. The implementation is clean and well-documented.

## Major Issues
None.

## Moderate Issues
None.

## Minor Issues
1. **`IdentifierLocEntry.is_declaration_name` is Rust-specific**: At `identifier_loc_index.rs:31`, the `is_declaration_name` field is used to filter out function/class declaration names in `gather_captured_context`. In TS, this filtering happens naturally because Babel's `Expression` visitor doesn't visit declaration name positions. This field is a workaround for the Rust port not using a Babel-style visitor pattern.

2. **`opening_element_loc` is Rust-specific**: At `identifier_loc_index.rs:26`, this field captures the JSXOpeningElement's loc for use when gathering captured context. In TS, `handleMaybeDependency` receives the `JSXOpeningElement` path directly and accesses `path.node.loc`. This is a necessary Rust-side adaptation.

3. **Top-level function name visited manually**: At `identifier_loc_index.rs:141-152`, the walker visits the top-level function's own name identifier manually since the walker only walks params + body. In TS, Babel's `path.traverse()` handles this automatically. This manual handling is correct but is a structural difference.

## Architectural Differences
1. **Entire file is an architectural difference**: This file exists because Rust cannot use Babel's `NodePath` API. The JS->Rust boundary only sends the serialized AST, so all source location lookups must be pre-computed by walking the AST. This is documented in `rust-port-architecture.md` under "JS->Rust Boundary".

2. **`HashMap<u32, IdentifierLocEntry>` keyed by byte offset**: Uses byte offsets as keys (matching Babel's `node.start` property), which is the Rust port's standard way of cross-referencing AST nodes.

## Missing TypeScript Features
None. This file implements equivalent functionality to what Babel provides natively.
