# Review: compiler/crates/react_compiler_ast/src/lib.rs

## Corresponding TypeScript file(s)
- `@babel/types` (Babel AST `File`, `Program`, `InterpreterDirective` types)

## Summary
This file defines the root AST types (`File`, `Program`) and module declarations. It is a faithful representation of Babel's top-level AST structure.

## Major Issues
None.

## Moderate Issues
None.

## Minor Issues
1. **`File.errors` typed as `Vec<serde_json::Value>`**: At `/compiler/crates/react_compiler_ast/src/lib.rs:26:5`. In Babel, `File.errors` contains parsing error objects. Storing them as generic JSON values is appropriate since the compiler does not need to interpret parsing errors structurally.

2. **`Program.interpreter` is `Option<InterpreterDirective>`**: At `/compiler/crates/react_compiler_ast/src/lib.rs:39:5`. This matches Babel's AST where the `interpreter` field captures hashbang directives (e.g., `#!/usr/bin/env node`).

3. **`SourceType` has only `Module` and `Script`**: At `/compiler/crates/react_compiler_ast/src/lib.rs:50:1`. In some Babel configurations, `sourceType` can also be `"unambiguous"`, but this is resolved to `"module"` or `"script"` by the time the AST is produced. The enum correctly only includes the two resolved values.

4. **`Program.source_file` field**: At `/compiler/crates/react_compiler_ast/src/lib.rs:45:5`. This maps to Babel's `sourceFile` property on the Program node. It's correctly optional with `skip_serializing_if`.

## Architectural Differences
1. **Module structure**: The `lib.rs` file declares all submodules (`common`, `declarations`, `expressions`, etc.). This is a standard Rust crate organization pattern with no TypeScript equivalent -- in TypeScript, Babel's types are all defined in the `@babel/types` package.

## Missing TypeScript Features
1. **`File.tokens`**: Babel's `File` node can have a `tokens` array when `tokens: true` is passed to the parser. This field is not represented in the Rust struct. It would be lost during round-tripping if present.

2. **`Program.body` does not include `ModuleDeclaration` as a separate union**: In Babel's types, `Program.body` is `Array<Statement | ModuleDeclaration>`. In the Rust code, module declarations (import/export) are variants of the `Statement` enum, so this is handled correctly through a different structural approach.
