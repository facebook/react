# Review: compiler/crates/react_compiler_ast/src/literals.rs

## Corresponding TypeScript file(s)
- `@babel/types` (Babel AST literal node types: `StringLiteral`, `NumericLiteral`, `BooleanLiteral`, `NullLiteral`, `BigIntLiteral`, `RegExpLiteral`, `TemplateElement`)

## Summary
This file defines literal AST types. The implementation matches Babel's literal types closely and handles all standard JavaScript literal forms.

## Major Issues
None.

## Moderate Issues
1. **`NumericLiteral.value` is `f64`**: At `/compiler/crates/react_compiler_ast/src/literals.rs:16:5`. In JavaScript, all numbers are IEEE 754 doubles, so `f64` is correct. However, certain integer values like `9007199254740993` (`Number.MAX_SAFE_INTEGER + 2`) may lose precision during JSON parsing. This is inherent to the f64 representation and matches JavaScript's behavior.

## Minor Issues
1. **`StringLiteral` missing `extra` field**: At `/compiler/crates/react_compiler_ast/src/literals.rs:6:1`. Babel's `StringLiteral` can have an `extra` field containing `{ rawValue: string, raw: string }` that preserves the original quote style. However, the `extra` field is on `BaseNode` which is flattened in, so it is captured there.

2. **`RegExpLiteral` `pattern` and `flags` are `String`**: At `/compiler/crates/react_compiler_ast/src/literals.rs:43:5` and `:44:5`. This matches Babel's types where both are strings.

3. **`TemplateElementValue.cooked` is `Option<String>`**: At `/compiler/crates/react_compiler_ast/src/literals.rs:59:5`. In Babel, `cooked` can be `null` for tagged template literals with invalid escape sequences (e.g., `String.raw\`\unicode\``). Making it optional correctly handles this case.

4. **`BigIntLiteral.value` is `String`**: At `/compiler/crates/react_compiler_ast/src/literals.rs:37:5`. Babel stores bigint values as strings, so this matches.

## Architectural Differences
None beyond standard serde usage.

## Missing TypeScript Features
1. **`DecimalLiteral`**: Babel supports the Decimal proposal (`0.1m`). This literal type is not represented, consistent with the omission in `expressions.rs`.

2. **`StringLiteral.extra.rawValue`**: While `extra` is captured in `BaseNode`, the Rust code does not have typed access to `rawValue` or `raw`. This only matters if the compiler needs to distinguish quote styles, which it does not.
