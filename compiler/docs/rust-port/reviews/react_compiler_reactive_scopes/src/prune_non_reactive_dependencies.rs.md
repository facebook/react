# Review: compiler/crates/react_compiler_reactive_scopes/src/prune_non_reactive_dependencies.rs

## Corresponding TypeScript Source
- `compiler/packages/babel-plugin-react-compiler/src/ReactiveScopes/PruneNonReactiveDependencies.ts`
- `compiler/packages/babel-plugin-react-compiler/src/ReactiveScopes/CollectReactiveIdentifiers.ts`

## Summary
This file combines two TypeScript modules: CollectReactiveIdentifiers (which identifies reactive identifiers) and PruneNonReactiveDependencies (which removes non-reactive scope dependencies). The Rust port correctly implements both with proper separation and shared type checking logic.

## Issues

### Major Issues

1. **prune_non_reactive_dependencies.rs:72 - Direct array indexing without bounds checking**
   - **TS Behavior**: Accesses identifier through object property
   - **Rust Behavior**: Line 72-74 use `self.env.identifiers[place.identifier.0 as usize]` and `self.env.scopes[scope_id.0 as usize]`
   - **Impact**: Major - Can panic if IDs are out of bounds
   - **Fix needed**: Use safe arena access via Index trait or .get()

2. **prune_non_reactive_dependencies.rs:64 - Accesses lowered function from arena**
   - **TS Behavior**: Line 245 accesses `instr.value.loweredFunc.func` directly
   - **Rust Behavior**: Lines 63-65 use `self.env.functions[lowered_func.func.0 as usize]` with unsafe indexing
   - **Impact**: Can panic on invalid function IDs
   - **Fix needed**: Use safe arena access pattern

3. **prune_non_reactive_dependencies.rs:330 - Mutable iterator with scope mutation**
   - **TS Behavior**: Line 99-102 - directly mutates `scopeBlock.scope.dependencies` via `delete()`
   - **Rust Behavior**: Lines 333-335 use `retain()` which is correct
   - **Impact**: None - this is actually better in Rust
   - **Note**: This is a good adaptation for Rust's ownership model

### Moderate Issues

1. **prune_non_reactive_dependencies.rs:106-133 - Duplicated isStableType logic**
   - **TS Behavior**: Imports `isStableType` from `../HIR/HIR.ts`
   - **Rust Behavior**: Lines 106-133 reimplement the logic locally
   - **Impact**: Moderate - Code duplication, risk of divergence if HIR version changes
   - **Recommendation**: Import from HIR module if available, or document why duplicated

2. **prune_non_reactive_dependencies.rs:115-132 - Hard-coded shape ID comparisons**
   - **Issue**: Lines 115-132 compare against `object_shape::BUILT_IN_*_ID` constants
   - **TS Behavior**: Uses the same pattern with BuiltIn*Id constants
   - **Impact**: None - this matches TS
   - **Note**: Verify these constants are correctly defined in object_shape module

### Minor/Stylistic Issues

1. **prune_non_reactive_dependencies.rs:179 - Function signature lacks doc comment**
   - **Issue**: Public function `prune_non_reactive_dependencies` has no doc comment
   - **Recommendation**: Add doc comment explaining the pass's purpose

2. **prune_non_reactive_dependencies.rs:244-255 - PropertyLoad handling**
   - **TS Behavior**: Lines 71-78 check `isStableType(lvalue.identifier)`
   - **Rust Behavior**: Lines 256-262 get type via arena access then call `is_stable_type(ty)`
   - **Impact**: None - equivalent logic
   - **Note**: Good adaptation for Rust's type system

3. **prune_non_reactive_dependencies.rs:17 - imports is_primitive_type**
   - **Issue**: Line 17 imports `is_primitive_type` from HIR
   - **Note**: Good - reuses existing HIR function rather than duplicating

## Architectural Differences

1. **Combined module**: Rust combines CollectReactiveIdentifiers and PruneNonReactiveDependencies in one file, while TS splits them. This is fine since they're closely related.

2. **Direct recursion vs visitor pattern**: The prune pass (lines 185-447) uses direct recursion instead of the visitor pattern, which is necessary because it needs to mutate both the reactive_ids set and env.scopes simultaneously. This is a good architectural decision.

3. **Type checking pattern**: Rust accesses types via `env.types[identifier.type_.0 as usize]` while TS accesses via `identifier.type`. Both patterns work but Rust should use safe access.

4. **Mutable traversal**: The Rust version properly handles mutable traversal with `&mut` parameters, while TS can mutate in place. This is an idiomatic adaptation.

## Completeness

The implementation is complete and covers all the logic from both TypeScript files.

### Comparison Checklist

| Feature | TypeScript | Rust | Status |
|---------|-----------|------|--------|
| collectReactiveIdentifiers | ✓ | ✓ | Complete |
| Visit reactive places | ✓ | ✓ | Complete |
| Visit lvalues | ✓ | ✓ | Complete |
| Visit function context | ✓ | ✓ | Complete |
| Visit pruned scopes | ✓ | ✓ | Complete |
| isStableRefType | ✓ | ✓ | Complete |
| isStableType helpers | ✓ | ✓ | Complete (duplicated) |
| eachPatternOperand | ✓ | ✓ | Complete |
| Prune dependencies | ✓ | ✓ | Complete |
| LoadLocal propagation | ✓ | ✓ | Complete |
| StoreLocal propagation | ✓ | ✓ | Complete |
| Destructure propagation | ✓ | ✓ | Complete |
| PropertyLoad propagation | ✓ | ✓ | Complete |
| ComputedLoad propagation | ✓ | ✓ | Complete |
| Mark scope outputs reactive | ✓ | ✓ | Complete |

### Missing from TypeScript

None - the Rust version includes all functionality.

### Missing from Rust

None - all TypeScript functionality is present.

## Recommendations

1. **Critical**: Fix all unsafe array indexing patterns (`.0 as usize`) to use safe arena access
2. **Important**: Add doc comments to public functions
3. **Consider**: Extract isStableType helpers to shared HIR module to avoid duplication
4. **Verify**: Check that object_shape constants match between TS and Rust
5. **Testing**: Add tests for edge cases like empty scopes, nested destructuring, stable types
