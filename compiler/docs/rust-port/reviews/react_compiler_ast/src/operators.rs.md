# Review: compiler/crates/react_compiler_ast/src/operators.rs

## Corresponding TypeScript file(s)
- `@babel/types` (Babel AST operator string literal types)
- `compiler/packages/babel-plugin-react-compiler/src/HIR/HIR.ts` (uses these operators)

## Summary
This file defines enums for all JavaScript operators: `BinaryOperator`, `LogicalOperator`, `UnaryOperator`, `UpdateOperator`, and `AssignmentOperator`. Each variant is mapped to its string representation via `serde(rename)`.

## Major Issues
None.

## Moderate Issues
None.

## Minor Issues
1. **`UnaryOperator::Throw`**: At `/compiler/crates/react_compiler_ast/src/operators.rs:80:5`, `throw` is included as a unary operator. In standard Babel, `throw` is a `ThrowStatement`, not a unary operator. However, the `throw` operator exists in the `@babel/plugin-proposal-throw-expressions` proposal, which Babel can parse. Including it is forward-compatible.

2. **`BinaryOperator::Pipeline`**: At `/compiler/crates/react_compiler_ast/src/operators.rs:50:5`, the pipeline operator `|>` is included. This matches Babel's support for the pipeline proposal.

3. **Naming convention**: The Rust enum variant names use descriptive names (`Add`, `Sub`, `Mul`) rather than directly mirroring the operator symbols. This is appropriate Rust style. The `serde(rename)` attributes ensure correct JSON serialization.

4. **All operators use `Debug, Clone, Serialize, Deserialize`**: No `Copy`, `PartialEq`, `Eq`, or `Hash` derives. At `/compiler/crates/react_compiler_ast/src/operators.rs:3:1` etc. If operators need to be compared or used as map keys downstream, these derives would need to be added. However, since these types are for AST serialization, the current derives are sufficient.

## Architectural Differences
1. **Enum-based representation**: TypeScript uses string literal union types for operators (e.g., `type BinaryOperator = "+" | "-" | ...`). Rust uses enums with serde rename. This is the standard translation approach.

## Missing TypeScript Features
None -- all standard Babel operators are represented. The set of operators matches Babel's AST specification including proposals.
