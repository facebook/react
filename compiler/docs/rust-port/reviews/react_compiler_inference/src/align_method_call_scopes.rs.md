# Review: react_compiler_inference/src/align_method_call_scopes.rs

## Corresponding TypeScript source
- `compiler/packages/babel-plugin-react-compiler/src/ReactiveScopes/AlignMethodCallScopes.ts`

## Summary
The Rust port is structurally accurate and correctly implements the alignment of method call scopes. All logic matches the TypeScript source.

## Major Issues
None.

## Moderate Issues
None.

## Minor Issues

### 1. DisjointSet canonicalize() vs for_each() pattern difference
**Location:** `align_method_call_scopes.rs:63-73`

**Issue:** The Rust implementation uses `for_each()` directly on the DisjointSet, while TypeScript calls `.canonicalize()` first (line 55 in TS), then iterates. Both are correct, but the TS version pre-canonicalizes all entries which might be slightly more efficient for large sets.

**TypeScript (line 55-65):**
```typescript
mergedScopes.forEach((scope, root) => {
  if (scope === root) {
    return;
  }
  root.range.start = makeInstructionId(
    Math.min(scope.range.start, root.range.start),
  );
  root.range.end = makeInstructionId(
    Math.max(scope.range.end, root.range.end),
  );
});
```

**Rust (line 140-156):**
```rust
merged_scopes.for_each(|scope_id, root_id| {
    if scope_id == root_id {
        return;
    }
    let scope_range = env.scopes[scope_id.0 as usize].range.clone();
    let root_range = env.scopes[root_id.0 as usize].range.clone();

    let new_start = EvaluationOrder(cmp::min(scope_range.start.0, root_range.start.0));
    let new_end = EvaluationOrder(cmp::max(scope_range.end.0, root_range.end.0));

    range_updates.push((root_id, new_start, new_end));
});
```

The Rust version calls `find()` within `for_each()` which does path compression on-the-fly, achieving the same effect.

### 2. Two-phase update pattern
**Location:** `align_method_call_scopes.rs:138-156`

**Issue:** Rust uses a two-phase approach (collect updates into `range_updates`, then apply), while TypeScript mutates ranges in-place during the forEach. This is an architectural difference due to Rust's borrow checker, not a bug.

### 3. Recursion happens before main logic
**Location:** `align_method_call_scopes.rs:120-130`

**Issue:** The Rust port processes recursion inline during phase 1, while TypeScript handles it in a separate loop (lines 46-51) before processing scopes. Both approaches are equivalent since inner functions have disjoint scopes from the outer function.

## Architectural Differences

### 1. Scope storage
- **TypeScript:** `DisjointSet<ReactiveScope>` stores actual scope objects
- **Rust:** `DisjointSet<ScopeId>` stores scope IDs, accesses scopes via `env.scopes[scope_id]`

### 2. Identifier scope assignment
- **TypeScript:** Direct mutation `instr.lvalue.identifier.scope = mappedScope` (line 70)
- **Rust:** Arena-based mutation `env.identifiers[lvalue_id.0 as usize].scope = *mapped_scope` (line 164)

### 3. Range updates
- **TypeScript:** In-place mutation of shared `range` object (lines 59-64)
- **Rust:** Two-phase collect/apply to work around borrow checker (lines 138-156)

## Missing from Rust Port
None.

## Additional in Rust Port
None.
