# Review: react_compiler_hir/src/type_config.rs

## Corresponding TypeScript source
- `compiler/packages/babel-plugin-react-compiler/src/HIR/TypeSchema.ts`

## Summary
Complete port of the type configuration schema types. All type config variants and aliasing effect configs are present.

## Major Issues
None

## Moderate Issues

### Missing Zod validation schemas
**Location:** type_config.rs (entire file)

TypeScript uses Zod schemas for runtime validation with detailed error messages. Rust relies on type-level validation and serde for deserialization. Key differences:

1. **No `LifetimeIdSchema` validation**: TypeScript validates that lifetime names start with '@' (TypeSchema.ts:39-41). Rust has no runtime check.

2. **No property name validation**: TypeScript validates object property names are valid identifiers, '*', or 'default' (TypeSchema.ts:23-28). Rust has no check.

3. **No refinement validation**: TypeScript FunctionTypeSchema and HookTypeSchema have complex optional field handling. Rust uses `Option<>` but doesn't validate combinations.

This is acceptable as validation happens at deserialization boundaries in Rust, and the TypeScript schemas primarily serve the JS-side configuration.

## Minor Issues

### `ApplyArgConfig` representation
**Location:** type_config.rs:96-101

Rust uses a simple enum:
```rust
pub enum ApplyArgConfig {
    Place(String),
    Spread { place: String },
    Hole,
}
```

TypeScript (TypeSchema.ts:152-166) uses a union type:
```typescript
type ApplyArgConfig =
  | string
  | {kind: 'Spread'; place: string}
  | {kind: 'Hole'};
```

Rust approach is more explicit. The `Place(String)` variant corresponds to the bare string case in TypeScript.

### `ValueReason` doesn't derive `Serialize`/`Deserialize`
**Location:** type_config.rs:27-41

Only derives `Debug, Clone, Copy, PartialEq, Eq, Hash`. TypeScript has full Zod schema (TypeSchema.ts with ValueReasonSchema).

This may cause issues if `ValueReason` needs to be serialized in config. However, it's typically only constructed from configs, not serialized back.

### Field naming conventions
Rust uses `snake_case` for struct fields (e.g., `positional_params`), while TypeScript JSON configs use `camelCase`. Serde's `#[serde(rename_all = "camelCase")]` handles this automatically in the main config, but the type config structs don't use serde yet.

## Architectural Differences

### No runtime validation
Rust validates structure at compile time via the type system. TypeScript uses Zod for rich runtime validation with helpful error messages. This is an acceptable trade-off - Rust catches more errors at compile time.

### Plain structs instead of Zod schemas
All the TypeScript `*Schema` exports become plain Rust structs/enums. The schemas serve as both type definitions and validators in TypeScript, but in Rust they're just type definitions.

## Missing from Rust Port

### Zod schema exports
TypeScript exports all the Zod schemas (e.g., `FreezeEffectSchema`, `AliasingEffectSchema`, `TypeSchema`) for reuse. Rust doesn't need these as the types are sufficient.

### Runtime validation helpers
TypeScript can validate arbitrary JSON against the schemas at runtime. Rust would need to implement serde Deserialize and custom validation logic to achieve the same.

### Schema composition utilities
Zod provides rich schema composition (`z.union`, `z.object`, etc.). Rust uses plain enum/struct composition.

## Additional in Rust Port

### Explicit enum variants
**Location:** type_config.rs:14-24, 28-41, 48-170

All the "effect config" types are explicit Rust enums and structs. This is clearer than TypeScript's union types.

### `BuiltInTypeRef` enum
**Location:** type_config.rs:157-164

Instead of TypeScript's string literal union `'Any' | 'Ref' | 'Array' | 'Primitive' | 'MixedReadonly'`, Rust uses a proper enum. Better type safety.

## Notes

This file purely defines configuration types - the data structures that describe type configurations in JSON. The actual logic for installing/using these configs is in `globals.rs` (`install_type_config`).

The port is complete and correct for its purpose. The lack of Zod-style runtime validation is acceptable because:
1. Rust's type system catches structural errors at compile time
2. Deserialization failures from invalid JSON are handled by serde
3. The main validation entry point is at the entrypoint where configs are loaded

All aliasing effect variants are present:
- ✓ Freeze
- ✓ Create
- ✓ CreateFrom
- ✓ Assign
- ✓ Alias
- ✓ Capture
- ✓ ImmutableCapture
- ✓ Impure
- ✓ Mutate
- ✓ MutateTransitiveConditionally
- ✓ Apply

All type config variants are present:
- ✓ Object
- ✓ Function
- ✓ Hook
- ✓ TypeReference
