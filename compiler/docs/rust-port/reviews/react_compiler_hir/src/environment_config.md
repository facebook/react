# Review: react_compiler_hir/src/environment_config.rs

## Corresponding TypeScript source
- `compiler/packages/babel-plugin-react-compiler/src/HIR/Environment.ts` (EnvironmentConfigSchema, lines 62-510+)

## Summary
Complete port of the environment configuration schema. All feature flags and settings are present with correct defaults.

## Major Issues
None

## Moderate Issues

### Missing fields from TypeScript schema

Several fields from the TypeScript `EnvironmentConfigSchema` are not in the Rust port:

1. **`moduleTypeProvider`** (TypeScript line 149)
   - Documented with TODO comment in environment_config.rs:63-64
   - Acceptable: requires JS function callback, hardcoded to `defaultModuleTypeProvider` in Rust

2. **`enableResetCacheOnSourceFileChanges`** (TypeScript line 176)
   - Documented with TODO comment in environment_config.rs:71
   - Only used in codegen, acceptable to skip for now

3. **`flowTypeProvider`** (TypeScript line 241)
   - Documented with TODO comment in environment_config.rs:82
   - Requires JS function callback, acceptable to skip

4. **`enableEmitHookGuards`** (TypeScript line 350)
   - Documented with TODO comment in environment_config.rs:123
   - Requires ExternalFunction schema, used only in codegen

5. **`enableEmitInstrumentForget`** (TypeScript line 428)
   - Documented with TODO comment in environment_config.rs:124
   - Requires InstrumentationSchema, used only in codegen

All missing fields are properly documented with TODO comments explaining why they're omitted.

## Minor Issues

### Alias naming difference
**Location:** environment_config.rs:101, 110

Uses `#[serde(alias = "...")]` for backwards compatibility:
- `validateNoDerivedComputationsInEffects_exp`
- `restrictedImports` → `validateBlocklistedImports`

TypeScript uses different field names in the schema. The Rust approach is correct.

### Default value helper
**Location:** environment_config.rs:47-49

Uses `default_true()` helper function. TypeScript uses `.default(true)` directly in Zod schema. Both are functionally equivalent.

## Architectural Differences

### Serde-based validation vs Zod
Rust uses `serde` for deserialization and validation, while TypeScript uses Zod schemas. The Rust approach is idiomatic.

### No runtime schema validation
TypeScript's Zod provides runtime validation with detailed error messages. Rust's serde provides compile-time type safety with basic runtime deserialization. This is acceptable as the config is typically validated at the entrypoint.

## Missing from Rust Port

### `ExternalFunctionSchema` type
**Location:** TypeScript Environment.ts:62-68

Not needed in Rust port yet as `enableEmitHookGuards` is not implemented.

### `InstrumentationSchema` type
**Location:** TypeScript Environment.ts:70-79

Not needed in Rust port yet as `enableEmitInstrumentForget` is not implemented.

### `MacroSchema` type
**Location:** TypeScript Environment.ts:83

Rust has `custom_macros: Option<Vec<String>>` (line 69) which is functionally equivalent.

### `HookSchema` validation
**Location:** TypeScript Environment.ts:89-128

Rust has `HookConfig` struct (lines 18-27) with the same fields, but without Zod's detailed validation. Functionally equivalent.

## Additional in Rust Port

### Explicit `Default` implementation
**Location:** environment_config.rs:153-193

Rust implements `Default` trait explicitly with all default values listed. TypeScript uses Zod's `.default()` on each field. Both approaches are equivalent.

## Notes

The port is complete and correct for the fields that are relevant to the Rust compiler at this stage. All omissions are documented and justified. The configuration can be deserialized from JSON matching the TypeScript schema.
