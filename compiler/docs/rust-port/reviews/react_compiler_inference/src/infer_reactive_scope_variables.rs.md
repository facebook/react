# Review: react_compiler_inference/src/infer_reactive_scope_variables.rs

## Corresponding TypeScript source
- `compiler/packages/babel-plugin-react-compiler/src/ReactiveScopes/InferReactiveScopeVariables.ts`

## Summary
The Rust port is structurally accurate with all core logic preserved. DisjointSet implementation and scope assignment logic match the TypeScript version. Minor differences exist in location merging logic.

## Major Issues
None.

## Moderate Issues

### 1. Location merging uses GeneratedSource check instead of None
**Location:** `infer_reactive_scope_variables.rs:208-228`
**TypeScript:** `InferReactiveScopeVariables.ts:174-195`
**Issue:** The TypeScript version checks `if (l === GeneratedSource)` and `if (r === GeneratedSource)` to handle missing locations, while the Rust version uses `match (l, r)` with `None` patterns. The Rust version should check if the location equals a generated/placeholder value rather than just None, to match TS semantics. However, this may be correct if Rust uses `None` where TS uses `GeneratedSource`.

### 2. Missing logger debug call on validation error
**Location:** `infer_reactive_scope_variables.rs:191-200`
**TypeScript:** `InferReactiveScopeVariables.ts:157-169`
**Issue:** The TypeScript version calls `fn.env.logger?.debugLogIRs?.(...)` before throwing the error (lines 158-162) to aid debugging. The Rust version panics immediately without logging. This could make debugging harder.

## Minor Issues

### 1. Index field missing from mergeLocation
**Location:** `infer_reactive_scope_variables.rs:217-227`
**TypeScript:** `InferReactiveScopeVariables.ts:180-193`
**Issue:** The TypeScript `SourceLocation` has an `index` field (line 182, 186) that is merged. The Rust `SourceLocation` appears to only have `line` and `column` fields in `Position`. This may be an architectural difference in how locations are represented, but should be verified.

### 3. Additional range validation check
**Location:** `infer_reactive_scope_variables.rs:165-173`
**Addition:** The Rust version has an additional loop after scope assignment (lines 165-173) that updates each identifier's `mutable_range` to match its scope's range. This is not present in TypeScript where `identifier.mutableRange = scope.range` on line 132 directly shares the reference. This is required in Rust since ranges are cloned, not shared.

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

## Missing from Rust Port

### 1. Additional ReactiveScope fields
**TypeScript:** `InferReactiveScopeVariables.ts:106-116`
**Issue:** The TypeScript `ReactiveScope` includes these fields initialized when creating a scope:
- `dependencies: new Set()`
- `declarations: new Map()`
- `reassignments: new Set()`
- `earlyReturnValue: null`
- `merged: new Set()`

The Rust version may initialize these elsewhere or they may be part of the `ReactiveScope` type definition. Should verify these are initialized properly in the Rust `ReactiveScope` struct.

## Additional in Rust Port

### 1. Public exports of helper functions
**Location:** `infer_reactive_scope_variables.rs:236-244, 578`
**Addition:** The Rust version exports `is_mutable` and `find_disjoint_mutable_values` as `pub(crate)` (module-visible). TypeScript exports these as named exports. The Rust visibility is appropriate for cross-module use within the crate.

### 2. Explicit validation loop with max_instruction calculation
**Location:** `infer_reactive_scope_variables.rs:176-200`
**TypeScript:** `InferReactiveScopeVariables.ts:135-171`
**Difference:** Both versions have this logic, but the Rust version has slightly different structure with explicit max_instruction calculation in a separate loop before validation.

### 3. `each_pattern_operand` and `each_instruction_value_operand` helpers
**Location:** `infer_reactive_scope_variables.rs:331-569`
**Addition:** These are implemented inline in the Rust module. In TypeScript they are imported from `../HIR/visitors` (line 24-25). The Rust implementation should verify it matches the visitor implementations.
