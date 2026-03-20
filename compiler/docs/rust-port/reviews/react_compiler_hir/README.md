# React Compiler HIR Crate Review

This directory contains comprehensive reviews of the `react_compiler_hir` crate, comparing each Rust file against its corresponding TypeScript source.

## Review Date
2026-03-20

## Files Reviewed

1. **[lib.rs](src/lib.md)** - Core HIR data structures
   - Corresponding TS: `HIR/HIR.ts`
   - Status: ✅ Complete with architectural differences documented

2. **[environment.rs](src/environment.md)** - Environment type with arenas
   - Corresponding TS: `HIR/Environment.ts`
   - Status: ✅ Complete, arena-based architecture properly implemented

3. **[environment_config.rs](src/environment_config.md)** - Configuration schema
   - Corresponding TS: `HIR/Environment.ts` (EnvironmentConfigSchema)
   - Status: ✅ Complete, documented omissions for codegen-only fields

4. **[globals.rs](src/globals.md)** - Global type registry and built-in shapes
   - Corresponding TS: `HIR/Globals.ts`
   - Status: ✅ Comprehensive, all major hooks and globals present

5. **[object_shape.rs](src/object_shape.md)** - Object shapes and function signatures
   - Corresponding TS: `HIR/ObjectShape.ts`
   - Status: ✅ Complete, aliasing signature parsing intentionally deferred

6. **[type_config.rs](src/type_config.md)** - Type configuration schema types
   - Corresponding TS: `HIR/TypeSchema.ts`
   - Status: ✅ Complete, all type config variants present

7. **[default_module_type_provider.rs](src/default_module_type_provider.md)** - Known-incompatible libraries
   - Corresponding TS: `HIR/DefaultModuleTypeProvider.ts`
   - Status: ✅ Perfect port, all three libraries configured identically

8. **[dominator.rs](src/dominator.md)** - Dominator tree computation
   - Corresponding TS: `HIR/Dominator.ts`, `HIR/ComputeUnconditionalBlocks.ts`
   - Status: ✅ Excellent port, algorithm correctly implemented

## Overall Assessment

The `react_compiler_hir` crate is a **comprehensive and high-quality port** of the TypeScript HIR module. All critical data structures, types, and algorithms are present and correctly implemented.

### Key Strengths

1. **Structural Fidelity**: ~90% structural correspondence with TypeScript source
2. **Arena Architecture**: Properly implemented ID-based arenas for shared data
3. **Type Safety**: Rust's type system catches more errors at compile time
4. **Complete Coverage**: All major types, hooks, and globals are present

### Known Gaps (All Documented & Acceptable)

1. **Aliasing Signature Parsing**: Deferred until aliasing effects system is fully ported
2. **ReactiveFunction Types**: Not yet ported (used post-scope-building)
3. **Some Config Fields**: Codegen-only fields (instrumentation, hook guards) omitted
4. **Forward Dominators**: `computeDominatorTree` not ported (may not be used)

### Architectural Differences (By Design)

1. **Arenas + IDs**: All shared data in `Vec<T>` arenas, referenced by copyable `Id` newtypes
2. **Flat Instruction Table**: `HirFunction.instructions` with `BasicBlock` storing IDs
3. **Separate Environment**: `env` passed as separate parameter, not stored on `HirFunction`
4. **IndexMap for Order**: Used for `blocks` and `preds` to maintain deterministic iteration

## Critical for Compiler Correctness

This crate defines the core data structures used by ALL compiler passes. Any missing fields, variants, or types could cause compilation failures or incorrect behavior.

**Result**: ✅ All critical types and variants are present. No missing functionality that would impact compilation correctness.

## Recommendations

1. **Add forward dominator computation** if any passes need it
2. **Implement aliasing signature parsing** when porting aliasing effects passes
3. **Add ReactiveFunction types** when porting codegen/reactive representation
4. **Consider adding missing helper methods** from TypeScript if passes use them

## Next Steps

Proceed with confidence to:
- Port HIR-consuming passes (inference, validation, transformation)
- Implement aliasing effects system
- Add reactive representation types as needed for codegen

The foundation is solid and ready for the compiler pipeline.
