# Review: compiler/crates/react_compiler_reactive_scopes/src/prune_unused_scopes.rs

## Corresponding TypeScript Source
compiler/packages/babel-plugin-react-compiler/src/ReactiveScopes/PruneUnusedScopes.ts

## Summary
The Rust port correctly implements the logic for pruning scopes without outputs. The implementation is clean and straightforward with minimal issues.

## Issues

### Major Issues

None identified. The implementation correctly follows the TypeScript logic.

### Moderate Issues

1. **Scope ID comparison** (prune_unused_scopes.rs:91)
   - **Description**: Compares `decl.scope == scope_id` where both are `ScopeId`.
   - **TS behavior**: Line 74 compares `declaration.scope.id === block.scope.id` where both are extracted IDs.
   - **Rust behavior**: Line 91 directly compares the `ScopeId` values.
   - **Impact**: This is correct and actually cleaner than the TS version. No issue, just noting the difference in how scope identity is checked.

2. **Empty declarations check ordering** (prune_unused_scopes.rs:66-68)
   - **Description**: The condition checks `scope_data.declarations.is_empty()` first, then `!has_own_declaration(...)`.
   - **TS behavior**: Lines 46-52 checks `scopeBlock.scope.declarations.size === 0` before calling `hasOwnDeclaration`.
   - **Rust behavior**: Lines 66-68 perform the same logic with parentheses grouping.
   - **Impact**: The short-circuit logic is preserved correctly - if declarations is empty, `has_own_declaration` won't be called.

### Minor/Stylistic Issues

3. **Module documentation** (prune_unused_scopes.rs:6-8)
   - **Description**: Brief module doc lacks detail about what "outputs" means.
   - **TS behavior**: Line 20 has a brief comment "Converts scopes without outputs into regular blocks."
   - **Rust behavior**: Line 6 has the same brief comment.
   - **Impact**: Both versions could benefit from more detailed documentation about what constitutes a scope with outputs (has reassignments, has own declarations, or has return statement).

4. **State struct field naming** (prune_unused_scopes.rs:21)
   - **Description**: Uses `has_return_statement` (snake_case) for the field name.
   - **TS behavior**: Line 28 uses `hasReturnStatement` (camelCase).
   - **Rust behavior**: Line 21 uses `has_return_statement`.
   - **Impact**: Correct Rust naming convention, just noting the conversion from camelCase.

5. **Lifetime parameter unnecessary on Transform** (prune_unused_scopes.rs:34-36)
   - **Description**: The `Transform` struct has a lifetime `'a` for the `env` reference.
   - **Impact**: This is correct Rust, but worth noting that the lifetime is needed because the transform holds a reference to the environment.

6. **Missing comment on early scope_state reset** (prune_unused_scopes.rs:57-60)
   - **Description**: Creates a new `State` for each scope without explaining why.
   - **TS behavior**: Line 42 creates a fresh `scopeState` object.
   - **Rust behavior**: Lines 57-60 create fresh state but don't explain why (to isolate return detection per scope).
   - **Impact**: Minor - a comment would help future maintainers understand the pattern.

7. **Verbose has_own_declaration signature** (prune_unused_scopes.rs:86-89)
   - **Description**: Takes both `scope_data` and `scope_id` as separate parameters.
   - **TS behavior**: Line 72 takes only the `block` and accesses `block.scope.id` internally.
   - **Rust behavior**: Lines 86-89 take both `&ReactiveScope` and `ScopeId` separately.
   - **Impact**: The Rust version separates the data from the ID, which makes sense given the arena architecture, but it's more verbose.

8. **mem::take usage** (prune_unused_scopes.rs:74)
   - **Description**: Uses `std::mem::take` to extract instructions when creating pruned scope.
   - **TS behavior**: Line 59 directly assigns `scopeBlock.instructions`.
   - **Rust behavior**: Line 74 uses `mem::take`.
   - **Impact**: Correct Rust ownership handling. Worth a comment explaining why it's needed.

## Architectural Differences

1. **Environment reference in Transform**: The Rust version stores `env: &'a Environment` in the Transform struct, while TS accesses it through various paths. This is necessary in Rust to access the arena during traversal.

2. **Fresh state per scope**: Both versions create isolated state for each scope's return detection, which is correct behavior.

3. **ScopeId comparison**: The Rust version can directly compare `ScopeId` values, while TS compares extracted ID numbers. Both are correct but Rust's approach is cleaner.

## Completeness

**Implemented**:
- ✅ Detecting return statements within scopes
- ✅ Checking if scope has reassignments
- ✅ Checking if scope has declarations
- ✅ Checking if scope has own declarations (vs. propagated from nested scopes)
- ✅ Converting scopes without outputs to pruned scopes
- ✅ Preserving scope metadata (scope ID)
- ✅ Moving instructions to pruned scope
- ✅ Isolated state per scope for return detection

**Missing or different**:
- ✅ All functionality is complete and correct
- Minor documentation gaps noted above

**Overall assessment**: This is one of the cleanest ports. The logic is straightforward and the Rust version faithfully reproduces the TypeScript behavior with appropriate adaptations for Rust's ownership model and arena architecture.
