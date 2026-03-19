# Review: compiler/crates/react_compiler_hir/src/environment.rs

## Corresponding TypeScript file(s)
- `compiler/packages/babel-plugin-react-compiler/src/HIR/Environment.ts`

## Summary
This file ports the `Environment` class which is the central coordinator for compilation state. It manages arenas, error accumulation, type registries, and configuration. The port is structurally faithful but simplified -- many TS features related to Babel scope, outlined functions, Flow types, and codegen are omitted. The core type resolution logic (`getGlobalDeclaration`, `getPropertyType`, `getFunctionSignature`) is well-ported.

## Major Issues

1. **`recordError` does not throw on Invariant errors**
   `/compiler/crates/react_compiler_hir/src/environment.rs:193-195` - In TS (`Environment.ts:722-731`), `recordError` checks if the error category is `Invariant` and if so, immediately throws a `CompilerError`. The Rust version simply pushes the error to the accumulator. This means invariant violations that should halt compilation will be silently accumulated instead. The `has_invariant_errors` and `take_invariant_errors` methods exist as workarounds, but they require callers to manually check, which differs from TS's automatic throw behavior.

2. **`getGlobalDeclaration` error handling for invalid type configs differs**
   `/compiler/crates/react_compiler_hir/src/environment.rs:310-324` - When the hook-name vs hook-type check fails in the `ImportSpecifier` case, the Rust version calls `self.record_error(CompilerErrorDetail::new(ErrorCategory::Config, ...))`. The TS version (`Environment.ts:879-884`) calls `CompilerError.throwInvalidConfig(...)` which creates a `Config` category error and throws immediately. Since `Config` is not `Invariant`, it would be caught by `tryRecord()` in the TS pipeline, but the error is still thrown immediately from `recordError`. In Rust, it's just accumulated.

3. **`getGlobalDeclaration` error handling for `ImportDefault`/`ImportNamespace` type config mismatch similarly uses `record_error` instead of throwing**
   `/compiler/crates/react_compiler_hir/src/environment.rs:364-377` - Same divergence as above.

4. **`resolve_module_type` does not parse/validate module type configs**
   `/compiler/crates/react_compiler_hir/src/environment.rs:520-538` - In TS (`Environment.ts:806-810`), the module config returned by `moduleTypeProvider` is parsed through `TypeSchema.safeParse()` with error handling for invalid configs. The Rust version directly calls `install_type_config` on the config returned by `default_module_type_provider` without validation.

5. **Custom `moduleTypeProvider` not supported**
   `/compiler/crates/react_compiler_hir/src/environment.rs:519` - The TODO comment acknowledges this. TS (`Environment.ts:795-797`) supports a custom `moduleTypeProvider` function from config. The Rust port always uses `defaultModuleTypeProvider`.

## Moderate Issues

1. **`is_known_react_module` converts to lowercase for comparison**
   `/compiler/crates/react_compiler_hir/src/environment.rs:541-543` - Calls `module_name.to_lowercase()` and compares with `"react"` and `"react-dom"`. TS (`Environment.ts:945-950`) does the same with `moduleName.toLowerCase()`. However, the TS version also has a static `knownReactModules` array. Functionally equivalent.

2. **`get_custom_hook_type` creates new shape entries on each call when cache is empty**
   `/compiler/crates/react_compiler_hir/src/environment.rs:545-558` - The lazy initialization pattern works correctly, but each `default_nonmutating_hook` / `default_mutating_hook` call registers a new shape in the registry. In TS, `DefaultNonmutatingHook` and `DefaultMutatingHook` are module-level constants computed once at import time from `BUILTIN_SHAPES`. The Rust approach creates per-Environment instances, which could lead to different shape IDs across compilations.

3. **`with_config` skips duplicate custom hook names silently**
   `/compiler/crates/react_compiler_hir/src/environment.rs:82-84` - Uses `if global_registry.contains_key(hook_name) { continue; }`. TS (`Environment.ts:583`) uses `CompilerError.invariant(!this.#globals.has(hookName), ...)` which throws. The Rust version silently skips, potentially hiding configuration errors.

4. **Missing `enableCustomTypeDefinitionForReanimated` implementation**
   `/compiler/crates/react_compiler_hir/src/environment.rs:108` - TODO comment. TS (`Environment.ts:603-606`) registers the reanimated module type when this config flag is enabled.

5. **`next_identifier_id` allocates an identifier with `DeclarationId` equal to `IdentifierId`**
   `/compiler/crates/react_compiler_hir/src/environment.rs:148` - Sets `declaration_id: DeclarationId(id.0)`. In TS (`Environment.ts:687-689`), `nextIdentifierId` just returns the next ID; the `Identifier` object is constructed elsewhere with `makeTemporaryIdentifier` which calls `makeDeclarationId(id)`. The behavior is equivalent but the Rust version couples ID allocation with Identifier construction.

6. **`get_property_type` returns `Option<Type>` and clones**
   `/compiler/crates/react_compiler_hir/src/environment.rs:420-450` - Returns cloned `Type` values. TS returns references. The cloning is necessary in Rust due to borrow checker constraints but could be expensive for complex types.

7. **`get_property_type_from_shapes` is a static method to avoid double-borrow**
   `/compiler/crates/react_compiler_hir/src/environment.rs:394-416` - This is an internal helper that takes `&ShapeRegistry` instead of `&self` to avoid borrow conflicts when `self` is also being mutated (e.g., for module type caching). This is a Rust-specific workaround not needed in TS.

8. **`OutputMode` enum values don't exactly match TS**
   `/compiler/crates/react_compiler_hir/src/environment.rs:18-22` - Rust has `Ssr`, `Client`, `Lint`. TS (`Entrypoint`) has `'client' | 'ssr' | 'lint'`. The values match but the names use PascalCase. TS also refers to this as `CompilerOutputMode`.

9. **`enable_validations` always returns `true`**
   `/compiler/crates/react_compiler_hir/src/environment.rs:573-577` - The match is exhaustive over all variants and all return `true`. This matches TS (`Environment.ts:671-685`) where all output modes return `true` for `enableValidations`.

## Minor Issues

1. **Missing `logger`, `filename`, `code` fields**
   TS `Environment` has `logger: Logger | null`, `filename: string | null`, `code: string | null`. These are used for logging compilation events. Not present in Rust.

2. **Missing `#scope` (BabelScope) field**
   TS has `#scope: BabelScope` for generating unique identifier names. Not present in Rust.

3. **Missing `#contextIdentifiers` field**
   TS has `#contextIdentifiers: Set<t.Identifier>` for tracking context identifiers. Rust uses `hoisted_identifiers: HashSet<u32>` with a different type.

4. **Missing `#outlinedFunctions` field and methods**
   TS has `outlineFunction()` and `getOutlinedFunctions()`. Not present in Rust.

5. **Missing `#flowTypeEnvironment` field**
   TS has `#flowTypeEnvironment: FlowTypeEnv | null`. Not present in Rust.

6. **Missing `enableDropManualMemoization` getter**
   TS (`Environment.ts:633-649`). Not present in Rust.

7. **Missing `enableMemoization` getter**
   TS (`Environment.ts:652-669`). Not present in Rust.

8. **Missing `generateGloballyUniqueIdentifierName` method**
   TS (`Environment.ts:770-775`). Not present in Rust.

9. **Missing `logErrors` method**
   TS (`Environment.ts:703-714`). Not present in Rust.

10. **Missing `recordErrors` method (plural)**
    TS (`Environment.ts:742-746`). Rust has `record_error` (singular) and `record_diagnostic`.

11. **Missing `aggregateErrors` method**
    TS (`Environment.ts:758-760`). Rust has `errors()` and `take_errors()` but no `aggregateErrors`.

12. **Missing `isContextIdentifier` method**
    TS (`Environment.ts:762-764`). Not present in Rust.

13. **Missing `printFunctionType` function**
    TS (`Environment.ts:513-525`). Not present in Rust.

14. **Missing `tryParseExternalFunction` function**
    TS (`Environment.ts:1069-1086`). Not present in Rust.

15. **Missing `DEFAULT_EXPORT` constant**
    TS (`Environment.ts:1088`). Not present in Rust.

16. **`hoisted_identifiers` uses `u32` instead of Babel `t.Identifier`**
    `/compiler/crates/react_compiler_hir/src/environment.rs:47` - Uses raw `u32` binding IDs to avoid depending on Babel AST types. Documented with a comment.

17. **`validate_preserve_existing_memoization_guarantees`, `validate_no_set_state_in_render`, `enable_preserve_existing_memoization_guarantees` are duplicated on Environment**
    `/compiler/crates/react_compiler_hir/src/environment.rs:50-53` - These are copied from `config` to top-level fields. TS accesses them via `env.config.*`. This duplication is unnecessary since `config` is a public field.

18. **`fn_type` default is `ReactFunctionType::Other`**
    `/compiler/crates/react_compiler_hir/src/environment.rs:118` - In TS, `fnType` is a constructor parameter, not a default. The Rust default may not be correct for all use cases.

19. **`output_mode` default is `OutputMode::Client`**
    `/compiler/crates/react_compiler_hir/src/environment.rs:119` - In TS, `outputMode` is a constructor parameter.

## Architectural Differences

1. **`Environment` stores arenas directly**
   `/compiler/crates/react_compiler_hir/src/environment.rs:30-33` - `identifiers`, `types`, `scopes`, `functions` are stored as `Vec<T>` on Environment. In TS, these are managed differently (identifiers are on `HIRFunction`, scopes are inline on identifiers, etc.). Documented in architecture guide.

2. **`env` is separate from `HirFunction`**
   As documented in the architecture guide, passes receive `env: &mut Environment` separately.

3. **Block ID counter on Environment instead of accessor**
   `/compiler/crates/react_compiler_hir/src/environment.rs:26-27` - Counters are public fields. TS uses private fields with getters.

4. **`GlobalRegistry` and `ShapeRegistry` are `HashMap` types**
   `/compiler/crates/react_compiler_hir/src/environment.rs:55-56` - TS uses `Map`. Expected type mapping.

## Missing TypeScript Features

1. **Babel scope integration** (`BabelScope`, `generateGloballyUniqueIdentifierName`)
2. **Flow type environment** (`FlowTypeEnv`)
3. **Outlined functions** (`outlineFunction`, `getOutlinedFunctions`)
4. **Logger integration** (`logErrors`, `logger` field)
5. **`enableDropManualMemoization` and `enableMemoization` getters**
6. **Custom `moduleTypeProvider` support**
7. **Reanimated module type registration**
8. **`isContextIdentifier` method**
9. **Module type config Zod validation/parsing**
