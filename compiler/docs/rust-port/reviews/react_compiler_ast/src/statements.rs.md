# Review: compiler/crates/react_compiler_ast/src/statements.rs

## Corresponding TypeScript file(s)
- `@babel/types` (Babel AST statement node types)
- `compiler/packages/babel-plugin-react-compiler/src/HIR/BuildHIR.ts` (statement lowering)

## Summary
This file defines the `Statement` enum and all statement-related AST structs. The implementation covers all standard JavaScript statements plus import/export, TypeScript, and Flow declaration statements. It matches Babel's AST structure closely.

## Major Issues
None.

## Moderate Issues
1. **`ForInit` and `ForInOfLeft` use untagged variants for non-declaration cases**: At `/compiler/crates/react_compiler_ast/src/statements.rs:119:1` and `:162:1`. `ForInit` has `VariableDeclaration` as tagged and `Expression` as untagged. `ForInOfLeft` has `VariableDeclaration` as tagged and `Pattern` as untagged. This works correctly because serde will try the tagged `VariableDeclaration` first. However, if any expression happens to have `"type": "VariableDeclaration"`, it would be incorrectly matched -- but this cannot happen since expressions never have that type.

2. **`ClassDeclaration` does not include `is_abstract` in the right position for all TS edge cases**: At `/compiler/crates/react_compiler_ast/src/statements.rs:324:5`, `is_abstract: Option<bool>` is present. In Babel, `declare abstract class Foo {}` produces a `ClassDeclaration` with both `abstract: true` and `declare: true`. This is correctly handled.

3. **`VariableDeclarationKind::Using`**: At `/compiler/crates/react_compiler_ast/src/statements.rs:268:5`. The `using` keyword is a Stage 3 proposal (`using` declarations for explicit resource management). Including it is forward-compatible with newer Babel versions. However, Babel also distinguishes `await using` which would need a separate variant or a flag. If Babel represents `await using` as a separate kind (e.g., `"awaitUsing"`), it would fail deserialization.

## Minor Issues
1. **`BlockStatement.directives` defaults to empty vec**: At `/compiler/crates/react_compiler_ast/src/statements.rs:68:5`. Uses `#[serde(default)]` which will produce an empty Vec if the field is absent. This matches Babel's behavior where `directives` is always present (possibly empty).

2. **`SwitchCase` does not track `default` vs regular case**: At `/compiler/crates/react_compiler_ast/src/statements.rs:179:1`. In Babel, a default case has `test: null`. The Rust `test: Option<Box<Expression>>` correctly handles this with `None` for default cases.

3. **`CatchClause.param` is `Option<PatternLike>`**: At `/compiler/crates/react_compiler_ast/src/statements.rs:206:5`. This correctly handles optional catch binding (`catch { ... }` without a parameter), which is valid ES2019+.

4. **`FunctionDeclaration.id` is `Option<Identifier>`**: At `/compiler/crates/react_compiler_ast/src/statements.rs:285:5`. In Babel, `FunctionDeclaration.id` is `Identifier | null`. It's null for `export default function() {}`. This is correctly modeled.

5. **`FunctionDeclaration.predicate`**: At `/compiler/crates/react_compiler_ast/src/statements.rs:311:5`. This is a Flow-specific field for predicate functions (`function isString(x): %checks { ... }`). Using `serde_json::Value` for pass-through is correct.

6. **`VariableDeclarator.definite`**: At `/compiler/crates/react_compiler_ast/src/statements.rs:278:5`. This is a TypeScript-specific field (`let x!: number`). Making it optional is correct.

7. **`ClassDeclaration.mixins`**: At `/compiler/crates/react_compiler_ast/src/statements.rs:347:5`. This is a Flow-specific field. Making it optional is correct.

## Architectural Differences
1. **`Statement` enum includes import/export and type declarations**: At `/compiler/crates/react_compiler_ast/src/statements.rs:35:5` to `:59:5`. In Babel's TypeScript types, `Statement` and `ModuleDeclaration` are separate unions. The Rust code merges them into a single `Statement` enum, which simplifies the `Program.body` type (just `Vec<Statement>` instead of a union).

2. **Type/Flow declarations use their struct types from `declarations.rs`**: E.g., at `/compiler/crates/react_compiler_ast/src/statements.rs:40:5`, `TSTypeAliasDeclaration(crate::declarations::TSTypeAliasDeclaration)`. This reuses the same types across both `Statement` and `Declaration` enums.

## Missing TypeScript Features
1. **No `TSImportEqualsDeclaration` statement**: Babel's `import Foo = require('bar')` produces `TSImportEqualsDeclaration`. This is not a variant in the `Statement` enum.

2. **No `TSExportAssignment` statement**: Babel's `export = expr` produces `TSExportAssignment`. Not represented.

3. **No `TSNamespaceExportDeclaration`**: Babel's `export as namespace Foo` produces this node. Not represented.

4. **No `VariableDeclarationKind::AwaitUsing`**: If Babel represents `await using` declarations with a separate kind string, deserialization would fail. The current `Using` variant may not cover all explicit resource management syntax.

5. **No `StaticBlock` in class context**: Babel supports `static { ... }` blocks via `StaticBlock`. While this appears inside class bodies (which are `serde_json::Value`), if it were to appear at the statement level in some error recovery scenario, it would not be handled.
