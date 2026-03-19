# Review: compiler/crates/react_compiler_ast/src/visitor.rs

## Corresponding TypeScript file(s)
- `compiler/packages/babel-plugin-react-compiler-rust/src/scope.ts` (Babel's `program.traverse` for scope extraction)
- `@babel/traverse` (Babel's generic AST traversal mechanism)

## Summary
This file provides a `Visitor` trait and an `AstWalker` that traverses the Babel AST with automatic scope tracking. It is a Rust-specific implementation -- Babel uses `@babel/traverse` for generic traversal. The `Visitor` trait has enter/leave hooks for node types of interest, and `AstWalker` manages a scope stack using `node_to_scope` from `ScopeInfo`.

## Major Issues
1. **`walk_jsx_member_expression` visits property JSXIdentifier**: At `/compiler/crates/react_compiler_ast/src/visitor.rs:689:9`, the walker calls `v.enter_jsx_identifier(&expr.property, ...)` on JSXMemberExpression's `property`. In Babel's traversal, when visiting `<Foo.Bar />`, the `property` is a `JSXIdentifier` node and would be visited. However, this identifier refers to a property access, not a variable reference. If the visitor is used for scope resolution (mapping identifiers to bindings), visiting the property could incorrectly map it. The scope resolution test in `scope_resolution.rs` does not use this visitor, so this may not cause issues in practice, but it is a semantic divergence from typical Babel traversal behavior where property identifiers in member expressions are not treated as references.

## Moderate Issues
1. **Limited set of visitor hooks**: At `/compiler/crates/react_compiler_ast/src/visitor.rs:20:1`, the `Visitor` trait only has hooks for a small subset of node types: `FunctionDeclaration`, `FunctionExpression`, `ArrowFunctionExpression`, `ObjectMethod`, `AssignmentExpression`, `UpdateExpression`, `Identifier`, `JSXIdentifier`, `JSXOpeningElement`. Babel's `traverse` supports entering/leaving any node type. The limited set is sufficient for the current use cases (scope tracking and identifier resolution) but would need expansion for other analyses.

2. **`walk_statement` does not visit `ClassDeclaration` class body members**: At `/compiler/crates/react_compiler_ast/src/visitor.rs:249:13`, `ClassDeclaration` only walks the `super_class` expression. Class body members are stored as `serde_json::Value` and are not traversed. This means identifiers inside class methods, properties, and static blocks are not visited. If the visitor is used for comprehensive identifier resolution, class body identifiers would be missed.

3. **`walk_expression` does not visit `ClassExpression` class body members**: At `/compiler/crates/react_compiler_ast/src/visitor.rs:432:13`, `ClassExpression` similarly only walks `super_class`. Same issue as above.

4. **No `leave_identifier` or `leave_update_expression` hooks**: At `/compiler/crates/react_compiler_ast/src/visitor.rs:66:5` and `:65:5`. Enter hooks exist but no corresponding leave hooks. In Babel's traverse, both enter and leave are available for every node type. The absence of leave hooks limits the visitor's usefulness for analyses that need post-order processing.

5. **`walk_statement` does not visit `ExportNamedDeclaration` specifiers**: At `/compiler/crates/react_compiler_ast/src/visitor.rs:258:13`. Only the `declaration` is traversed, not the `specifiers` array. If an export like `export { foo }` contains identifier references in specifiers, they won't be visited.

## Minor Issues
1. **`walk_statement` does not visit `ImportDeclaration` specifiers**: At `/compiler/crates/react_compiler_ast/src/visitor.rs:271:13`. Import declarations are listed as having "no runtime expressions to traverse". While import specifiers don't produce runtime expressions, they contain identifiers that could be of interest to some visitors. The current behavior matches Babel's typical lowering behavior (imports are declarations, not runtime expressions).

2. **`walk_expression` for `MemberExpression` only visits property if `computed`**: At `/compiler/crates/react_compiler_ast/src/visitor.rs:308:17`. This correctly skips visiting the property identifier for non-computed access (e.g., `obj.prop`) since `prop` is not a variable reference. This matches Babel's semantics.

3. **`AstWalker::with_initial_scope` constructor**: At `/compiler/crates/react_compiler_ast/src/visitor.rs:97:5`. This allows starting traversal with a pre-set scope. This has no Babel equivalent and is a Rust-specific convenience.

4. **No traversal of `Directive` or `DirectiveLiteral`**: The `walk_block_statement` and `walk_program` methods at `/compiler/crates/react_compiler_ast/src/visitor.rs:131:5` and `:121:5` only walk `body` statements, not `directives`. Directives (like `"use strict"`) don't contain identifiers, so this is correct.

## Architectural Differences
1. **Manual walker vs generic traversal**: This is a hand-written walker rather than a derive-based or generic traversal mechanism. Babel uses `@babel/traverse` which uses a plugin-based visitor pattern. The Rust approach is more explicit and performant but requires manual maintenance when new node types are added.

2. **Scope tracking built into the walker**: The `AstWalker` maintains a `scope_stack` and pushes/pops scopes based on `node_to_scope`. In Babel, scope tracking is a separate concern handled by `@babel/traverse`'s built-in scope system. The Rust implementation integrates scope tracking directly into the walker.

3. **`Visitor` uses `&mut self`**: At `/compiler/crates/react_compiler_ast/src/visitor.rs:20:1`, visitor methods take `&mut self`. This allows the visitor to accumulate state. In Babel's traverse, the visitor is an object with methods that can mutate its own state via closures.

4. **`impl Visitor` generic parameter**: At `/compiler/crates/react_compiler_ast/src/visitor.rs:121:5`, walker methods take `v: &mut impl Visitor`. This enables monomorphization (compile-time dispatch) rather than dynamic dispatch, which is a performance advantage.

## Missing TypeScript Features
1. **No `stop()` or `skip()` mechanism**: Babel's traverse allows visitors to call `path.stop()` to stop traversal or `path.skip()` to skip children. The Rust walker has no equivalent -- traversal always visits all children.

2. **No `NodePath` equivalent**: Babel's traverse provides `NodePath` which includes the node, its parent, scope, and various utilities (replaceWith, remove, etc.). The Rust walker only provides the node reference and scope stack.

3. **No traversal of node types not explicitly handled**: New Babel node types would need to be explicitly added to the match arms. There's no catch-all that handles unknown node types gracefully.

4. **No `enter_statement` or `enter_expression` generic hooks**: The visitor only has specific node type hooks. There's no way to intercept all statements or all expressions with a single hook.
