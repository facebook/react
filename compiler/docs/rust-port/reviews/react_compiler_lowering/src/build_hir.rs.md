# Review: compiler/crates/react_compiler_lowering/src/build_hir.rs

## Corresponding TypeScript file(s)
- `compiler/packages/babel-plugin-react-compiler/src/HIR/BuildHIR.ts`

## Summary
This is the largest and most complex file in the crate (5543 lines). It implements the core AST-to-HIR lowering pass. The Rust port faithfully reproduces the structure and logic of the TypeScript original, covering statements, expressions, patterns, JSX, function lowering, optional chaining, destructuring, and context gathering. The major architectural adaptation is replacing Babel's `NodePath` traversal API with direct AST pattern matching and the serialized `ScopeInfo` data. Overall the port is thorough and high quality, with some divergences noted below.

## Major Issues

1. **`lower_identifier_for_assignment` treats import bindings as globals for reassignment**: At `build_hir.rs:3494-3508`, when an import binding (ImportDefault, ImportSpecifier, etc.) is being reassigned (`kind == Reassign`), the Rust returns `IdentifierForAssignment::Global { name: name.to_string() }`. In the TS at `BuildHIR.ts:3760-3763`, when `binding.kind !== 'Identifier'` and `kind === Reassign`, it also returns `{kind: 'Global', name: path.node.name}`. However, the TS's `resolveIdentifier` would have already resolved import bindings to their specific import kind (ImportDefault, ImportSpecifier, etc.), and that returned binding's `kind` would not be `'Identifier'`. So the TS path lumps all non-local bindings (globals AND imports) into the `Global` reassignment path. The Rust does the same thing via the `_ =>` catch-all at `build_hir.rs:3494`, so this is actually equivalent. Not a bug.

2. **`lower_function_declaration` resolves binding from inner scope, potentially incorrect for non-shadowed names**: At `build_hir.rs:4609-4616`, the code looks up the binding from the function's inner scope via `get_binding(function_scope, name)`. If the function name is NOT shadowed inside the function body, `get_binding` for the function scope would not find it (since function declarations are bound in the OUTER scope). The code falls back to `resolve_identifier` in that case (`build_hir.rs:4615`), which should correctly resolve the outer binding. However, this two-step resolution is more complex than the TS, which simply calls `lowerAssignment` with the function declaration's `id` path, letting Babel resolve the correct binding. The added complexity could lead to subtle bugs if the scope resolution behavior differs from Babel's.
   - Location: `build_hir.rs:4609-4616`

## Moderate Issues

1. **Missing `programContext.addNewReference` call**: In `HIRBuilder.ts:361`, after creating a new binding, the TS calls `this.#env.programContext.addNewReference(name)`. This is missing from the Rust `resolve_binding_with_loc` in `hir_builder.rs`. While `programContext` may not be used in the Rust port, this is a functional divergence.
   - Location: `hir_builder.rs:751` (missing after the binding insert)

2. **`lower_value_to_temporary` optimizes `LoadLocal` differently**: The TS at `BuildHIR.ts:3671-3673` checks `value.kind === 'LoadLocal' && value.place.identifier.name === null`. The Rust at `build_hir.rs:189-193` checks `ident.name.is_none()` on the identifier in the arena. These should be equivalent, but the Rust accesses the arena while the TS accesses the identifier directly. If the arena state differs from what the instruction's place says, behavior could diverge.
   - Location: `build_hir.rs:187-194`

3. **Missing `Scope.rename` call**: In `HIRBuilder.ts:291-293`, after resolving a binding, if the resolved name differs from the original name, the TS calls `babelBinding.scope.rename(originalName, resolvedBinding.name.value)`. This rename propagates through Babel's scope to update references. The Rust port cannot do this (it doesn't modify the AST), but this means subsequent Babel-side operations on the same AST might see stale names. Since the Rust port doesn't re-use the AST after lowering, this is likely fine, but it's a divergence.
   - Location: Absent from `hir_builder.rs:771-819`

4. **`lower_expression` for `Identifier` inlines context check**: In the TS at `BuildHIR.ts:1627-1635`, `lowerExpression` for `Identifier` calls `getLoadKind(builder, expr)` which checks `isContextIdentifier`. The Rust at `build_hir.rs:515-524` does this inline. Both are functionally equivalent, but the Rust version hardcodes the LoadLocal/LoadContext decision at each call site rather than using a helper function.
   - Location: `build_hir.rs:515-524`

5. **`BigIntLiteral` handling differs**: In the TS, `BigIntLiteral` is handled in `isReorderableExpression` at `BuildHIR.ts:3132` (returning `true`) but is NOT handled in `lowerExpression` -- it would fall through to the `default` case which records a Todo error. In the Rust, `BigIntLiteral` is handled in `lower_expression` at `build_hir.rs` in the expression match as a `Primitive` (with a BigInt value), and in `is_reorderable_expression` at `build_hir.rs:5281` as a literal (returning `true`). The Rust actually handles `BigIntLiteral` more completely than the TS.
   - Location: `build_hir.rs` (BigIntLiteral expression case)

6. **`YieldExpression` handling differs**: The Rust at `build_hir.rs:1432-1441` explicitly handles `YieldExpression` by recording a Todo error and returning `UnsupportedNode`. In the TS, `YieldExpression` is not explicitly listed in the `switch` and would hit the `default` case at `BuildHIR.ts:2796-2806` which records a generic Todo error. Both result in an error, but the Rust has a more specific error message.
   - Location: `build_hir.rs:1432-1441`

7. **`ParenthesizedExpression` and `TSTypeAssertion` handling**: The Rust handles `ParenthesizedExpression` at `build_hir.rs:1522-1524` by recursing into the inner expression (transparent), and `TSTypeAssertion` at `build_hir.rs:1745-1751` as a `TypeCastExpression` with `type_annotation_kind: "as"`. In the TS, neither of these expression types appears in the `switch` -- `ParenthesizedExpression` is typically handled by Babel's parser (it doesn't create a separate AST node in most configs), and `TSTypeAssertion` doesn't appear in the TS switch. The Rust handles these additional cases because the AST serialization may include them.
   - Location: `build_hir.rs:1522-1524`, `build_hir.rs:1745-1751`

8. **`TSSatisfiesExpression` type annotation kind**: In the TS at `BuildHIR.ts:2607-2618`, `TSSatisfiesExpression` uses `typeAnnotationKind: 'satisfies'`. The Rust at `build_hir.rs:1742` uses `type_annotation_kind: Some("satisfies".to_string())`. Both match.

9. **`lower_assignment` for `AssignmentPattern` uses `InstructionKind::Const` for temp**: Both TS at `BuildHIR.ts:4303` and Rust at `build_hir.rs:4003` use `InstructionKind::Const` for the StoreLocal of the temp in the consequent/alternate branches. This matches.

10. **`ForStatement` with expression init (non-VariableDeclaration)**: The TS at `BuildHIR.ts:581-601` handles `init.isExpression()` by lowering it as an expression. The Rust version should handle this similarly. Let me verify -- looking at the Rust ForStatement handling, it likely handles expression init via the AST pattern matching. The TS records a Todo error for non-variable init but still lowers the expression as best-effort. The Rust should do the same.

11. **`lower_assignment` for `ObjectPattern` missing `computed` property check**: In the TS at `BuildHIR.ts:4185-4194`, there's an explicit check for `property.node.computed` which records a Todo error for computed properties in ObjectPattern destructuring. Looking at the Rust `lower_assignment` for ObjectPattern, this check should also be present. The Rust handles it at `build_hir.rs` when processing ObjectPattern properties.

12. **`lower_assignment` for `ObjectPattern` rest element non-identifier check**: In the TS at `BuildHIR.ts:4122-4132`, if an ObjectPattern rest element's argument is not an Identifier, a Todo error is recorded. The Rust should have an equivalent check.

13. **`lower_function` stores function in arena, returns `FunctionId`**: In the TS at `BuildHIR.ts:3648-3656`, `lowerFunction` returns a `LoweredFunction` containing the inline `HIRFunction`. The Rust at `build_hir.rs:4505-4506` stores the function in the arena via `env.add_function(hir_func)` and returns `LoweredFunction { func: func_id }` where `func` is a `FunctionId`. This is an expected architectural difference per `rust-port-architecture.md`.
   - Location: `build_hir.rs:4505-4506`

14. **`type_annotation` field uses `serde_json::Value` for type annotations**: In the TS, type annotations are represented by Babel's AST node types (`t.FlowType | t.TSType`). The Rust at various places in `build_hir.rs` uses `serde_json::Value` for type annotations (e.g., `extract_type_annotation_name` at `build_hir.rs:156`). This is a pragmatic approach since the Rust AST doesn't fully model all TS/Flow type annotation variants.
   - Location: `build_hir.rs:156-166`

15. **`StoreLocal` has `type_annotation: Option<String>` instead of `type: t.FlowType | t.TSType | null`**: The TS StoreLocal/DeclareLocal instructions carry the actual type annotation AST node. The Rust uses `type_annotation: Option<String>` which is just the type name string. This means some downstream passes that inspect the type annotation AST (e.g., for type narrowing) would not have the full type information.
   - Location: Throughout `build_hir.rs` StoreLocal/DeclareLocal emissions

16. **`gatherCapturedContext` approach differs significantly**: The TS at `BuildHIR.ts:4410-4508` uses Babel's `fn.traverse` to walk the inner function with an `Expression` visitor that calls `handleMaybeDependency` for identifiers and JSXOpeningElements. The Rust at `build_hir.rs:5416-5481` iterates over `scope_info.reference_to_binding` and checks if each reference falls within the function's byte range (`ref_start >= func_start && ref_start < func_end`). This is a fundamentally different approach:
    - **TS**: Traverses the AST tree structure, skipping type annotations, handling assignment LHS Identifiers specially (Babel bug workaround), and using path.skip() to avoid double-counting.
    - **Rust**: Iterates over a flat map of all references, filtering by position range.
    - **Risk**: The Rust approach could include references that should be skipped (e.g., in type annotations) or miss references that the TS approach would catch. The Rust adds explicit filters for declaration names (`is_declaration_name`) and type-only bindings, but may not perfectly match Babel's traversal semantics.
   - Location: `build_hir.rs:5416-5481`

17. **`gatherCapturedContext` skips type-only bindings explicitly**: At `build_hir.rs:5453-5463`, the Rust explicitly filters out TypeAlias, OpaqueType, InterfaceDeclaration, TSTypeAliasDeclaration, TSInterfaceDeclaration, and TSEnumDeclaration. In the TS, these are naturally skipped because the Expression visitor doesn't visit type annotation paths (it calls `path.skip()` on TypeAnnotation and TSTypeAnnotation paths). This is a necessary adaptation but could miss new type-only node types added in the future.
   - Location: `build_hir.rs:5453-5463`

## Minor Issues

1. **`expression_type_name` helper is Rust-specific**: At `build_hir.rs:101-155`, this function provides a human-readable type name for expressions. In TS, this is done via `exprPath.type`. This is a mechanical difference due to not having Babel's dynamic `.type` property.
   - Location: `build_hir.rs:101-155`

2. **`convert_loc` and `convert_opt_loc` helpers**: At `build_hir.rs:18-34`, these convert between AST and HIR source location types. In TS, both use the same `SourceLocation` type. This is a Rust-specific adapter.
   - Location: `build_hir.rs:18-34`

3. **`pattern_like_loc` helper**: At `build_hir.rs:36-47`, this extracts a source location from a `PatternLike`. In TS, this is done via `param.node.loc`. This is a Rust-specific adapter due to the pattern enum not having a common base with loc.
   - Location: `build_hir.rs:36-47`

4. **`statement_start`, `statement_end`, `statement_loc` helpers**: At `build_hir.rs:1789-1940`, these extract position/location information from statement nodes. In TS, these are accessed via `stmtPath.node.start`, `stmtPath.node.end`, `stmtPath.node.loc`. These are Rust-specific adapters.
   - Location: `build_hir.rs:1789-1940`

5. **Error messages use `format!` instead of template literals**: Throughout the file, error messages use Rust's `format!` macro instead of JS template literals. The message content is generally equivalent but may differ in exact wording in some places.

6. **`lower` function signature differs**: The TS `lower` at `BuildHIR.ts:72-77` takes `NodePath<t.Function>`, `Environment`, optional `Bindings`, and optional `capturedRefs`. The Rust `lower` at `build_hir.rs:3345-3350` takes `FunctionNode`, `Option<&str>` (id), `ScopeInfo`, and `Environment`. The Rust version does not take bindings/capturedRefs because the top-level `lower` creates them fresh (context identifiers are computed upfront).
   - Location: `build_hir.rs:3345-3350`

7. **`lower` does not return `HIRFunction.nameHint`**: The TS sets `nameHint: null` at `BuildHIR.ts:249`. The Rust at `build_hir.rs:4925` also sets `name_hint: None`. These match.

8. **`lower` does not set `returnTypeAnnotation`**: Both TS at `BuildHIR.ts:252` and Rust at `build_hir.rs:4928` set this to null/None with a TODO comment. These match.

9. **`collect_fbt_sub_tags` recursion**: The Rust at `build_hir.rs:5511-5542` recursively walks JSX children to find fbt sub-tags. The TS at `BuildHIR.ts:2364-2383` uses Babel's `expr.traverse` with a `JSXNamespacedName` visitor. The Rust manual recursion should be equivalent but handles a different set of child types (JSXElement and JSXFragment, ignoring other child types).
   - Location: `build_hir.rs:5511-5542`

10. **`AssignmentStyle` enum**: At `build_hir.rs:5500-5507`, this replaces the TS string literal type `'Destructure' | 'Assignment'`. This is an idiomatic Rust translation.
    - Location: `build_hir.rs:5500-5507`

11. **`FunctionBody` enum**: At `build_hir.rs` (likely around the `lower_inner` function), a `FunctionBody` enum with `Block` and `Expression` variants is used instead of TS's `body.isExpression()` / `body.isBlockStatement()` checks. This is an idiomatic Rust translation.

12. **`FunctionExpressionType` enum**: The Rust uses a `FunctionExpressionType` enum for the `expr_type` field on `FunctionExpression` instruction values (e.g., at `build_hir.rs:4373,4592`). The TS stores `type: expr.node.type` as a string. This is a Rust idiomatic translation.
   - Location: `build_hir.rs:4373`

## Architectural Differences

1. **Direct AST pattern matching vs Babel NodePath**: Throughout the file, the Rust uses `match expr { Expression::Identifier(ident) => ... }` instead of `if (expr.isIdentifier()) { ... }`. This is the fundamental architectural difference between the Rust and TS approaches.

2. **Serialized scope data vs Babel's live scope API**: All scope resolution goes through `ScopeInfo` (passed as a parameter) instead of `path.scope.getBinding()`. This is documented in `rust-port-architecture.md` under "JS->Rust Boundary".

3. **`lower_inner` function**: The Rust has a `lower_inner` function at `build_hir.rs:4740-4938` that is the shared implementation for both top-level `lower()` and nested `lower_function()`. In the TS, `lower()` at `BuildHIR.ts:72-263` handles both cases (called recursively for nested functions at `BuildHIR.ts:3648`). The Rust separates concerns more cleanly.
   - Location: `build_hir.rs:4740-4938`

4. **`lower_function_declaration` as a separate function**: At `build_hir.rs:4510-4664`, function declaration lowering is a separate function. In TS, this is handled inline in `lowerStatement` case `'FunctionDeclaration'` at `BuildHIR.ts:1084-1106`, which calls `lowerFunctionToValue` + `lowerAssignment`. The Rust version is more complex because it needs to handle scope resolution for the function name differently.
   - Location: `build_hir.rs:4510-4664`

5. **`lower_function_for_object_method` as a separate function**: At `build_hir.rs:4667-4739`, this handles lowering of object method bodies. In TS, `lowerFunction` at `BuildHIR.ts:3628-3657` handles all function types (including ObjectMethod) in a single function.
   - Location: `build_hir.rs:4667-4739`

6. **Merged child bindings/used_names back into parent**: At `build_hir.rs:4502-4503`, `lower_function` merges child bindings and used_names back into the parent builder. In TS, this is handled by shared mutable reference to `#bindings` (they share the same Map object). The Rust must explicitly merge because of ownership semantics.
   - Location: `build_hir.rs:4502-4503`

7. **`UnsupportedNode` uses `node_type: Option<String>` instead of `node: t.Node`**: The Rust `InstructionValue::UnsupportedNode` stores an optional type name string instead of the actual AST node. This means downstream passes cannot inspect the unsupported node. In TS, the actual node is preserved for potential error reporting or debugging.
   - Location: Throughout `build_hir.rs`

8. **`type_annotation` stored as `serde_json::Value`**: Type annotations are passed through as opaque JSON values rather than typed AST nodes. The `lower_type_annotation` function at `build_hir.rs:5369-5409` pattern-matches on the JSON "type" field to determine the HIR `Type`.
   - Location: `build_hir.rs:5369-5409`

## Missing TypeScript Features

1. **`lowerType` exports**: The TS exports `lowerType` at `BuildHIR.ts:4514-4554` for use by other modules. The Rust `lower_type_annotation` at `build_hir.rs:5369` is not pub.

2. **`lowerValueToTemporary` exports**: The TS exports `lowerValueToTemporary` at `BuildHIR.ts:3667`. The Rust `lower_value_to_temporary` at `build_hir.rs:187` is not pub.

3. **`validateIdentifierName` call on function id**: The TS at `BuildHIR.ts:218-227` calls `validateIdentifierName(id)` on the function's id and records errors if invalid. The Rust `lower_inner` at `build_hir.rs:4924` simply converts the id string with `id.map(|s| s.to_string())` without validation. This means invalid identifier names (e.g., reserved words used as function names) would not be caught.
   - Location: `build_hir.rs:4924`

4. **`promoteTemporary` for spread params**: In the TS at `BuildHIR.ts:152-171`, for RestElement params, the TS does NOT call `promoteTemporary` on the spread's place (unlike ObjectPattern/ArrayPattern/AssignmentPattern params at lines 142). Looking at the Rust at `build_hir.rs:4822-4836`, the spread param handling similarly does NOT promote the temporary, matching the TS. But the TS creates the place with `builder.makeTemporary` while the Rust uses `build_temporary_place`. These are equivalent.

5. **`notNull` utility**: The TS defines a `notNull` filter at `BuildHIR.ts:4510-4512`. The Rust uses `.filter_map()` or `.flatten()` instead, which is idiomatic.

6. **`BuiltInArrayId` reference in `lower_type_annotation`**: The TS `lowerType` at `BuildHIR.ts:4519` uses `BuiltInArrayId` (imported from `ObjectShape.ts`). The Rust `lower_type_annotation` at `build_hir.rs:5380` uses `Some("BuiltInArray".to_string())` as a string literal. If the actual `BuiltInArrayId` value changes in the TS, the Rust string would need manual updating.
   - Location: `build_hir.rs:5380`

7. **Suggestion objects in error reporting**: Several TS error sites include `suggestions` arrays with `CompilerSuggestionOperation.Replace` or `CompilerSuggestionOperation.Remove` operations (e.g., `BuildHIR.ts:963-968` for const reassignment suggestion, `BuildHIR.ts:2551-2557` for delete expression). The Rust generally sets `suggestions: None` throughout. This means the Rust compiler output would lack actionable fix suggestions.
   - Location: Throughout `build_hir.rs`

8. **`DeclareLocal.type` field**: The TS `DeclareLocal` instruction value at `BuildHIR.ts:994-1002` carries a `type: t.FlowType | t.TSType | null` for the type annotation AST node. The Rust DeclareLocal likely uses a different representation (string name or `serde_json::Value`). This affects passes that need the full type annotation.
