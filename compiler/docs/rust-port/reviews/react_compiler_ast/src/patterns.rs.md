# Review: compiler/crates/react_compiler_ast/src/patterns.rs

## Corresponding TypeScript file(s)
- `@babel/types` (Babel AST pattern/LVal types: `Identifier`, `ObjectPattern`, `ArrayPattern`, `AssignmentPattern`, `RestElement`, `MemberExpression`)

## Summary
This file defines pattern types used in destructuring and assignment targets. The `PatternLike` enum corresponds to Babel's `LVal` type union. The implementation correctly handles nested destructuring patterns and the `MemberExpression` special case for LVal positions.

## Major Issues
None.

## Moderate Issues
1. **`PatternLike` does not include `OptionalMemberExpression`**: At `/compiler/crates/react_compiler_ast/src/patterns.rs:11:1`, the `PatternLike` enum includes `MemberExpression` as a variant for assignment targets, but does not include `OptionalMemberExpression`. In Babel's `LVal` type, `OptionalMemberExpression` can also appear. While `a?.b = c` is syntactically invalid in standard JS, Babel can still parse it, and the compiler may encounter it in error recovery scenarios.

2. **`ObjectPatternProp` reuses `ObjectProperty` name in serde tag**: At `/compiler/crates/react_compiler_ast/src/patterns.rs:39:1`, the `ObjectPatternProperty` enum has `ObjectProperty(ObjectPatternProp)` which serializes with `"type": "ObjectProperty"`. This correctly matches Babel's representation where object pattern properties use the same `ObjectProperty` node type as object expression properties. The separate `ObjectPatternProp` struct in Rust has `value: Box<PatternLike>` instead of `value: Box<Expression>`, correctly reflecting the pattern context.

## Minor Issues
1. **`ObjectPatternProp.method` field**: At `/compiler/crates/react_compiler_ast/src/patterns.rs:54:5`. In Babel, `ObjectProperty` has a `method` field (boolean). For destructuring patterns, `method` should always be `false`, but including it as `Option<bool>` allows round-tripping without loss.

2. **`ObjectPatternProp.decorators` field**: At `/compiler/crates/react_compiler_ast/src/patterns.rs:52:5`. Decorators on object properties in patterns would be syntactically invalid, but including them prevents deserialization failures if Babel emits them.

3. **`AssignmentPattern.decorators` field**: At `/compiler/crates/react_compiler_ast/src/patterns.rs:85:5`. Similarly, decorators on assignment patterns are unusual. Their presence is for defensive deserialization.

4. **`ArrayPattern.elements` is `Vec<Option<PatternLike>>`**: At `/compiler/crates/react_compiler_ast/src/patterns.rs:61:5`. The `Option` correctly handles array holes in destructuring patterns (e.g., `let [,b] = arr`).

## Architectural Differences
1. **Separate `ObjectPatternProp` vs `ObjectProperty`**: The Rust code uses different structs for object properties in expression context (`ObjectProperty` in expressions.rs) vs pattern context (`ObjectPatternProp` in patterns.rs). In Babel's TypeScript types, both are `ObjectProperty` with overloaded `value` type. The Rust separation provides better type safety.

## Missing TypeScript Features
1. **`TSParameterProperty`**: In TypeScript, constructor parameters with visibility modifiers (`constructor(public x: number)`) produce `TSParameterProperty` nodes that can appear in pattern positions. This is not represented in `PatternLike`.

2. **No `Placeholder` pattern**: Babel has a `Placeholder` node type that can appear in various positions. This is not represented but is rarely used in practice.
