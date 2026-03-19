# Review: compiler/crates/react_compiler_ast/tests/scope_resolution.rs

## Corresponding TypeScript file(s)
- `compiler/packages/babel-plugin-react-compiler-rust/src/scope.ts` (the scope extraction logic that produces the `.scope.json` files)
- No direct TypeScript test counterpart -- this is a Rust-specific validation test

## Summary
This test file contains two tests: `scope_info_round_trip` (validates that scope JSON can be deserialized and re-serialized faithfully, plus consistency checks on IDs) and `scope_resolution_rename` (validates that identifier renaming based on scope resolution produces the same result as a Babel-side reference implementation). It also includes a comprehensive mutable AST traversal (`visit_*` functions) for performing identifier renaming.

## Major Issues
1. **`visit_expr` for `MemberExpression` visits property unconditionally**: At `/compiler/crates/react_compiler_ast/tests/scope_resolution.rs:478:13` and `:489:13`, `MemberExpression` and `OptionalMemberExpression` visit both `object` and `property` with `visit_expr`. This means non-computed property identifiers (e.g., `obj.prop`) will be passed through `rename_id`, which could incorrectly rename them if their `start` offset happens to match a binding reference. In contrast, the read-only `AstWalker` in `visitor.rs` correctly skips non-computed properties. However, since `rename_id` only renames identifiers whose `start` offset is in `reference_to_binding`, and Babel's scope extraction does not map property access identifiers to bindings, this likely does not cause incorrect behavior in practice.

2. **`visit_expr` for `MetaProperty` renames both `meta` and `property`**: At `/compiler/crates/react_compiler_ast/tests/scope_resolution.rs:573:9`, both `e.meta` and `e.property` identifiers of `MetaProperty` (e.g., `new.target`, `import.meta`) are passed through `rename_id`. These are not variable references and should never be in `reference_to_binding`, but the code still visits them. If a `MetaProperty`'s identifier `start` offset coincidentally matches a binding reference offset, it would be incorrectly renamed.

## Moderate Issues
1. **Duplicated `normalize_json` and `compute_diff` utilities**: At `/compiler/crates/react_compiler_ast/tests/scope_resolution.rs:18:1` and `:46:1`, these functions are exact duplicates of the same functions in `round_trip.rs`. They should ideally be shared in a test utility module.

2. **Scope consistency checks are incomplete**: At `/compiler/crates/react_compiler_ast/tests/scope_resolution.rs:129:5`, the `scope_info_round_trip` test checks that binding scope IDs, scope parent IDs, and reference binding IDs are within bounds. However, it does not verify that:
   - Every binding referenced by `reference_to_binding` is also present in some scope's `bindings` map
   - Scope parent chains do not form cycles
   - The `program_scope` ID is valid and points to a scope with `kind: "program"`

3. **No assertion that at least one fixture was tested**: At `/compiler/crates/react_compiler_ast/tests/scope_resolution.rs:69:1`, both tests could pass with `total = 0` if no fixtures exist. The tests print counts but don't fail if no fixtures are found.

## Minor Issues
1. **`rename_id` format string**: At `/compiler/crates/react_compiler_ast/tests/scope_resolution.rs:232:13`, the renamed identifier format is `"{name}_{scope}_{bid}"`. This must match whatever the Babel reference implementation uses for the `.renamed.json` files. The specific format (`name_scope_bindingId`) is test-specific.

2. **`visit_json` fallback handles identifiers in opaque JSON**: At `/compiler/crates/react_compiler_ast/tests/scope_resolution.rs:242:1`, the `visit_json` function recursively walks `serde_json::Value` trees and renames identifiers by matching `"type": "Identifier"` and looking up their `start` offset. This ensures that identifiers inside class bodies, type annotations, decorators, etc. (stored as opaque JSON) are also renamed.

3. **`rename_id` also visits `type_annotation` and `decorators`**: At `/compiler/crates/react_compiler_ast/tests/scope_resolution.rs:235:5` and `:236:5`. This ensures identifiers inside type annotations (which are stored as `serde_json::Value`) are also renamed. This is thorough.

4. **`visit_jsx_element` does not visit JSX element names**: At `/compiler/crates/react_compiler_ast/tests/scope_resolution.rs:796:1`. The renaming traversal visits attribute values and children but does not rename JSX element name identifiers (e.g., `<Foo>` where `Foo` is a component reference). This may be intentional if JSX element names are handled separately or if they don't appear in `reference_to_binding`.

5. **`visit_export_named` visits specifier local/exported names**: At `/compiler/crates/react_compiler_ast/tests/scope_resolution.rs:714:9`. This correctly handles cases like `export { foo as bar }` by visiting both `local` and `exported` module export names.

## Architectural Differences
1. **Mutable traversal separate from read-only visitor**: The test implements its own mutable traversal (`visit_*` functions) rather than using the `Visitor` trait from `visitor.rs`. This is because the `Visitor` trait only provides immutable references, while renaming requires mutation. This is a practical Rust constraint -- providing both mutable and immutable visitors would require separate trait definitions.

2. **Fixture-based golden test**: The `scope_resolution_rename` test compares Rust-side renaming output against Babel-side renaming output (`.renamed.json`). This validates that the Rust AST types + scope data produce identical results to the TypeScript implementation.

3. **Two-layer approach**: Typed AST nodes are traversed with typed `visit_*` functions, while opaque JSON subtrees (class bodies, type annotations) are traversed with the generic `visit_json` function. This mirrors the architecture where some AST parts are typed and others are pass-through.

## Missing TypeScript Features
1. **No equivalent test in TypeScript**: The TypeScript compiler does not have a comparable scope resolution round-trip test. The scope extraction logic is validated implicitly through the compiler's end-to-end tests.

2. **Test does not validate that all identifiers are renamed**: The test only compares against the golden `.renamed.json` file. If both the Rust and Babel implementations miss the same identifier, the test would pass despite an omission.
