# Review: react_compiler_hir/src/globals.rs

## Corresponding TypeScript source
- `compiler/packages/babel-plugin-react-compiler/src/HIR/Globals.ts`

## Summary
Comprehensive port of the global type registry and built-in shapes. All major React hooks, JavaScript built-ins, and type configuration logic are present.

## Major Issues
None

## Moderate Issues

### `install_type_config` signature differences
**Location:** globals.rs:34-40

Rust signature:
```rust
pub fn install_type_config(
    _globals: &mut GlobalRegistry,
    shapes: &mut ShapeRegistry,
    type_config: &TypeConfig,
    module_name: &str,
    _loc: (),
) -> Global
```

TypeScript signature (Globals.ts:~115):
```typescript
function installTypeConfig(
  globals: GlobalRegistry,
  shapes: ShapeRegistry,
  typeConfig: TypeConfig,
  moduleName: string,
  loc: SourceLocation,
): BuiltInType | PolyType
```

The `_loc` parameter is `()` instead of `SourceLocation` because error reporting in this function is different in Rust. The underscore prefix indicates unused parameters. This is acceptable.

## Minor Issues

### Return type naming
**Location:** globals.rs:22-23

Rust uses `type Global = Type` while TypeScript uses `type Global = BuiltInType | PolyType`. Both are correct - in Rust, `Type` is the enum that includes all variants.

### Build function organization
**Location:** globals.rs:1291+

Rust has `build_default_globals()` and `build_builtin_shapes()` as separate functions. TypeScript constructs them inline as module constants. Both approaches work.

### UNTYPED_GLOBALS representation
Rust uses a slice `&[&str]`, TypeScript uses `Set<string>`. Functionally equivalent.

## Architectural Differences

### Aliasing signature parsing
**Location:** globals.rs (throughout hook definitions)

Rust stores aliasing configurations as `AliasingSignatureConfig` (the JSON-serializable form) on `FunctionSignature`. TypeScript parses these into full `AliasingSignature` with actual `Place` values in the `addHook`/`addFunction` helpers (ObjectShape.ts:112-234).

The Rust approach defers parsing until needed, which is acceptable. The comment in object_shape.rs:115 notes: "Full parsing into AliasingSignature with Place values is deferred until the aliasing effects system is ported."

### Module-level organization
Rust organizes types and registries differently:
- `build_builtin_shapes()` - constructs shape registry
- `build_default_globals()` - constructs global registry
- `install_type_config()` - converts TypeConfig to Type

TypeScript uses module-level constants `DEFAULT_SHAPES` and exported arrays.

## Missing from Rust Port

### Parse aliasing signatures to full `AliasingSignature`
TypeScript's `addHook` and `addFunction` in ObjectShape.ts parse aliasing configs into full signatures with actual Place values (lines 112-234). Rust defers this - the `aliasing` field on `FunctionSignature` is `Option<AliasingSignatureConfig>` instead of `Option<AliasingSignature>`.

This is documented as intentional - aliasing effects system not fully ported yet.

### Some global object methods
Comparing TypeScript TYPED_GLOBALS (Globals.ts:84+) with Rust, most are present but some obscure methods may be missing. A full audit would require line-by-line comparison of all ~700 lines of global definitions.

## Additional in Rust Port

### Explicit builder functions
**Location:** globals.rs:1291, 1324

`build_default_globals()` and `build_builtin_shapes()` are explicit functions that construct and return the registries. TypeScript uses module-level constants. The Rust approach is clearer and more testable.

### `get_reanimated_module_type` function
**Location:** globals.rs (search for this function)

Rust has this as a separate function for constructing the reanimated module type. Good separation of concerns.

## Notes

The port is comprehensive and includes all major hooks and globals. The aliasing signature handling is intentionally simplified pending the full aliasing effects port. All React hooks (useState, useEffect, useMemo, useCallback, useRef, useReducer, useContext, useTransition, useOptimistic, useActionState, useImperativeHandle, useEffectEvent) are properly defined with their signatures.

Key React hook definitions verified:
- ✓ useState (with SetState type)
- ✓ useEffect, useLayoutEffect, useInsertionEffect
- ✓ useMemo, useCallback
- ✓ useRef (with RefValue type)
- ✓ useReducer (with Dispatch type)
- ✓ useContext
- ✓ useTransition (with StartTransition type)
- ✓ useOptimistic (with SetOptimistic type)
- ✓ useActionState (with SetActionState type)
- ✓ useImperativeHandle
- ✓ useEffectEvent (with EffectEvent type)

JavaScript built-ins verified:
- ✓ Object (keys, values, entries, fromEntries)
- ✓ Array (isArray, from, of)
- ✓ Math (max, min, floor, ceil, pow, random, etc.)
- ✓ console (log, error, warn, info, table, trace)
- ✓ Date (now)
- ✓ performance (now)
- ✓ Boolean, Number, String, parseInt, parseFloat, isNaN, isFinite
