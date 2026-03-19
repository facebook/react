# Review: compiler/crates/react_compiler/src/entrypoint/gating.rs

## Corresponding TypeScript file(s)
- `compiler/packages/babel-plugin-react-compiler/src/Entrypoint/Gating.ts`

## Summary
The Rust `gating.rs` ports the gating rewrite logic from `Gating.ts`. When gating is enabled, compiled functions are wrapped in a conditional expression that checks a feature flag. The port covers the main `insertGatedFunctionDeclaration` logic (split into `apply_gating_rewrites` for the non-hoisted case and `insert_additional_function_declaration` for the referenced-before-declared case). The structural approach differs due to lack of Babel path manipulation -- the Rust version works with indices into `program.body`.

## Major Issues

1. **Batch approach vs individual path operations**: The TS `insertGatedFunctionDeclaration` is called per-function and uses Babel path operations (`replaceWith`, `insertBefore`, `insertAfter`). The Rust `apply_gating_rewrites` batches all rewrites and processes them in reverse index order. While conceptually equivalent, the batch approach assumes all rewrites are independent and their indices don't interact, which should be true when processed in reverse order. However, if `insert_additional_function_declaration` inserts multiple statements, the index tracking could go wrong if multiple rewrites target adjacent indices.
   `/compiler/crates/react_compiler/src/entrypoint/gating.rs:49:1`

## Moderate Issues

1. **`extract_function_node_from_stmt` handles `VariableDeclaration` case**: The TS `buildFunctionExpression` only handles `FunctionDeclaration`, `ArrowFunctionExpression`, and `FunctionExpression`. The Rust `extract_function_node_from_stmt` also handles `VariableDeclaration` (extracting the init expression). This extra case in Rust could handle situations the TS cannot, or may never be reached.
   `/compiler/crates/react_compiler/src/entrypoint/gating.rs:486:1`

2. **Missing `ExportNamedDeclaration` handling in `apply_gating_rewrites`**: The TS version handles `ExportNamedDeclaration` wrapping through Babel's path system (checking `fnPath.parentPath.node.type !== 'ExportDefaultDeclaration'`). The Rust version checks `rewrite.is_export_default` but doesn't handle `ExportNamedDeclaration` wrapping a function declaration. This means `export function Foo() {}` with gating might not be handled correctly -- the function declaration would be replaced with a `const` but the export would be lost.
   `/compiler/crates/react_compiler/src/entrypoint/gating.rs:92:1`

3. **`insert_additional_function_declaration` handles `ExportNamedDeclaration` for extraction but not for re-export**: When extracting the original function from `body[original_index]`, the Rust code handles `ExportNamedDeclaration` wrapping a `FunctionDeclaration`. However, after inserting the dispatcher function and renaming the original, the export wrapper is not preserved. The dispatcher function is inserted as a bare `FunctionDeclaration`, not wrapped in an export.
   `/compiler/crates/react_compiler/src/entrypoint/gating.rs:196:1`

## Minor Issues

1. **`CompiledFunctionNode` enum naming**: The TS uses `t.FunctionDeclaration | t.ArrowFunctionExpression | t.FunctionExpression` directly. The Rust defines a `CompiledFunctionNode` enum to wrap these. This is a necessary Rust-ism.
   `/compiler/crates/react_compiler/src/entrypoint/gating.rs:21:1`

2. **`GatingRewrite` struct is Rust-specific**: The TS doesn't have a rewrite struct -- it calls `insertGatedFunctionDeclaration` directly per function. The Rust collects rewrites first and applies them later.
   `/compiler/crates/react_compiler/src/entrypoint/gating.rs:30:1`

3. **`make_identifier` helper**: The Rust has a helper function `make_identifier` that creates an `Identifier` with default `BaseNode`. The TS uses `t.identifier(name)` from Babel types. Functionally equivalent.
   `/compiler/crates/react_compiler/src/entrypoint/gating.rs:422:1`

4. **`build_function_expression` does not preserve `FunctionDeclaration.predicate`**: When converting a `FunctionDeclaration` to a `FunctionExpression`, the Rust version drops the `predicate` field (Flow-specific). The TS version also doesn't preserve it (it creates a new `FunctionExpression` node without `predicate`), so this is consistent.
   `/compiler/crates/react_compiler/src/entrypoint/gating.rs:405:1`

5. **Panic vs invariant error**: The TS uses `CompilerError.invariant(...)` which throws. The Rust uses `panic!(...)` in several places. Both crash but with different error handling paths. The TS version's invariant errors can potentially be caught by error boundaries upstream.
   `/compiler/crates/react_compiler/src/entrypoint/gating.rs:79:1`

6. **Missing `ExportNamedDeclaration` case in `extract_function_node_from_stmt`**: The TS doesn't need this because Babel paths handle export wrapping transparently. The Rust version doesn't handle `ExportNamedDeclaration` in `extract_function_node_from_stmt`, which means if the original statement is an `export function Foo() {}`, the extraction would fall through to the panic at line 501.
   `/compiler/crates/react_compiler/src/entrypoint/gating.rs:457:1`

## Architectural Differences

1. **Index-based vs path-based manipulation**: The TS uses Babel's `NodePath` for AST manipulation (`replaceWith`, `insertBefore`, `insertAfter`). The Rust uses indices into `program.body`. This is a fundamental architectural difference.
   `/compiler/crates/react_compiler/src/entrypoint/gating.rs:49:1`

2. **Batch processing**: The TS processes gating rewrites one at a time as each function is compiled. The Rust collects all rewrites and applies them in a batch (reverse index order). This is necessary because index-based insertion requires careful ordering.
   `/compiler/crates/react_compiler/src/entrypoint/gating.rs:49:1`

## Missing TypeScript Features

1. **Dynamic gating handling in the gating rewrite**: The TS `applyCompiledFunctions` checks for dynamic gating directives (`findDirectivesDynamicGating`) and uses the result as the gating config if present. The Rust gating code receives the gating config from the `GatingRewrite` struct but doesn't itself check for dynamic gating directives.
2. **Proper export wrapping preservation**: When the original function is inside an `ExportNamedDeclaration`, the TS preserves the export via path operations. The Rust version may lose the export.
