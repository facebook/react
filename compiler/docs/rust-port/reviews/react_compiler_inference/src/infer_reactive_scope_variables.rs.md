# Review: compiler/crates/react_compiler_inference/src/infer_reactive_scope_variables.rs

## Corresponding TypeScript Source
- `compiler/packages/babel-plugin-react-compiler/src/ReactiveScopes/InferReactiveScopeVariables.ts`

## Summary
This pass (713 lines Rust vs ~620 lines TS) determines which mutable variables belong to which reactive scopes by finding disjoint sets of co-mutating identifiers. The Rust port accurately implements the DisjointSet data structure, scope assignment logic, and mutable range validation. The additional lines are from helper functions for pattern/operand iteration that are imported from visitors in TypeScript.

## Issues

### Major Issues
None found.

### Moderate Issues

1. **compiler/crates/react_compiler_inference/src/infer_reactive_scope_variables.rs:192-200** - Missing debug logger call before panic
   - **TS behavior**: TypeScript calls `fn.env.logger?.debugLogIRs?.(...)` (TS:158-162) before throwing the invariant error to aid debugging.
   - **Rust behavior**: Rust panics immediately without debug logging (line 192).
   - **Impact**: Makes debugging scope validation errors harder. The Rust version should ideally log the HIR state before panicking, though this requires access to a logger which may not be available in the current architecture.

### Minor/Stylistic Issues

1. **compiler/crates/react_compiler_inference/src/infer_reactive_scope_variables.rs:208-228** - Location merging logic
   - The Rust `merge_location()` function handles `None` locations (lines 208-228).
   - TypeScript checks `if (l === GeneratedSource)` and `if (r === GeneratedSource)` (TS:175-177).
   - **Impact**: This is an architectural difference. If Rust uses `Option<SourceLocation>` where TS uses `GeneratedSource` as a sentinel value, the logic is equivalent. The Rust version also handles `index` field merging (lines 213, 222), matching TS (line 182, 186).

## Architectural Differences

### 1. DisjointSet uses IdentifierId instead of Identifier references
**Location:** `infer_reactive_scope_variables.rs:36-101`
**TypeScript:** Uses `DisjointSet<Identifier>` (line 275)
**Reason:** Rust uses copyable `IdentifierId` keys instead of reference identity. The Rust version stores `IndexMap<IdentifierId, IdentifierId>` while TypeScript stores `Map<Identifier, Identifier>`.

### 2. Scope assignment via arena mutation
**Location:** `infer_reactive_scope_variables.rs:119-161`
**TypeScript:** `InferReactiveScopeVariables.ts:94-133`
**Reason:** Rust accesses scopes via arena: `env.scopes[scope_id.0 as usize]` and `env.identifiers[identifier_id.0 as usize]`. TypeScript directly mutates: `identifier.scope = scope` and `scope.range.start = ...`.

### 3. Separate loop to update identifier ranges
**Location:** `infer_reactive_scope_variables.rs:165-173`
**Reason:** In TypeScript, `identifier.mutableRange = scope.range` shares the reference (line 132). In Rust, ranges are cloned (line 122, 129), so a separate loop (lines 165-173) ensures all identifiers in a scope have the same range value. This is a necessary consequence of value semantics vs reference semantics.

### 4. ScopeState helper struct
**Location:** `infer_reactive_scope_variables.rs:203-206`
**Addition:** Rust uses a `ScopeState` struct to track `scope_id` and `loc` during iteration. TypeScript directly manipulates the `ReactiveScope` object.

## Completeness

The Rust port is functionally complete. All major components are present:

✅ **DisjointSet implementation**: Complete union-find data structure (lines 36-101)
  - `new()`, `find()`, `find_opt()`, `union()`, `for_each()`
  - Uses `IndexMap` to preserve insertion order matching TS Map behavior
  - Path compression in `find()` method
✅ **Entry point**: `infer_reactive_scope_variables()` function (lines 113-200)
✅ **Scope assignment logic**: Two-phase algorithm (lines 119-161)
  - Phase 1: Find disjoint sets via `find_disjoint_mutable_values()` (line 115)
  - Phase 2: Assign scope IDs and merge ranges (lines 121-161)
✅ **Range synchronization**: Additional loop to ensure all identifiers in a scope have matching ranges (lines 165-173)
  - Required in Rust since ranges are cloned, not shared references
✅ **Scope validation**: Validates mutable ranges are within valid instruction bounds (lines 176-200)
✅ **Location merging**: `merge_location()` function (lines 208-228)
  - Handles None locations
  - Merges start/end positions taking min/max
  - Preserves filename and identifierName
  - Merges index field
✅ **Helper functions** (lines 236-713):
  - `is_mutable()` - exported as `pub` (line 236)
  - `find_disjoint_mutable_values()` - exported as `pub(crate)` (line 244)
  - `each_pattern_operand()` - inline implementation (lines 331-443)
  - `each_instruction_value_operand()` - inline implementation (lines 445-onwards)
  - Various pattern/array/object iteration helpers

**ReactiveScope field initialization**: The TypeScript version initializes additional fields when creating a scope (TS:106-116): `dependencies`, `declarations`, `reassignments`, `earlyReturnValue`, `merged`. In Rust, these fields are part of the `ReactiveScope` type definition in the HIR crate and are initialized when `env.next_scope_id()` creates a new scope (line 127). This is an architectural difference - the Rust version separates scope creation from scope assignment.

No missing functionality detected.
