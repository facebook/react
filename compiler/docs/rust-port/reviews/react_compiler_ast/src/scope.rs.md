# Review: compiler/crates/react_compiler_ast/src/scope.rs

## Corresponding TypeScript file(s)
- `compiler/packages/babel-plugin-react-compiler-rust/src/scope.ts` (scope extraction logic and data types)

## Summary
This file defines the scope data model for tracking JavaScript scopes and variable bindings. It closely mirrors the `ScopeInfo`, `ScopeData`, `BindingData`, and `ImportBindingData` interfaces from `scope.ts`. The Rust side adds convenience methods (`get_binding`, `resolve_reference`, `scope_bindings`) that have no TypeScript equivalents since the TS side only serializes data.

## Major Issues
None.

## Moderate Issues
1. **`ScopeData.bindings` uses `HashMap` instead of preserving insertion order**: At `/compiler/crates/react_compiler_ast/src/scope.rs:21:5`, `bindings: HashMap<String, BindingId>`. In the TypeScript `scope.ts`, `scopeBindings` is a `Record<string, number>` which in JavaScript preserves insertion order (string-keyed objects have ordered keys for non-integer keys). The HashMap does not preserve order. This means serialization may produce different key ordering for scope bindings. Since the tests use `normalize_json` which sorts keys, this doesn't affect tests, but it is a behavioral difference.

2. **`ScopeInfo.node_to_scope` uses `HashMap` instead of preserving order**: At `/compiler/crates/react_compiler_ast/src/scope.rs:105:5`, `node_to_scope: HashMap<u32, ScopeId>`. In the TypeScript, this is `Record<number, number>`. The ordering difference has the same implications as above.

3. **`ScopeInfo.reference_to_binding` uses `IndexMap`**: At `/compiler/crates/react_compiler_ast/src/scope.rs:109:5`. This correctly preserves insertion order, matching the TypeScript `Record<number, number>` behavior. The comment says "preserves insertion order (source order from serialization)". The inconsistency between using `IndexMap` here but `HashMap` for `node_to_scope` and `ScopeData.bindings` is notable.

## Minor Issues
1. **`ScopeKind` uses `#[serde(rename_all = "lowercase")]` with `#[serde(rename = "for")]` override**: At `/compiler/crates/react_compiler_ast/src/scope.rs:25:1`. The `For` variant needs special handling because `for` is a Rust reserved word. The `rename = "for"` attribute correctly handles this. In the TypeScript `scope.ts`, `getScopeKind` returns plain strings.

2. **`BindingKind::Unknown` variant**: At `/compiler/crates/react_compiler_ast/src/scope.rs:72:5`. The TypeScript `getBindingKind` has a `default: return 'unknown'` case. The Rust enum includes this as a variant. However, deserializing an unrecognized string will fail with a serde error rather than falling back to `Unknown`, because serde's `rename_all = "lowercase"` only maps known variants. To truly match the TypeScript fallback behavior, a custom deserializer or `#[serde(other)]` attribute would be needed on `Unknown`.

3. **`BindingData.declaration_type` is `String`**: At `/compiler/crates/react_compiler_ast/src/scope.rs:48:5`. In the TypeScript, this is also a string (`babelBinding.path.node.type`). Using a string is correct for pass-through.

4. **`BindingData.declaration_start` field**: At `/compiler/crates/react_compiler_ast/src/scope.rs:52:5`, this field stores the start offset of the binding's declaration identifier. This is used to distinguish declaration sites from references in `reference_to_binding`. The TypeScript counterpart in `scope.ts` computes this from `babelBinding.path.node.start`. Making it optional allows the field to be omitted in serialization if not needed, which is appropriate.

5. **`ScopeId` and `BindingId` are newtype wrappers**: At `/compiler/crates/react_compiler_ast/src/scope.rs:7:1` and `:11:1`. These use `u32` internally. The TypeScript uses plain `number`. The newtype pattern provides type safety in Rust.

6. **`ImportBindingKind` enum**: At `/compiler/crates/react_compiler_ast/src/scope.rs:87:1`. In the TypeScript `scope.ts`, `ImportBindingData.kind` is a plain string (`'default'`, `'named'`, `'namespace'`). The Rust enum provides stricter typing.

7. **`#[serde(rename_all = "camelCase")]` on all structs**: At `/compiler/crates/react_compiler_ast/src/scope.rs:14:1`, `:38:1`, and `:97:1`, all data structs use `rename_all = "camelCase"`. This ensures JSON serialization uses JavaScript naming conventions (e.g., `programScope` instead of `program_scope`), matching the TypeScript output.

## Architectural Differences
1. **Convenience methods on `ScopeInfo`**: At `/compiler/crates/react_compiler_ast/src/scope.rs:116:1`, `ScopeInfo` has `get_binding`, `resolve_reference`, and `scope_bindings` methods. These have no TypeScript counterpart -- the TypeScript side only serializes the data and sends it to Rust. These methods are Rust-side utilities for the compiler.

2. **`ScopeId` and `BindingId` as `Copy + Hash + Eq` types**: At `/compiler/crates/react_compiler_ast/src/scope.rs:6:1` and `:10:1`. These derive `Copy, Clone, Hash, Eq, PartialEq`. This follows the arena ID pattern documented in `rust-port-architecture.md`.

3. **Indexed access pattern**: The `ScopeInfo` methods use `self.scopes[id.0 as usize]` for direct indexed access. This matches the architecture doc's pattern of using IDs as indices into arena-like vectors.

## Missing TypeScript Features
1. **No reserved word validation**: The TypeScript `scope.ts` at lines 367-416 includes `isReservedWord()` validation that throws if a binding name is a reserved word. The Rust `scope.rs` does not include this validation. It is expected that this validation happens on the JavaScript side before serialization, but if invalid data is deserialized, the Rust side would not catch it.

2. **No `mapPatternIdentifiers` equivalent**: The TypeScript `scope.ts` has helper functions like `mapPatternIdentifiers` for mapping pattern positions to bindings. The Rust side does not need this because it receives the already-computed `reference_to_binding` map from the JavaScript side.

3. **No `extractScopeInfo` equivalent**: The TypeScript has the full scope extraction logic. The Rust side only has the data model for receiving the extracted data. This is by design per the architecture doc.
