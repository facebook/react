# Review: compiler/crates/react_compiler_lowering/src/find_context_identifiers.rs

## Corresponding TypeScript file(s)
- `compiler/packages/babel-plugin-react-compiler/src/HIR/FindContextIdentifiers.ts`

## Summary
The Rust port closely mirrors the TypeScript implementation's logic. Both identify bindings that need StoreContext/LoadContext semantics by tracking which variables are reassigned and/or referenced from within nested functions. The main structural difference is that the Rust version uses the serialized `ScopeInfo` and `reference_to_binding` map instead of Babel's live scope analysis.

## Major Issues
None.

## Moderate Issues

1. **Missing `throwTodo` for unsupported LVal in AssignmentExpression**: In `FindContextIdentifiers.ts:61-79`, when the left side of an AssignmentExpression is not an LVal (e.g., OptionalMemberExpression), the TS throws a `CompilerError.throwTodo`. The Rust version at `find_context_identifiers.rs:120-130` delegates to `walk_lval_for_reassignment` which matches on `PatternLike` variants but does not handle the case where the AST has an expression (non-LVal) on the left side. If the AST parser already ensures this case cannot occur, this is fine, but if not, the error would be silently ignored rather than reported.

2. **Missing `default` case error in `walk_lval_for_reassignment`**: In `FindContextIdentifiers.ts:215-222`, the TS has a `default` case that throws `CompilerError.throwTodo` for unhandled destructuring assignment targets. The Rust `walk_lval_for_reassignment` at `find_context_identifiers.rs:149-182` uses an exhaustive `match` on `PatternLike`, so all known variants are covered. However, the `MemberExpression` case in Rust silently does nothing (correct behavior), while TS handles it the same way. The exhaustive match is actually better -- this is not a bug, just a different approach.

3. **Different scope resolution for `enter_identifier`**: In `FindContextIdentifiers.ts:91-99`, the TS `Identifier` visitor uses `path.isReferencedIdentifier()` to filter identifiers. The Rust at `find_context_identifiers.rs:98-118` instead checks `reference_to_binding` to see if the identifier resolves to a binding. The `isReferencedIdentifier()` check in Babel returns true for both referenced identifiers and reassignment targets (it's "broken" according to the TS comment at line 416-417 of BuildHIR.ts). The Rust approach using `reference_to_binding` should be equivalent since all referenced identifiers will have entries in this map.

4. **Different function scope tracking mechanism**: In TS (`FindContextIdentifiers.ts:35-45`), `withFunctionScope` pushes the entire `NodePath<BabelFunction>` onto the stack and uses `currentFn.scope.parent.getBinding(name)` to check if a binding is captured. In Rust (`find_context_identifiers.rs:33-61`), the function scope ID is pushed and `is_captured_by_function` walks up the scope tree. These should be semantically equivalent, but the Rust `is_captured_by_function` at `find_context_identifiers.rs:186-207` walks from `fn_parent` upward to check if `binding_scope` is an ancestor. This logic differs from TS's `currentFn.scope.parent.getBinding(name)` which asks Babel to resolve the binding from the function's parent scope. The Rust approach correctly checks if the binding scope is at or above the function's parent scope.

## Minor Issues

1. **Naming: `BindingInfo` vs `IdentifierInfo`**: The Rust type at `find_context_identifiers.rs:18` is called `BindingInfo` while the TS type at `FindContextIdentifiers.ts:14` is called `IdentifierInfo`. Minor naming divergence.

2. **Naming: `ContextIdentifierVisitor` vs `FindContextIdentifierState`**: The Rust struct at `find_context_identifiers.rs:24` is `ContextIdentifierVisitor` while the TS type at `FindContextIdentifiers.ts:30` is `FindContextIdentifierState`. The Rust naming is more idiomatic (it implements a `Visitor` trait).

3. **Return type difference**: The TS function at `FindContextIdentifiers.ts:47` returns `Set<t.Identifier>` (a set of AST identifier nodes), while the Rust function at `find_context_identifiers.rs:218` returns `HashSet<BindingId>`. This is an expected difference since Rust uses BindingId instead of AST node identity.

4. **`UpdateExpression` handling is simpler in Rust**: The TS at `FindContextIdentifiers.ts:82-89` checks `argument.isLVal()` and calls `handleAssignment`. The Rust at `find_context_identifiers.rs:132-140` only handles the `Identifier` case of `UpdateExpression.argument`. The TS also handles `MemberExpression` arguments (via the LVal check), but since MemberExpression is just "interior mutability" and is ignored anyway, this difference has no behavioral impact.

## Architectural Differences

1. **Visitor pattern vs Babel traverse**: The Rust uses an `AstWalker` + `Visitor` trait pattern (`find_context_identifiers.rs:64-141`) instead of Babel's `path.traverse()`. This is an expected architectural difference.

2. **Scope resolution via `ScopeInfo` instead of Babel scopes**: At `find_context_identifiers.rs:104`, the Rust uses `scope_info.reference_to_binding` to resolve identifiers, while TS uses `path.scope.getBinding(name)`. This is an expected architectural difference per the Rust port's reliance on serialized scope data.

3. **`is_captured_by_function` is a standalone function**: At `find_context_identifiers.rs:186-207`, this replaces Babel's `currentFn.scope.parent.getBinding(name)` comparison. The TS checks `binding === bindingAboveLambdaScope` (reference equality), while Rust walks the scope tree to check ancestry. This is an expected architectural difference.

## Missing TypeScript Features
None. All functionality from `FindContextIdentifiers.ts` is replicated.
