# Review: compiler/crates/react_compiler_hir/src/object_shape.rs

## Corresponding TypeScript file(s)
- `compiler/packages/babel-plugin-react-compiler/src/HIR/ObjectShape.ts`

## Summary
This file ports the object shape registry, function signatures, and builder functions. The structure is faithful to the TS original. Shape ID constants match. The main divergence is that the Rust `addShape` does not check for duplicate IDs (the TS version throws an invariant error on duplicates).

## Major Issues

1. **`add_shape` does not check for duplicate shape IDs**
   `/compiler/crates/react_compiler_hir/src/object_shape.rs:222-226` - The TS version (`ObjectShape.ts:265-269`) throws `CompilerError.invariant(!registry.has(id), ...)` if a shape ID already exists. The Rust version uses `HashMap::insert` which silently overwrites. The comment at line 223 acknowledges this divergence but claims "last-write-wins behavior." This is incorrect behavior for built-in shapes where a duplicate would indicate a bug.

## Moderate Issues

1. **`FunctionSignature.aliasing` stores `AliasingSignatureConfig` instead of parsed `AliasingSignature`**
   `/compiler/crates/react_compiler_hir/src/object_shape.rs:93` - TS (`ObjectShape.ts:338`) stores `aliasing?: AliasingSignature | null | undefined` which is the parsed form with actual `Place` values. The Rust version stores the config form (`AliasingSignatureConfig`) and defers parsing. This means the aliasing signature is never validated at shape registration time (duplicate names, missing references, etc.).

2. **`parseAliasingSignatureConfig` not ported**
   TS (`ObjectShape.ts:112-234`) has a `parseAliasingSignatureConfig` function that converts config-form aliasing signatures into fully-resolved `AliasingSignature` objects with `Place` values, validating uniqueness and reference integrity. This is entirely absent from the Rust port.

3. **`add_function` and `add_hook` do not call `parseAliasingSignatureConfig`**
   `/compiler/crates/react_compiler_hir/src/object_shape.rs:126-160` and `164-196` - In TS, `addFunction` and `addHook` call `parseAliasingSignatureConfig` on the aliasing config. The Rust version stores the raw config without parsing.

4. **`ObjectShape.properties` uses `HashMap` instead of `Map`**
   `/compiler/crates/react_compiler_hir/src/object_shape.rs:100` - TS (`ObjectShape.ts:349`) uses `Map<string, BuiltInType | PolyType>`. Rust uses `HashMap<String, Type>`. `HashMap` does not preserve insertion order, but property order doesn't matter for lookup-based usage. Functionally equivalent.

5. **`ShapeRegistry` uses `HashMap` instead of `Map`**
   `/compiler/crates/react_compiler_hir/src/object_shape.rs:105` - Same consideration as above.

## Minor Issues

1. **`next_anon_id` uses `AtomicU32` instead of a simple counter**
   `/compiler/crates/react_compiler_hir/src/object_shape.rs:113-118` - TS uses a simple module-level `let nextAnonId = 0`. Rust uses `AtomicU32` for thread safety. The doc comment says "thread-local" but it's actually a static atomic, making it globally shared. This could produce different IDs across compilations compared to TS.

2. **`FunctionSignatureBuilder` and `HookSignatureBuilder` are Rust-specific**
   `/compiler/crates/react_compiler_hir/src/object_shape.rs:233-296` - These builder structs are not present in TS. They serve the same role as the inline object literals used in TS function calls. Expected Rust pattern.

3. **`HookSignatureBuilder` default `return_value_kind` is `ValueKind::Frozen`**
   `/compiler/crates/react_compiler_hir/src/object_shape.rs:287` - This matches the TS convention for hooks where return values are typically frozen.

4. **`FunctionSignature.return_value_reason` field**
   `/compiler/crates/react_compiler_hir/src/object_shape.rs:83` - TS (`ObjectShape.ts:308`) has `returnValueReason?: ValueReason`. The Rust version uses `Option<ValueReason>`. Semantically equivalent.

5. **Shape ID constants use `&str` instead of `string`**
   `/compiler/crates/react_compiler_hir/src/object_shape.rs:21-51` - Expected Rust pattern.

## Architectural Differences

1. **`Type` enum used instead of TS union types**
   `/compiler/crates/react_compiler_hir/src/object_shape.rs:81` - `FunctionSignature.return_type` is `Type` (from lib.rs) instead of `BuiltInType | PolyType`. Expected since Rust uses a single `Type` enum.

2. **Builder pattern for function/hook signatures**
   Builder structs (`FunctionSignatureBuilder`, `HookSignatureBuilder`) replace TS's inline object literal arguments. Expected Rust pattern to handle many parameters.

## Missing TypeScript Features

1. **`parseAliasingSignatureConfig` function** - Converts config-form to resolved aliasing signatures with Place values.
2. **`signatureArgument` helper** - Used within `parseAliasingSignatureConfig` to create synthetic Place values.
3. **Duplicate shape ID invariant check** in `addShape`.
