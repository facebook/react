# Review: compiler/crates/react_compiler_hir/src/type_config.rs

## Corresponding TypeScript file(s)
- `compiler/packages/babel-plugin-react-compiler/src/HIR/TypeSchema.ts`
- `compiler/packages/babel-plugin-react-compiler/src/HIR/HIR.ts` (for `ValueKind`, `ValueReason`)

## Summary
This file ports the type configuration types used for JSON-serializable module/hook/function type descriptions. The types are structurally faithful to the TS originals. Zod schemas are not ported (expected, since Rust uses serde for deserialization).

## Major Issues
None.

## Moderate Issues

1. **`ApplyArgConfig` representation differs from TS**
   `/compiler/crates/react_compiler_hir/src/type_config.rs:97-101` - TS (`TypeSchema.ts:152-155`) uses a union `string | {kind: 'Spread', place: string} | {kind: 'Hole'}`. Rust uses an enum with `Place(String)`, `Spread { place: String }`, `Hole`. The `Place` variant name differs from TS where a plain string represents a place. Functionally equivalent.

2. **`ValueReason` has `StoreLocal` variant not present in TS**
   `/compiler/crates/react_compiler_hir/src/type_config.rs:38` - The Rust `ValueReason` enum includes `StoreLocal`. The TS `ValueReason` enum (`HIR.ts:1421-1473`) does not have `StoreLocal`. This is an addition in the Rust port not present in the TS original.

## Minor Issues

1. **`ValueKind` serde representation matches TS enum values**
   `/compiler/crates/react_compiler_hir/src/type_config.rs:14-24` - Uses `#[serde(rename_all = "lowercase")]` which correctly maps to the TS string enum values (`'mutable'`, `'frozen'`, etc.). The `MaybeFrozen` variant uses `#[serde(rename = "maybefrozen")]` to match.

2. **`ValueReason` is not serde-serializable**
   `/compiler/crates/react_compiler_hir/src/type_config.rs:27` - No `Serialize`/`Deserialize` derives. TS has `ValueReasonSchema` for validation. Not an issue since `ValueReason` is only used internally, not in JSON configs.

3. **`TypeConfig` kind discriminant differs**
   TS uses `kind: 'object' | 'function' | 'hook' | 'type'`. Rust uses enum variant names `Object`, `Function`, `Hook`, `TypeReference`. The TS `TypeReferenceConfig` has `kind: 'type'` while Rust uses a separate `TypeReferenceConfig` struct. Semantically equivalent.

4. **`FunctionTypeConfig` field `impure` is `Option<bool>` vs TS `boolean | null | undefined`**
   `/compiler/crates/react_compiler_hir/src/type_config.rs:140` - Semantically equivalent.

5. **No Zod schema definitions**
   TS includes extensive Zod schema definitions for validation. The Rust port omits these entirely. If serde deserialization is used, validation would rely on serde's type system rather than Zod-style runtime validation.

6. **`ObjectTypeConfig.properties` is `Option<Vec<(String, TypeConfig)>>` vs TS `ObjectPropertiesConfig | null` where `ObjectPropertiesConfig = {[key: string]: TypeConfig}`**
   `/compiler/crates/react_compiler_hir/src/type_config.rs:127-129` - TS uses a record/dictionary; Rust uses a vector of tuples. This means duplicate keys are possible in the Rust version. Also, TS validates that property keys are valid identifiers, `*`, or `default`; the Rust version does not validate.

## Architectural Differences
None significant.

## Missing TypeScript Features

1. **Zod validation schemas** - `ObjectPropertiesSchema`, `FunctionTypeSchema`, `HookTypeSchema`, etc. are not ported.
2. **`LifetimeIdSchema` validation** - TS validates that placeholder names start with `@`. Rust does not validate this.
3. **`ObjectPropertiesSchema.refine` validation** - TS validates property names are valid identifiers. Not ported.
