# Review: compiler/crates/react_compiler_reactive_scopes/src/prune_always_invalidating_scopes.rs

## Corresponding TypeScript Source
compiler/packages/babel-plugin-react-compiler/src/ReactiveScopes/PruneAlwaysInvalidatingScopes.ts

## Summary
The Rust port correctly implements the core logic for detecting and pruning scopes that depend on always-invalidating values. The implementation is clean and follows the architecture well.

## Issues

### Major Issues

1. **IdentifierId vs Identifier type mismatch** (prune_always_invalidating_scopes.rs:41-42)
   - **Description**: The Rust version uses `HashSet<IdentifierId>` for tracking always-invalidating and unmemoized values.
   - **TS behavior**: Lines 32-33 use `Set<Identifier>` which stores the full Identifier object.
   - **Rust behavior**: Lines 41-42 store only `IdentifierId`.
   - **Impact**: This is actually correct for Rust (following arena architecture), but it's a semantic difference. The Rust version tracks identifier IDs, while TS tracks identifier objects. Since identifiers are in an arena and referenced by ID, this should be functionally equivalent, but it's worth noting the divergence.

2. **Instruction lvalue handling** (prune_always_invalidating_scopes.rs:64-69, 86-94)
   - **Description**: The Rust version checks `if let Some(lv) = lvalue` and then uses `lv.identifier` directly.
   - **TS behavior**: Lines 48-53, 67-77 check `if (lvalue !== null)` then use `lvalue.identifier`.
   - **Rust behavior**: Pattern matches on `Option<Place>` to extract the identifier.
   - **Impact**: Different null handling mechanism, but semantically equivalent. In Rust, `lvalue` is `Option<Place>` while in TS it's `Place | null`.

### Moderate Issues

3. **Missing mem::take documentation** (prune_always_invalidating_scopes.rs:136)
   - **Description**: Uses `std::mem::take(&mut scope.instructions)` to extract instructions.
   - **TS behavior**: Line 110 directly assigns `scopeBlock.instructions` to the pruned scope.
   - **Rust behavior**: Line 136 uses `mem::take` to move instructions out.
   - **Impact**: This is correct Rust (can't move out of borrowed struct), but worth documenting why `mem::take` is needed.

4. **Declaration and reassignment ID collection** (prune_always_invalidating_scopes.rs:115-120)
   - **Description**: Collects declaration and reassignment IDs into Vecs before iterating.
   - **TS behavior**: Lines 96-105 use direct iteration with `for...of` on `Map.values()` and `Set`.
   - **Rust behavior**: Lines 115-120 collect into intermediate Vecs.
   - **Impact**: Extra allocation. Could potentially iterate directly if the borrow checker permits, or restructure.

### Minor/Stylistic Issues

5. **Comment about function calls missing** (prune_always_invalidating_scopes.rs:6-12)
   - **Description**: The module doc comment summarizes the pass but doesn't include the important NOTE about function calls from the TS version.
   - **TS behavior**: Lines 17-26 include a critical note explaining why function calls are NOT treated as always-invalidating.
   - **Rust behavior**: Lines 6-12 have a brief summary without the NOTE.
   - **Impact**: Missing documentation of important design decision. Future maintainers won't understand why functions aren't included.

6. **Transform struct naming** (prune_always_invalidating_scopes.rs:39-43)
   - **Description**: The struct is named `Transform` which is generic.
   - **Suggestion**: More descriptive name like `PruneTransform` or `AlwaysInvalidatingTransform`.

7. **State type too simple** (prune_always_invalidating_scopes.rs:46)
   - **Description**: Uses `bool` as the state type with a comment `// withinScope`.
   - **TS behavior**: Line 31 uses explicit type name `boolean`.
   - **Rust behavior**: Line 46 uses `bool` with comment.
   - **Impact**: Consider a newtype or enum for clarity: `enum ScopeDepth { Outside, Inside }` or similar.

8. **Verbose qualified path** (prune_always_invalidating_scopes.rs:16, 18)
   - **Description**: Imports don't include `PrunedReactiveScopeBlock` at top level, requiring it in the match.
   - **Impact**: None, just a style choice.

## Architectural Differences

1. **Identifier storage**: Rust stores `IdentifierId` in sets while TS stores full `Identifier` objects. This follows the arena architecture correctly but is a semantic difference.

2. **Boolean state parameter**: Both versions use a simple boolean for `withinScope` state, which is appropriate for this simple pass.

3. **Instruction ownership**: The Rust version uses `mem::take` to move instructions when creating pruned scopes, which is necessary due to Rust's ownership model.

## Completeness

**Implemented**:
- ✅ Tracking always-invalidating values (ArrayExpression, ObjectExpression, JsxExpression, JsxFragment, NewExpression)
- ✅ Tracking unmemoized always-invalidating values (those outside scopes)
- ✅ Propagating always-invalidating status through StoreLocal
- ✅ Propagating always-invalidating status through LoadLocal
- ✅ Detecting scopes that depend on unmemoized always-invalidating values
- ✅ Pruning such scopes by converting to PrunedScope
- ✅ Propagating unmemoized status to declarations and reassignments in pruned scopes
- ✅ Distinguishing within-scope vs outside-scope context

**Missing or different**:
- ⚠️ Missing documentation about why function calls aren't treated as always-invalidating
- ⚠️ Uses IdentifierId instead of full Identifier (correct per architecture, but different from TS)
- ⚠️ Extra Vec allocations for iteration (could be optimized)
