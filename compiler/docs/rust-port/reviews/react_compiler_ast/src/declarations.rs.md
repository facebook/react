# Review: compiler/crates/react_compiler_ast/src/declarations.rs

## Corresponding TypeScript file(s)
- `@babel/types` (Babel AST types for import/export declarations, TypeScript/Flow declarations)
- No direct file in `compiler/packages/babel-plugin-react-compiler/src/` -- these are Babel's built-in types

## Summary
This file defines AST types for import/export declarations, TypeScript declarations, and Flow declarations. It provides a comprehensive mapping of Babel's declaration node types. TypeScript and Flow type-level constructs correctly use `serde_json::Value` for fields that don't need typed traversal, since the compiler only needs to pass them through.

## Major Issues
None.

## Moderate Issues
1. **`ImportAttribute.key` typed as `Identifier` but could be `StringLiteral`**: At `/compiler/crates/react_compiler_ast/src/declarations.rs:98:5`, the `ImportAttribute` struct has `key: Identifier`. In Babel, `ImportAttribute.key` can be either `Identifier` or `StringLiteral` (e.g., `import foo from 'bar' with { "type": "json" }`). This could cause deserialization failures for import attributes with string literal keys.

2. **`ExportDefaultDecl` uses `#[serde(untagged)]` for `Expression`**: At `/compiler/crates/react_compiler_ast/src/declarations.rs:32:5`, the `Expression` variant is untagged while `FunctionDeclaration` and `ClassDeclaration` are tagged. The ordering is important -- serde tries tagged variants first, then untagged. If a `FunctionDeclaration` or `ClassDeclaration` appears in the `export default` position, it should match the tagged variant first, which is correct. However, this means any expression that happens to have a `"type": "FunctionDeclaration"` would be incorrectly matched, though this cannot happen in practice.

## Minor Issues
1. **`ImportKind` missing `skip_serializing_if` on import_kind in ImportSpecifierData**: At `/compiler/crates/react_compiler_ast/src/declarations.rs:77:5`, `import_kind` has `#[serde(default, rename = "importKind")]` but no `skip_serializing_if = "Option::is_none"`. This means when serialized, it will emit `"importKind": null` instead of omitting the field. This contrasts with other similar optional fields that do use `skip_serializing_if`.

2. **`Declaration` enum does not include all possible Babel declaration types**: The `Declaration` enum at `/compiler/crates/react_compiler_ast/src/declarations.rs:11:1` only includes types that can appear in `ExportNamedDeclaration.declaration`. This is correct for the purpose of this crate but doesn't represent every possible Babel declaration. This is an intentional scoping decision.

3. **`DeclareFunction.predicate` is `Option<Box<serde_json::Value>>`**: At `/compiler/crates/react_compiler_ast/src/declarations.rs:340:5`, this Flow-specific field uses a generic JSON value. This is fine for pass-through.

4. **`ExportDefaultDeclaration.export_kind`**: At `/compiler/crates/react_compiler_ast/src/declarations.rs:173:5`, `export_kind` is included. In Babel, `ExportDefaultDeclaration` does have an `exportKind` property but it's rarely used. Its inclusion is correct.

## Architectural Differences
1. **TypeScript/Flow declaration bodies as `serde_json::Value`**: At various locations (e.g., `/compiler/crates/react_compiler_ast/src/declarations.rs:201:5`, `:217:5`), TypeScript and Flow declaration bodies are stored as `serde_json::Value` rather than fully-typed AST nodes. This is documented in `rust-port-architecture.md` under "JS->Rust Boundary" -- only core data structures are typed, and type-level constructs are passed through as opaque JSON.

2. **`BaseNode` flattened into every struct**: Every struct uses `#[serde(flatten)] pub base: BaseNode`. In Babel's TypeScript types, all nodes extend a `BaseNode` interface. The Rust approach using serde flatten achieves the same effect.

## Missing TypeScript Features
1. **`ExportDefaultDecl` does not handle `TSDeclareFunction` in export default position**: In Babel, `export default declare function foo(): void;` can produce a `TSDeclareFunction` as the declaration. The `ExportDefaultDecl` enum at `/compiler/crates/react_compiler_ast/src/declarations.rs:28:1` does not include this variant.

2. **No `TSImportEqualsDeclaration`**: Babel supports `import Foo = require('bar')` via `TSImportEqualsDeclaration`. This node type is not represented. It would fail to parse as any `Statement` variant.

3. **No `TSExportAssignment`**: Babel supports `export = expr` via `TSExportAssignment`. This is not represented in the `Statement` enum or as a declaration type.
