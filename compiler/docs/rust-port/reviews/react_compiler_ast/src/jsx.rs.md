# Review: compiler/crates/react_compiler_ast/src/jsx.rs

## Corresponding TypeScript file(s)
- `@babel/types` (Babel AST JSX node types)
- `compiler/packages/babel-plugin-react-compiler/src/HIR/BuildHIR.ts` (JSX lowering)

## Summary
This file defines JSX-related AST types. The implementation is comprehensive and matches Babel's JSX AST structure closely. All JSX node types used by the React Compiler are present.

## Major Issues
None.

## Moderate Issues
None.

## Minor Issues
1. **`JSXElement.self_closing` field**: At `/compiler/crates/react_compiler_ast/src/jsx.rs:17:5`, `self_closing` is `Option<bool>`. In Babel's AST, `JSXElement` does not have a `selfClosing` property at the element level -- it is on `JSXOpeningElement`. Having it here as optional is harmless (it will default to `None` on deserialization if absent, and skip on serialization) but is not standard Babel.

2. **`JSXText` missing `raw` field**: At `/compiler/crates/react_compiler_ast/src/jsx.rs:148:5`, `JSXText` has only `value: String`. In Babel, `JSXText` also has a `raw` field that contains the unescaped text. This means the `raw` field will be lost during round-tripping.

3. **`JSXMemberExpression.property` is `JSXIdentifier` not `Identifier`**: At `/compiler/crates/react_compiler_ast/src/jsx.rs:169:5`. This matches Babel's types where `JSXMemberExpression.property` is indeed `JSXIdentifier`, not a regular `Identifier`.

4. **`JSXExpressionContainerExpr` untagged variant ordering**: At `/compiler/crates/react_compiler_ast/src/jsx.rs:131:1`, `JSXEmptyExpression` is tagged and `Expression` is untagged. This correctly handles the case where the expression container is empty (`{}`). Serde will try `JSXEmptyExpression` first (by matching `"type": "JSXEmptyExpression"`), then fall back to the untagged `Expression` variant.

## Architectural Differences
1. **`JSXOpeningElement.type_parameters`**: At `/compiler/crates/react_compiler_ast/src/jsx.rs:43:5`, type parameters use `serde_json::Value`. Consistent with the architecture of passing type-level info opaquely.

## Missing TypeScript Features
1. **`JSXText.raw` field**: As noted in Minor Issues #2, the `raw` field from Babel's `JSXText` is not captured. This could matter for code generation fidelity.

2. **`JSXNamespacedName` in `JSXAttributeName`**: At `/compiler/crates/react_compiler_ast/src/jsx.rs:101:1`, `JSXAttributeName` includes `JSXNamespacedName`. This matches Babel's types (attributes like `xml:lang`).

3. **No `JSXFragment` in `JSXExpressionContainerExpr`**: Babel does not allow `JSXFragment` directly inside `JSXExpressionContainer`, so this omission is correct.
