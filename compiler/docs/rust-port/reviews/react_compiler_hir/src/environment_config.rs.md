# Review: compiler/crates/react_compiler_hir/src/environment_config.rs

## Corresponding TypeScript file(s)
- `compiler/packages/babel-plugin-react-compiler/src/HIR/Environment.ts` (the `EnvironmentConfigSchema` portion)

## Summary
This file ports the environment configuration (feature flags, custom hook definitions). Most flags are present with correct defaults. Several flags are intentionally omitted (documented with TODO comments) because they require JS function callbacks or are codegen-only. The serde annotations correctly handle JSON deserialization with camelCase field names.

## Major Issues
None.

## Moderate Issues

1. **`customHooks` is `HashMap<String, HookConfig>` instead of `Map<string, Hook>`**
   `/compiler/crates/react_compiler_hir/src/environment_config.rs:61` - TS (`Environment.ts:143`) uses `z.map(z.string(), HookSchema)` which creates a `Map`. The Rust version uses `HashMap` which does not preserve insertion order. For custom hooks, order typically doesn't matter, but it differs from TS semantics.

2. **Missing `enableResetCacheOnSourceFileChanges` config**
   TS (`Environment.ts:176`) has `enableResetCacheOnSourceFileChanges: z.nullable(z.boolean()).default(null)`. The Rust port omits it with a TODO comment at line 68. This is a codegen-only flag but its absence means the config is not round-trippable.

3. **Missing `customMacros` config**
   TS (`Environment.ts:161`) has `customMacros: z.nullable(z.array(MacroSchema)).default(null)`. The Rust port omits it with a TODO at line 66.

4. **Missing `moduleTypeProvider` config**
   TS (`Environment.ts:149`) has `moduleTypeProvider: z.nullable(z.any()).default(null)`. Omitted with TODO at line 63.

5. **Missing `flowTypeProvider` config**
   TS (`Environment.ts:241`) has `flowTypeProvider: z.nullable(z.any()).default(null)`. Omitted with TODO at line 79.

6. **Missing `enableEmitHookGuards` config**
   TS (`Environment.ts:350`). Omitted with TODO at line 120.

7. **Missing `enableEmitInstrumentForget` config**
   TS (`Environment.ts:428`). Omitted with TODO at line 121.

## Minor Issues

1. **`HookConfig` field naming uses serde `rename_all = "camelCase"`**
   `/compiler/crates/react_compiler_hir/src/environment_config.rs:19` - Correctly maps `effect_kind` to `effectKind`, etc.

2. **`ExhaustiveEffectDepsMode` uses serde `rename` for lowercase values**
   `/compiler/crates/react_compiler_hir/src/environment_config.rs:29-39` - Correctly maps `Off` to `"off"`, etc.

3. **`validate_blocklisted_imports` has serde alias `restrictedImports`**
   `/compiler/crates/react_compiler_hir/src/environment_config.rs:107-108` - Matches TS's field name `validateBlocklistedImports`. The alias supports backwards compatibility.

4. **`validate_no_derived_computations_in_effects_exp` has serde alias**
   `/compiler/crates/react_compiler_hir/src/environment_config.rs:98` - Uses `alias = "validateNoDerivedComputationsInEffects_exp"` to handle the underscore suffix.

5. **`throw_unknown_exception_testonly` has serde alias**
   `/compiler/crates/react_compiler_hir/src/environment_config.rs:130-131` - Maps to `throwUnknownException__testonly`.

6. **`enable_forest` flag with tree emoji comment preserved**
   `/compiler/crates/react_compiler_hir/src/environment_config.rs:146` - The tree emoji comment is preserved from TS.

7. **All boolean defaults match TS**
   Cross-checked all defaults in the `Default` impl against TS's Zod schema defaults. They match:
   - `enable_preserve_existing_memoization_guarantees: true` matches `z.boolean().default(true)`
   - `enable_name_anonymous_functions: false` matches `z.boolean().default(false)`
   - etc.

8. **Missing `CompilerMode` type**
   TS (`Environment.ts:86`) has `CompilerMode = 'all_features' | 'no_inferred_memo'`. Not present in Rust.

## Architectural Differences

1. **Uses serde instead of Zod for validation/deserialization**
   Expected difference. Rust uses `#[derive(Serialize, Deserialize)]` with serde attributes instead of Zod schemas.

2. **`default_true` helper function**
   `/compiler/crates/react_compiler_hir/src/environment_config.rs:47-49` - Used for serde's `default = "default_true"` attribute. This is a Rust-specific pattern to express non-standard defaults.

## Missing TypeScript Features

1. **`ExternalFunctionSchema` and `ExternalFunction` type** - Used by `enableEmitHookGuards`.
2. **`InstrumentationSchema` type** - Used by `enableEmitInstrumentForget`.
3. **`MacroSchema` and `Macro` type** - Used by `customMacros`.
4. **`moduleTypeProvider` function callback** - Cannot be serialized across JS/Rust boundary.
5. **`flowTypeProvider` function callback** - Same limitation.
6. **`enableResetCacheOnSourceFileChanges` nullable boolean**.
7. **`parseEnvironmentConfig` and `validateEnvironmentConfig` functions** - TS (`Environment.ts:1041-1067`). In Rust, serde handles deserialization.
8. **`HookSchema` Zod schema** - Replaced by serde derive macros on `HookConfig`.
