# Review: react_compiler_hir/src/default_module_type_provider.rs

## Corresponding TypeScript source
- `compiler/packages/babel-plugin-react-compiler/src/HIR/DefaultModuleTypeProvider.ts`

## Summary
Exact port of the default module type provider with all three known-incompatible libraries properly configured.

## Major Issues
None

## Moderate Issues
None

## Minor Issues

### Different struct field construction
**Location:** default_module_type_provider.rs:20-99

Rust constructs `TypeConfig` structs explicitly:
```rust
TypeConfig::Object(ObjectTypeConfig {
    properties: Some(vec![...])
})
```

TypeScript (DefaultModuleTypeProvider.ts:46-69) uses object literals:
```typescript
{
  kind: 'object',
  properties: {
    useForm: { ... }
  }
}
```

Both are functionally identical. Rust approach is more verbose but type-safe.

### Boxed return types
**Location:** default_module_type_provider.rs:24, 64, 83

Rust uses `Box::new(TypeConfig::...)` for nested configs. TypeScript can use inline objects. This is necessary in Rust to break recursive type definitions.

## Architectural Differences

### No Zod validation
Rust returns plain `TypeConfig` enums. TypeScript can validate the returned configs against schemas. As discussed in type_config.rs review, this is acceptable.

## Missing from Rust Port
None - all three libraries are present with identical configurations.

## Additional in Rust Port
None

## Notes

Perfect port. All three known-incompatible libraries are configured:

1. **react-hook-form**: `useForm().watch()` function is marked incompatible
   - Rust: lines 20-56
   - TypeScript: lines 46-69
   - Error message matches exactly

2. **@tanstack/react-table**: `useReactTable()` hook is marked incompatible
   - Rust: lines 58-76
   - TypeScript: lines 71-87
   - Error message matches exactly

3. **@tanstack/react-virtual**: `useVirtualizer()` hook is marked incompatible
   - Rust: lines 78-94
   - TypeScript: lines 89-105
   - Error message matches exactly

The comments explaining the rationale for these incompatibilities are preserved from the TypeScript version (TypeScript file header comments).
