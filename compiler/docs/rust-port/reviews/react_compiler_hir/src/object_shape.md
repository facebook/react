# Review: react_compiler_hir/src/object_shape.rs

## Corresponding TypeScript source
- `compiler/packages/babel-plugin-react-compiler/src/HIR/ObjectShape.ts`

## Summary
Complete port of object shapes and function signatures with all core types and builder functions present. Aliasing signature parsing is intentionally deferred.

## Major Issues
None

## Moderate Issues

### `FunctionSignature.aliasing` type difference
**Location:** object_shape.rs:115

Rust: `pub aliasing: Option<AliasingSignatureConfig>`
TypeScript (ObjectShape.ts:~318): `aliasing: AliasingSignature | null`

TypeScript parses the config into a full `AliasingSignature` with actual `Place` values in `parseAliasingSignatureConfig` (ObjectShape.ts:112-234). Rust stores the config form and notes this is "deferred until the aliasing effects system is ported" (comment line 114).

This is acceptable - it's a conscious decision to defer the parsing logic until needed.

## Minor Issues

### Shape ID constant naming
**Location:** object_shape.rs:21-50

Rust uses `BUILT_IN_PROPS_ID`, `BUILT_IN_ARRAY_ID` etc. as `&str` constants.
TypeScript (ObjectShape.ts:~340+) uses string literals exported as constants like `BuiltInPropsId`, `BuiltInArrayId`.

Naming convention differs (SCREAMING_CASE vs PascalCase) but values are identical.

### `HookKind` representation
**Location:** object_shape.rs:56-95

Rust uses an enum with variants like `UseContext`, `UseState`, etc.
TypeScript (ObjectShape.ts:273-288) uses string literal union type.

Rust approach is more type-safe. Good improvement.

### Builder function signatures
**Location:** object_shape.rs:147-232

Rust uses builder pattern with `FunctionSignatureBuilder` and `HookSignatureBuilder` structs to avoid large parameter lists. TypeScript uses object literals with optional fields directly in the function calls.

The Rust approach is more ergonomic and provides better defaults. Good adaptation.

## Architectural Differences

### No aliasing signature parsing
As noted above, Rust defers parsing of aliasing signatures. TypeScript has a comprehensive `parseAliasingSignatureConfig` function (ObjectShape.ts:112-234) that:
1. Creates temporary Place values for each lifetime (`@receiver`, `@param0`, etc.)
2. Parses each effect config into an actual `AliasingEffect`
3. Returns an `AliasingSignature` with identifier IDs

Rust will need this logic when aliasing effects are fully ported.

### Shape registry mutation
**Location:** object_shape.rs:234-248

Rust's `addShape` uses `insert` which overwrites existing entries. TypeScript (ObjectShape.ts:260) has an invariant check that the ID doesn't already exist.

Comment in Rust (line 244-246) notes: "TS has an invariant that the id doesn't already exist. We use insert which overwrites. In practice duplicates don't occur for built-in shapes, and for user configs we want last-write-wins behavior."

This is a pragmatic choice.

### Counter for anonymous shape IDs
**Location:** object_shape.rs:135-140

Rust uses `AtomicU32` for thread-safe counter.
TypeScript (ObjectShape.ts:44) uses simple `let nextAnonId = 0`.

Rust approach is thread-safe, though HIR construction is typically single-threaded. Good defensive programming.

## Missing from Rust Port

### `parseAliasingSignatureConfig` function
**Location:** TypeScript ObjectShape.ts:112-234

As discussed above, this parsing logic is not in Rust yet. When the aliasing effects system is fully ported, this will need to be added.

### `signatureArgument` helper
**Location:** TypeScript ObjectShape.ts:~105

Helper function that creates a Place for signature parameters. Not needed in Rust yet since aliasing parsing is deferred.

### Aliasing signature validation
TypeScript validates that all names are unique and all referenced names exist. Rust will need similar validation when parsing is added.

## Additional in Rust Port

### Builder structs with `Default` implementations
**Location:** object_shape.rs:254-318

`FunctionSignatureBuilder` and `HookSignatureBuilder` structs with sensible defaults. Cleaner API than TypeScript's approach of checking for undefined on every field.

### `Display` implementation for `HookKind`
**Location:** object_shape.rs:75-95

Nice addition for debugging and error messages.

### Separate `default_nonmutating_hook` and `default_mutating_hook` functions
**Location:** object_shape.rs:325-379

Exported as module functions. TypeScript has these as constants (ObjectShape.ts:~230+). Both approaches work well.

## Notes

The port is structurally complete for current needs. The deferred aliasing signature parsing is a known gap that's acceptable at this stage. All shape IDs, hook kinds, and builder functions are present and correct. The Rust version uses more idiomatic patterns (enums, builder structs, atomic counters) which are good improvements over the TypeScript version.
