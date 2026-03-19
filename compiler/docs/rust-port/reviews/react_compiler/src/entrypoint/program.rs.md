# Review: compiler/crates/react_compiler/src/entrypoint/program.rs

## Corresponding TypeScript file(s)
- `compiler/packages/babel-plugin-react-compiler/src/Entrypoint/Program.ts`

## Summary
The Rust `program.rs` is the main entrypoint, porting `Program.ts`. It orchestrates compilation by checking if compilation should be skipped, validating restricted imports, finding suppressions, discovering functions to compile, and processing each through the pipeline. The port is extensive (~1960 lines) and covers most of the TS logic, with key differences in AST traversal (manual walk vs Babel traverse), function type detection, and AST rewriting (stubbed out).

## Major Issues

1. **`apply_compiled_functions` is a stub**: The Rust version does not actually replace original functions with compiled versions in the AST. The function `apply_compiled_functions` is a no-op. This means the Rust compiler will run the pipeline and produce `CodegenFunction` results but never modify the AST. The `compile_program` always returns `CompileResult::Success { ast: None, ... }`.
   `/compiler/crates/react_compiler/src/entrypoint/program.rs:1675:1`

2. **`find_functions_to_compile` only traverses top-level statements**: The TS version uses `program.traverse()` which recursively walks the entire AST to find functions at any depth (subject to scope checks). The Rust version only walks the immediate children of `program.body`. This means:
   - Functions nested inside other expressions at the top level (e.g., `const x = { fn: function Foo() {} }`) are not found in `infer` or `syntax` modes, only in `all` mode via `find_nested_functions_in_expr`.
   - Functions inside `forwardRef`/`memo` calls are handled via `try_extract_wrapped_function`, but only at the immediate child level of `program.body` statements.
   `/compiler/crates/react_compiler/src/entrypoint/program.rs:1371:1`

3. **Missing `isComponentDeclaration` / `isHookDeclaration` checks**: The TS `getReactFunctionType` checks `isComponentDeclaration(fn.node)` and `isHookDeclaration(fn.node)` for `FunctionDeclaration` nodes. These check for the `component` and `hook` keyword syntax (React Compiler's component/hook declaration syntax). The Rust version skips these checks with a comment "Since standard JS doesn't have these, we skip this for now." This means `syntax` mode always returns `None` and functions declared with component/hook syntax would not be detected.
   `/compiler/crates/react_compiler/src/entrypoint/program.rs:807:1`

4. **Scope parent check missing for `all` mode**: The TS checks `fn.scope.getProgramParent() !== fn.scope.parent` to ensure only top-level functions are compiled in `all` mode. The Rust version does not have scope information and cannot perform this check. Instead, it uses the structural approach of `find_nested_functions_in_expr` which only finds functions at the immediate nesting level, not deeply nested ones.
   `/compiler/crates/react_compiler/src/entrypoint/program.rs:1371:1`

5. **Outlined function handling is missing**: The TS `compileProgram` processes outlined functions from `compiled.outlined` by inserting them into the AST and adding them to the compilation queue. The Rust version does not handle outlined functions at all (the `CodegenFunction.outlined` vector is always empty since codegen is not implemented).
   `/compiler/crates/react_compiler/src/entrypoint/program.rs:1790:1`

6. **`getFunctionReferencedBeforeDeclarationAtTopLevel` is missing**: The TS version detects functions that are referenced before their declaration (for gating hoisting). The Rust version does not implement this analysis. The `CompiledFunction` struct has `#[allow(dead_code)]` annotations suggesting the gating integration is not yet connected.
   `/compiler/crates/react_compiler/src/entrypoint/program.rs:1663:1`

## Moderate Issues

1. **`is_valid_props_annotation` uses `serde_json::Value` based approach**: The TS directly pattern-matches on AST node types (`annot.type === 'TSTypeAnnotation'` then `annot.typeAnnotation.type`). The Rust version accesses the type annotation as `serde_json::Value` via `.get("type")` and `.as_str()`. This suggests type annotations are stored as opaque JSON rather than typed AST nodes. This is fragile and could break if the JSON structure changes.
   `/compiler/crates/react_compiler/src/entrypoint/program.rs:692:1`

2. **`is_valid_props_annotation` has extra `NullLiteralTypeAnnotation`**: The Rust version includes `"NullLiteralTypeAnnotation"` in the Flow type annotation blocklist (line 728), which is not present in the TS version. This would cause the Rust version to reject components with `null` type-annotated first parameters that the TS would accept.
   `/compiler/crates/react_compiler/src/entrypoint/program.rs:728:1`

3. **`returns_non_node_fn` ignores the first parameter**: The function signature includes `params: &[PatternLike]` but immediately does `let _ = params;`. This is unused. The TS `returnsNonNode` also doesn't use params, so this is consistent but the parameter is unnecessary.
   `/compiler/crates/react_compiler/src/entrypoint/program.rs:385:1`

4. **`calls_hooks_or_creates_jsx_in_expr` recurses more deeply than TS**: The TS version uses Babel's `traverse` which visits all expression nodes. The Rust version manually recurses into many expression types (binary, logical, conditional, assignment, sequence, unary, update, member, optional member, spread, await, yield, tagged template, template literal, array, object, new, etc.). While this covers most cases, some expression types might be missed. Conversely, the Rust version explicitly handles `ObjectMethod` bodies (line 642), matching the TS behavior where Babel's traverse enters ObjectMethod but skips FunctionDeclaration/FunctionExpression/ArrowFunctionExpression.
   `/compiler/crates/react_compiler/src/entrypoint/program.rs:528:1`

5. **`get_function_name_from_id` is simpler than TS `getFunctionName`**: The TS `getFunctionName` checks multiple parent contexts (VariableDeclarator, AssignmentExpression, Property, AssignmentPattern) to infer a function's name. The Rust version only uses the function's `id` field. For function expressions assigned to variables, the name is passed separately via `inferred_name`. This means the Rust version's name inference works differently but achieves similar results through a different code path.
   `/compiler/crates/react_compiler/src/entrypoint/program.rs:296:1`

6. **`handle_error` returns `Some(CompileResult)` instead of throwing**: The TS `handleError` function `throw`s the error (which propagates up to crash the compilation). The Rust version returns `Some(CompileResult::Error{...})` which the caller must check. The caller in `compile_program` does check and returns early on fatal errors. However, the TS version throws from within `compileProgram` which completely aborts the function. The Rust version continues to `CompileResult::Success` if `handle_error` returns `None`.
   `/compiler/crates/react_compiler/src/entrypoint/program.rs:995:1`

7. **Missing `isError` check**: The TS `handleError` calls `isError(err)` which checks `!(err instanceof CompilerError) || err.hasErrors()`. This means non-CompilerError exceptions always trigger the panic threshold. The Rust version only checks `err.has_errors()` for `critical_errors` mode. Since the Rust version only deals with `CompilerError` (no arbitrary exceptions), the `isError` check simplifies to `err.has_errors()`.
   `/compiler/crates/react_compiler/src/entrypoint/program.rs:1003:1`

8. **`try_compile_function` does not wrap in try/catch**: The TS `tryCompileFunction` wraps `compileFn` in a try/catch to handle unexpected throws. The Rust version uses `Result` directly (no panic catching). If a pass panics in Rust, it will crash the process rather than being caught and logged as a `CompileUnexpectedThrow` event.
   `/compiler/crates/react_compiler/src/entrypoint/program.rs:1073:1`

9. **`find_functions_to_compile` does not skip classes inside nested expressions**: The TS version has `ClassDeclaration` and `ClassExpression` visitors that call `node.skip()` to avoid visiting functions inside classes. The Rust version skips `ClassDeclaration` at the top level and `ClassExpression` in `find_nested_functions_in_expr`, but does not skip classes encountered in other contexts during manual traversal (e.g., class expressions nested inside function arguments).
   `/compiler/crates/react_compiler/src/entrypoint/program.rs:1381:1`

10. **`compile_program` signature takes `File` by value**: The Rust `compile_program` takes `file: File` by value (consuming it). The program body is borrowed via `&file.program`, meaning the original AST cannot be returned or reused. This is fine since the function returns a `CompileResult` with a serialized AST, but it means the input AST is dropped after compilation.
    `/compiler/crates/react_compiler/src/entrypoint/program.rs:1693:1`

11. **`compile_program` does not call `init_from_scope` on `ProgramContext`**: The `ProgramContext::new` creates a context with an empty `known_referenced_names` set. The `init_from_scope` method that populates it from scope bindings is never called in `compile_program`. This means `new_uid` may generate names that conflict with existing program bindings.
    `/compiler/crates/react_compiler/src/entrypoint/program.rs:1760:1`

12. **`process_fn` handles opt-in parsing error differently**: The TS version calls `handleError(optIn.unwrapErr(), programContext, fn.node.loc ?? null)` which may throw (causing the whole program compilation to abort). The Rust version calls `log_error` and returns `Ok(None)` (skipping the function). This means an opt-in parsing error that would abort compilation in TS (under `all_errors` panic threshold) would only skip the function in Rust.
    `/compiler/crates/react_compiler/src/entrypoint/program.rs:1118:1`

## Minor Issues

1. **`OPT_IN_DIRECTIVES` and `OPT_OUT_DIRECTIVES` are `&[&str]` vs `Set<string>`**: The TS uses `Set` for O(1) lookup. The Rust uses `&[&str]` slice with linear scan. With only 2 elements, this is negligible.
   `/compiler/crates/react_compiler/src/entrypoint/program.rs:56:1`

2. **`DYNAMIC_GATING_DIRECTIVE` is compiled per-call**: The TS compiles the regex once as a module-level `const`. The Rust compiles it inside `find_directives_dynamic_gating` on every call. This is a minor performance difference.
   `/compiler/crates/react_compiler/src/entrypoint/program.rs:141:1`

3. **`is_valid_identifier` checks more reserved words than Babel**: The Rust `is_valid_identifier` checks for `"delete"` as a reserved word. The TS uses Babel's `t.isValidIdentifier()` which checks a different set. This could cause minor divergences for edge cases.
   `/compiler/crates/react_compiler/src/entrypoint/program.rs:211:1`

4. **`is_hook_name` is duplicated**: Appears in both `imports.rs` (line 362) and `program.rs` (line 227). Should be a shared utility.
   `/compiler/crates/react_compiler/src/entrypoint/program.rs:227:1`

5. **`is_component_name` only checks ASCII uppercase**: The TS uses `/^[A-Z]/.test(path.node.name)` which also only checks ASCII. Consistent.
   `/compiler/crates/react_compiler/src/entrypoint/program.rs:239:1`

6. **`expr_is_hook` uses `MemberExpression.computed`**: The TS checks `!path.node.computed`. The Rust checks `member.computed`. Both correctly skip computed member expressions. However, the Rust struct field `computed` is a `bool` while the TS `path.node.computed` may be a boolean or null. The Rust version assumes `false` means not computed.
   `/compiler/crates/react_compiler/src/entrypoint/program.rs:250:1`

7. **No `Reanimated` detection**: The TS `Program.ts` references Reanimated detection in `shouldSkipCompilation`. The Rust `should_skip_compilation` does not check for Reanimated. This is expected since Reanimated detection is JS-only.
   `/compiler/crates/react_compiler/src/entrypoint/program.rs:1213:1`

8. **`should_skip_compilation` does not check `sources`**: The TS `shouldSkipCompilation` checks if the filename matches the `sources` config. The Rust version only checks for existing runtime imports. The `sources` check is pre-resolved by the JS shim into `options.should_compile`.
   `/compiler/crates/react_compiler/src/entrypoint/program.rs:1213:1`

9. **`find_directives_dynamic_gating` returns `Option<&Directive>` not the gating config**: The TS returns `{ gating: ExternalFunction; directive: t.Directive } | null`. The Rust returns just `Option<&Directive>`. This means the Rust doesn't extract the matched identifier name or construct the `ExternalFunction`. However, the dynamic gating info is not currently used in the Rust gating rewrite path.
   `/compiler/crates/react_compiler/src/entrypoint/program.rs:133:1`

10. **`compile_program` does not call `add_imports_to_program`**: The TS `applyCompiledFunctions` calls `addImportsToProgram` to insert import declarations for the compiler runtime. The Rust `compile_program` does not call `add_imports_to_program` since AST rewriting is not yet implemented.
    `/compiler/crates/react_compiler/src/entrypoint/program.rs:1829:1`

11. **`compile_program` early-return for restricted imports differs**: The TS `handleError` can throw (aborting compilation). The Rust version returns `CompileResult::Success { ast: None }` after logging the error (if `handle_error` returns `None`). This means restricted import errors in the TS may abort the entire Babel build, while in Rust they produce a no-op success result.
    `/compiler/crates/react_compiler/src/entrypoint/program.rs:1772:1`

12. **Test module at bottom**: The Rust file includes `#[cfg(test)] mod tests` with unit tests for `is_hook_name`, `is_component_name`, `is_valid_identifier`, `is_valid_component_params`, and `should_skip_compilation`. The TS has no corresponding inline tests (tests are in separate fixture files).
    `/compiler/crates/react_compiler/src/entrypoint/program.rs:1837:1`

## Architectural Differences

1. **Manual AST traversal vs Babel traverse**: The TS uses Babel's `program.traverse()` with visitor pattern. The Rust manually walks `program.body` and its children. This is a fundamental architectural difference that affects how deeply functions are discovered.
   `/compiler/crates/react_compiler/src/entrypoint/program.rs:1371:1`

2. **No `NodePath`**: The TS heavily uses Babel's `NodePath` for AST manipulation, scope resolution, and skip/replace operations. The Rust has no equivalent. Function identification uses start positions instead of object identity.
   `/compiler/crates/react_compiler/src/entrypoint/program.rs:67:1`

3. **`CompileResult` is program-level, not function-level**: The Rust `CompileResult` is the return type of `compile_program` (the whole program). The TS `CompileResult` is per-function. The Rust version batches all events and returns them together.
   `/compiler/crates/react_compiler/src/entrypoint/program.rs:1693:1`

4. **`ScopeInfo` passed to `process_fn`**: The Rust passes the entire `ScopeInfo` to each function's compilation. The TS uses Babel's scope system which is per-function-path. The Rust version shares the program-level scope info across all function compilations.
   `/compiler/crates/react_compiler/src/entrypoint/program.rs:1791:1`

## Missing TypeScript Features

1. **AST rewriting** (`applyCompiledFunctions`, `createNewFunctionNode`, `insertNewOutlinedFunctionNode`).
2. **Outlined function handling** (inserting outlined functions, adding them to the compilation queue).
3. **Gating integration** (`insertGatedFunctionDeclaration` is ported in `gating.rs` but not connected).
4. **`getFunctionReferencedBeforeDeclarationAtTopLevel`** for gating hoisting detection.
5. **`isComponentDeclaration` / `isHookDeclaration`** for component/hook syntax detection.
6. **Scope-based parent checks** for `all` mode.
7. **Import insertion** (`addImportsToProgram` call).
8. **Dynamic gating** in `applyCompiledFunctions`.
9. **`Reanimated` detection** in `shouldSkipCompilation`.
10. **Exception catching** in `tryCompileFunction` for unexpected throws.
11. **`init_from_scope`** call in `compile_program`.
