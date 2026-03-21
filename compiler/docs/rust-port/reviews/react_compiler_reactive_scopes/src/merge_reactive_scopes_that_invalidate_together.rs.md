# Review: merge_reactive_scopes_that_invalidate_together.rs

## Corresponding TypeScript Source
`compiler/packages/babel-plugin-react-compiler/src/ReactiveScopes/MergeReactiveScopesThatInvalidateTogether.ts`

## Summary
The Rust port implements the core algorithm for merging reactive scopes that invalidate together. The implementation correctly translates the visitor pattern and merging logic but has several behavioral differences related to dependency comparison, scope merging mechanics, and nested scope flattening.

## Issues

### Major Issues

1. **File:** `merge_reactive_scopes_that_invalidate_together.rs:279-286`
   **Description:** Nested scope flattening logic is implemented but missing in the original scope traversal approach. The TS version flattens nested scopes by returning `{kind: 'replace-many', value: scopeBlock.instructions}` in `transformScope`, which is called during the visitor pattern. The Rust version tries to flatten inline during `visit_block_for_merge` by splicing instructions.
   **TS vs Rust:** TS uses `transformScope` with a return value that signals replacement, allowing the visitor framework to handle the splicing. Rust manually splices in-place using `block.splice(i..=i, instructions)`.
   **Impact:** The mechanisms are different but should be functionally equivalent IF the Rust logic correctly maintains the same loop index behavior. However, the comment "Don't increment i — we need to re-examine the replaced items" (line 285) suggests the need to revisit items, which may differ from TS behavior.

2. **File:** `merge_reactive_scopes_that_invalidate_together.rs:753-772`
   **Description:** `are_equal_dependencies` comparison uses `Vec` iteration instead of `Set` iteration like TS.
   **TS vs Rust:** TS line 525-547 iterates `Set<ReactiveScopeDependency>`, Rust line 753-772 iterates `&[ReactiveScopeDependency]` (slice).
   **Impact:** Functional equivalence depends on whether dependencies can have duplicates. If they can't, this is fine. If they can, Rust may incorrectly report equality when one set has duplicates and another doesn't.

3. **File:** `merge_reactive_scopes_that_invalidate_together.rs:689-703`
   **Description:** The synthetic dependency creation logic differs structurally from TS.
   **TS vs Rust:** TS line 467-476 creates synthetic dependencies using `new Set([...current.scope.declarations.values()].map(...))`, then passes to `areEqualDependencies` which expects `Set<ReactiveScopeDependency>`. Rust line 690-699 creates `Vec<ReactiveScopeDependency>` and passes to `are_equal_dependencies` which expects slices.
   **Impact:** If the TS `Set` contains duplicates (shouldn't happen for declarations.values()), this is equivalent. Otherwise, minor structural difference without semantic impact.

4. **File:** `merge_reactive_scopes_that_invalidate_together.rs:707-726`
   **Description:** Complex dependency check logic may behave differently due to iteration order.
   **TS vs Rust:** TS line 478-490 uses `[...next.scope.dependencies].every(...)` with `Iterable_some(current.scope.declarations.values(), ...)`. Rust uses standard iteration over Vec/slice.
   **Impact:** Behavior should be equivalent if declaration iteration order doesn't matter. The TS code doesn't rely on ordering for correctness.

### Moderate Issues

5. **File:** `merge_reactive_scopes_that_invalidate_together.rs:442-457`
   **Description:** Declaration merging uses manual find-or-insert logic.
   **TS vs Rust:** TS line 292-293 uses `current.block.scope.declarations.set(key, value)` which automatically overwrites. Rust manually searches for existing entries and either updates or pushes new ones.
   **Impact:** Functionally equivalent but more verbose. The search is O(n) per declaration, whereas Map.set is O(1). Performance degradation for scopes with many declarations.

6. **File:** `merge_reactive_scopes_that_invalidate_together.rs:523-558`
   **Description:** Pass 3 (apply merges) clones all statements instead of moving them.
   **TS vs Rust:** TS line 368-397 uses `block.slice(index, entry.from)` and direct array indexing without cloning. Rust line 523 does `all_stmts[index].clone()` for every statement.
   **Impact:** Unnecessary cloning increases memory usage and runtime cost. The `std::mem::take(block)` on line 518 already moves ownership, so cloning shouldn't be necessary.

7. **File:** `merge_reactive_scopes_that_invalidate_together.rs:544-546`
   **Description:** Merged scope ID tracking uses `env.scopes[merged_scope.scope].merged.push(inner_scope.scope)`.
   **TS vs Rust:** TS line 387 uses `mergedScope.scope.merged.add(instr.scope.id)` with a Set. Rust uses a Vec and `push`.
   **Impact:** If a scope can be merged multiple times (shouldn't happen), Rust would create duplicates while TS wouldn't. Minor difference in data structure choice.

8. **File:** `merge_reactive_scopes_that_invalidate_together.rs:534-536`
   **Description:** Index bounds check uses `entry.to.saturating_sub(1)`.
   **TS vs Rust:** TS line 383 uses `index < entry.to` without saturating arithmetic.
   **Impact:** The `saturating_sub(1)` suggests defensive programming but may mask bugs. If `entry.to` is 0, `saturating_sub(1)` would return 0, and the loop would process index 0. This is different from TS which would skip the loop entirely.

### Minor/Stylistic Issues

9. **File:** `merge_reactive_scopes_that_invalidate_together.rs:527-532`
   **Description:** Panic message differs from TS invariant message.
   **TS vs Rust:** TS line 376-379 uses `CompilerError.invariant(mergedScope.kind === 'scope', ...)`. Rust uses `panic!("MergeConsecutiveScopes: Expected scope at starting index")`.
   **Impact:** Error messages should be consistent for debugging. The TS version includes location info, Rust doesn't.

10. **File:** `merge_reactive_scopes_that_invalidate_together.rs:358-367`
    **Description:** Nested `matches!` check is redundant inside an `if matches!` block.
    **TS vs Rust:** The pattern `if matches!(iv, InstructionValue::LoadLocal { place, .. }) { if let InstructionValue::LoadLocal { place, .. } = iv { ... } }` (lines 358-366) is awkward.
    **Impact:** Stylistic only. Could be simplified to a single `if let`.

11. **File:** Throughout
    **Description:** No logging/debug output equivalent to TS `log()` function.
    **TS vs Rust:** TS lines 95-99 define `DEBUG` flag and `log()` function used throughout. Rust has no equivalent.
    **Impact:** Debugging is harder without the trace output. Minor developer experience issue.

12. **File:** `merge_reactive_scopes_that_invalidate_together.rs:732-750`
    **Description:** `is_always_invalidating_type` uses string comparison for built-in IDs.
    **TS vs Rust:** TS line 505-523 uses direct equality with imported constants. Rust line 732-750 uses `id.as_str()` with string literals.
    **Impact:** Functionally equivalent if the constants match the strings. String comparison is slightly less efficient.

## Architectural Differences

1. **Visitor pattern replacement:** TS uses `ReactiveFunctionTransform` with `transformScope` and `visitBlock` methods that return transformation instructions. Rust uses imperative inline transformation during a single traversal. The TS approach separates visiting from transformation, while Rust combines them.

2. **Arena-based access:** Rust accesses scopes via `env.scopes[scope_id.0 as usize]` throughout, while TS accesses via object references. This is consistent with the Rust port architecture.

3. **Temporary tracking:** Both use a `HashMap<DeclarationId, DeclarationId>` for temporaries. Rust stores `DeclarationId` directly, TS stores `DeclarationId` values. Equivalent.

4. **Merged scope tracking:** TS uses `Set<ScopeId>` for `scope.merged`, Rust uses `Vec<ScopeId>`. Different data structure but both track which scopes were merged.

## Completeness

1. **Missing recursive function handling:** The TS version at line 84-86 recursively visits `FunctionExpression` and `ObjectMethod` by calling `this.visitHirFunction(value.loweredFunc.func, state)`. The Rust version doesn't appear to have this recursive descent into nested functions. This could cause nested functions' scopes to not be merged correctly.

2. **Missing dependency list structure:** The Rust version represents dependencies as `Vec<ReactiveScopeDependency>` in the scope arena, but the comparison logic expects slices. The TS version uses `Set<ReactiveScopeDependency>`. This structural difference is addressed in Issue #2 above but worth highlighting as a completeness concern.

3. **Pass ordering:** The Rust version comments (lines 36-37) mention "Pass 2+3" combined, while TS clearly separates Pass 2 (identify scopes) and Pass 3 (apply merges). The Rust combines them in `visit_block_for_merge` but the logic flow is harder to trace than the separate TS passes.

4. **Missing return value propagation:** TS `transformScope` returns `Transformed<ReactiveStatement>` which can be `{kind: 'keep'}` or `{kind: 'replace-many', ...}`. Rust flattens inline without a return value mechanism. This makes it harder to track what transformations occurred.
