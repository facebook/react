# Review: compiler/crates/react_compiler/src/entrypoint/imports.rs

## Corresponding TypeScript file(s)
- `compiler/packages/babel-plugin-react-compiler/src/Entrypoint/Imports.ts`
- `compiler/packages/babel-plugin-react-compiler/src/Entrypoint/Program.ts` (for `getReactCompilerRuntimeModule`)

## Summary
The Rust `imports.rs` ports the `ProgramContext` class and import management utilities from `Imports.ts`. It also includes `get_react_compiler_runtime_module` (from `Program.ts` in TS) and `validate_restricted_imports`. The port is structurally close with some notable differences in the `hasReference` and `newUid` implementations.

## Major Issues

1. **`hasReference` is less thorough than TS**: The TS `ProgramContext.hasReference` checks four sources: `knownReferencedNames.has(name)`, `scope.hasBinding(name)`, `scope.hasGlobal(name)`, `scope.hasReference(name)`. The Rust version only checks `known_referenced_names.contains(name)`. This means the Rust version may generate names that conflict with existing program bindings, globals, or references that weren't explicitly registered via `init_from_scope`.
   `/compiler/crates/react_compiler/src/entrypoint/imports.rs:100:1`

2. **`newUid` for non-hook names differs from Babel's `generateUid`**: The TS version calls `this.scope.generateUid(name)` for non-hook names that already have a reference, which uses Babel's sophisticated UID generation. The Rust version uses a simpler `_name` / `_name$0` / `_name$1` pattern. While functionally similar, the generated names may differ from what Babel produces, potentially causing test divergences.
   `/compiler/crates/react_compiler/src/entrypoint/imports.rs:126:1`

## Moderate Issues

1. **`NonLocalImportSpecifier` missing `kind` field**: The TS `NonLocalImportSpecifier` type has `kind: 'ImportSpecifier'`. The Rust version omits this field. If downstream code checks the `kind` field, this could cause issues.
   `/compiler/crates/react_compiler/src/entrypoint/imports.rs:27:1`

2. **`ProgramContext.logEvent` difference**: The TS `ProgramContext.logEvent` calls `this.opts.logger?.logEvent(this.filename, event)` which dispatches the event immediately via the logger callback. The Rust version pushes to internal `events` and `ordered_log` vectors. This is an architectural difference -- events are batched and returned -- but it means the Rust version always collects events regardless of whether a logger is configured.
   `/compiler/crates/react_compiler/src/entrypoint/imports.rs:181:1`

3. **Missing `assertGlobalBinding` method**: The TS `ProgramContext` has an `assertGlobalBinding(name, localScope?)` method that checks whether a generated import name conflicts with existing bindings and returns an error. The Rust version does not have this method. The TS `addImportsToProgram` calls `CompilerError.invariant(path.scope.getBinding(loweredImport.name) == null, ...)` to check for conflicts. The Rust version does no such validation.
   `/compiler/crates/react_compiler/src/entrypoint/imports.rs:196:1`

4. **`addImportsToProgram` missing invariant checks**: The TS version has two `CompilerError.invariant()` calls inside `addImportsToProgram`: one checking that the import name doesn't conflict with existing bindings, and one checking that `loweredImport.module === moduleName && loweredImport.imported === specifierName`. The Rust version has neither check.
   `/compiler/crates/react_compiler/src/entrypoint/imports.rs:241:1`

5. **CommonJS `require()` fallback not implemented**: The TS `addImportsToProgram` generates proper `const { imported: name } = require('module')` for non-module source types. The Rust version has a comment acknowledging this but falls back to emitting an `ImportDeclaration` for CommonJS too. This would produce invalid output for CommonJS modules.
   `/compiler/crates/react_compiler/src/entrypoint/imports.rs:296:1`

## Minor Issues

1. **`ProgramContext` stores `opts: PluginOptions` (owned) vs TS stores a reference**: The TS `ProgramContext` stores `opts: ParsedPluginOptions` which is the parsed options object. The Rust stores `opts: PluginOptions` as an owned clone. Both are functionally equivalent.
   `/compiler/crates/react_compiler/src/entrypoint/imports.rs:37:1`

2. **`alreadyCompiled` uses `HashSet<u32>` (position-based) vs TS uses `WeakSet<object>` (identity-based)**: The TS uses `WeakSet` to track compiled AST nodes by object identity. The Rust uses `HashSet<u32>` keyed by the start position of the function node. This could theoretically produce false positives if two functions have the same start position, but this shouldn't happen in valid ASTs.
   `/compiler/crates/react_compiler/src/entrypoint/imports.rs:50:1`

3. **`init_from_scope` is separate from constructor**: The TS `ProgramContext` constructor takes a `program: NodePath<t.Program>` and uses `program.scope` for name resolution. The Rust constructor takes no scope and requires `init_from_scope` to be called separately. This two-step initialization could lead to bugs if `init_from_scope` is forgotten.
   `/compiler/crates/react_compiler/src/entrypoint/imports.rs:93:1`

4. **`imports` uses `HashMap` not `IndexMap`**: The TS uses `Map` which preserves insertion order. The Rust uses `HashMap` which does not preserve order. However, `add_imports_to_program` sorts modules and imports before inserting, so the final output order is deterministic regardless.
   `/compiler/crates/react_compiler/src/entrypoint/imports.rs:52:1`

5. **`add_memo_cache_import` calls `add_import_specifier` with different signature**: The TS calls `this.addImportSpecifier({ source: this.reactRuntimeModule, importSpecifierName: 'c' }, '_c')`. The Rust calls `self.add_import_specifier(&module, "c", Some("_c"))`. The Rust version takes `module`, `specifier`, `name_hint` as separate args rather than a struct. Functionally equivalent.
   `/compiler/crates/react_compiler/src/entrypoint/imports.rs:138:1`

6. **`validate_restricted_imports` takes `&Option<Vec<String>>` vs TS destructures**: The TS function destructures `{validateBlocklistedImports}: EnvironmentConfig`. The Rust takes `blocklisted: &Option<Vec<String>>` directly. Functionally equivalent.
   `/compiler/crates/react_compiler/src/entrypoint/imports.rs:200:1`

7. **`is_hook_name` is duplicated**: This function appears in both `imports.rs` (line 362) and `program.rs` (line 227). The TS has a single `isHookName` function in `Environment.ts` that is imported by both modules. The duplication could lead to inconsistencies if one is updated but not the other.
   `/compiler/crates/react_compiler/src/entrypoint/imports.rs:362:1`

8. **Missing `log_debug` in TS `ProgramContext`**: The Rust `ProgramContext` has a `log_debug` method for debug entries. The TS version uses `env.logger?.debugLogIRs?.(value)` inside `Pipeline.ts` rather than going through `ProgramContext`. This is a structural difference in how debug logging is routed.
   `/compiler/crates/react_compiler/src/entrypoint/imports.rs:187:1`

## Architectural Differences

1. **No Babel scope access**: The TS `ProgramContext` stores `scope: BabelScope` and uses it for `hasBinding`, `hasGlobal`, `hasReference`, and `generateUid`. The Rust version stores only `known_referenced_names: HashSet<String>` populated from the serialized scope info. This means the Rust version has less information about the program's binding structure.
   `/compiler/crates/react_compiler/src/entrypoint/imports.rs:36:1`

2. **Event batching vs callback dispatching**: The TS dispatches events immediately via `logger.logEvent()`. The Rust collects events in vectors and returns them as part of `CompileResult`.
   `/compiler/crates/react_compiler/src/entrypoint/imports.rs:43:1`

## Missing TypeScript Features

1. **`assertGlobalBinding` method**: Validates that generated import names don't conflict with program bindings.
2. **Invariant checks in `addImportsToProgram`**: Binding conflict detection and import consistency checks.
3. **Proper CommonJS `require()` generation**: Falls back to import declarations instead.
4. **`isHookName` import from `HIR/Environment`**: Duplicated locally instead.
