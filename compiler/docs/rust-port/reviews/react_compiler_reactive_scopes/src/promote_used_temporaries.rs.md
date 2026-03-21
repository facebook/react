# Review: promote_used_temporaries.rs

## Corresponding TypeScript Source
`compiler/packages/babel-plugin-react-compiler/src/ReactiveScopes/PromoteUsedTemporaries.ts`

## Summary
The Rust port implements all four phases of temporary promotion with high structural correspondence to the TypeScript version. The implementation correctly handles JSX tag detection, pruned scope tracking, interposed temporary promotion, and final instance promotion. Minor differences exist in visitor pattern implementation and recursion handling.

## Issues

### Major Issues

1. **File:** `promote_used_temporaries.rs:320-342`
   **Description:** Phase 2 doesn't recursively visit nested functions in the same way as TS.
   **TS vs Rust:** TS line 84-86 calls `this.visitHirFunction(value.loweredFunc.func, state)` for FunctionExpression/ObjectMethod. Rust lines 322-342 only promotes the function's parameters but doesn't recursively visit the function body.
   **Impact:** Temporaries used in scopes within nested functions may not be promoted correctly. This breaks the algorithm for nested function expressions.

2. **File:** `promote_used_temporaries.rs:849-869`
   **Description:** Phase 4 has the same recursion issue - visits function parameters but not bodies.
   **TS vs Rust:** TS line 162-168 calls `visitReactiveFunction(fn, this, state)` to recursively process nested functions. Rust only processes parameters.
   **Impact:** Same as Issue #1 - incomplete promotion in nested functions. This is a significant behavioral difference.

3. **File:** `promote_used_temporaries.rs:288-304`
   **Description:** PrunedScope declaration collection pattern differs from TS and may have borrow checker issues.
   **TS vs Rust:** TS line 56-68 directly accesses `scopeBlock.scope.declarations` during iteration. Rust line 289-304 first collects declaration IDs into a Vec, then iterates that Vec separately.
   **Impact:** The collect-then-iterate pattern works around Rust borrow checker but adds overhead. Functionally equivalent if all declarations are captured, but the extra allocation and copy is unnecessary.

4. **File:** `promote_used_temporaries.rs:273-284`
   **Description:** Scope dependency and declaration promotion collects IDs first, then promotes.
   **TS vs Rust:** TS line 34-52 directly iterates and promotes in a single pass. Rust collects all IDs into `ids_to_check`, then iterates again to promote.
   **Impact:** Two-phase approach prevents borrowing issues but requires extra allocations. Minor performance overhead. Functionally equivalent.

### Moderate Issues

5. **File:** `promote_used_temporaries.rs:474-478`
   **Description:** Missing assertion on instruction value lvalues.
   **TS vs Rust:** TS line 289-294 asserts that assignment targets (from `eachInstructionValueLValue`) are named. Rust has a comment (line 477-478) saying "the TS pass asserts this but we just skip in Rust".
   **Impact:** Skipping this assertion could hide bugs. The TS invariant ensures structural correctness that Rust silently ignores.

6. **File:** `promote_used_temporaries.rs:164`
   **Description:** JSX tag detection pattern differs slightly.
   **TS vs Rust:** TS line 207-209 checks `value.tag.kind === 'Identifier'`, then uses `value.tag.identifier.declarationId`. Rust uses `if let InstructionValue::JsxExpression { tag: JsxTag::Place(place), .. }`.
   **Impact:** Rust pattern assumes JSX tags are `JsxTag::Place`, while TS checks for `tag.kind === 'Identifier'`. These may not be equivalent if JSX tags can be other types. Need to verify HIR type definitions match.

7. **File:** `promote_used_temporaries.rs:512-515`
   **Description:** Pattern operand iteration in Destructure handling uses local helper instead of imported visitor.
   **TS vs Rust:** TS line 331-333 uses `eachPatternOperand(instruction.value.lvalue.pattern)` from HIR visitors. Rust defines its own `each_pattern_operand` at line 985-1015.
   **Impact:** Code duplication. If the visitor version changes, this local copy won't track it. Should use the visitor from HIR crate if available.

8. **File:** `promote_used_temporaries.rs:77`
   **Description:** Inter-state uses tuple `(IdentifierId, bool)` instead of array.
   **TS vs Rust:** TS line 232 uses `Map<IdentifierId, [Identifier, boolean]>`. Rust line 77 uses `HashMap<IdentifierId, (IdentifierId, bool)>`.
   **Impact:** Rust stores `IdentifierId` instead of `Identifier` object. This is correct for the arena model, but the field semantics differ: TS stores the full Identifier, Rust stores just the ID. This is fine if the ID is sufficient, but worth noting as a structural change.

9. **File:** `promote_used_temporaries.rs:967-982`
   **Description:** Identifier promotion uses assertion instead of invariant.
   **TS vs Rust:** TS line 452-456 uses `CompilerError.invariant(identifier.name === null, ...)`. Rust uses `assert!` which panics.
   **Impact:** TS invariant errors are catchable and reportable, Rust panics are not. This breaks the error handling model described in the architecture guide.

### Minor/Stylistic Issues

10. **File:** `promote_used_temporaries.rs:975-980`
    **Description:** JSX tag name promotion differs from TS.
    **TS vs Rust:** TS line 458-460 calls `promoteTemporaryJsxTag(identifier)` from HIR module. Rust directly sets `name = Some(IdentifierName::Promoted(format!("#T{}", decl_id.0)))` (uppercase T).
    **Impact:** Functionally equivalent but duplicates logic. Should call HIR helper if available for consistency.

11. **File:** `promote_used_temporaries.rs:985-1015`
    **Description:** Local `each_pattern_operand` helper function duplicates HIR visitor logic.
    **TS vs Rust:** TS imports `eachPatternOperand` from `'../HIR/visitors'`. Rust defines its own version.
    **Impact:** Same as Issue #7 - code duplication and maintenance burden.

12. **File:** `promote_used_temporaries.rs:53-63`
    **Description:** Parameter promotion loop differs structurally.
    **TS vs Rust:** TS line 432-437 iterates `fn.params` and uses conditional to get place. Rust line 54-63 does the same but with slightly different destructuring.
    **Impact:** Stylistic only. Both are correct.

13. **File:** Throughout
    **Description:** Collect-then-iterate pattern used extensively.
    **TS vs Rust:** Many functions collect IDs/data into Vec before iterating (e.g., lines 275-278, 289-294, 789-795, 855-860).
    **Impact:** This is a common Rust pattern to avoid borrow checker issues. Adds minor overhead but is idiomatic. Not a bug, just a structural difference.

## Architectural Differences

1. **Visitor pattern implementation:** TS uses class-based `ReactiveFunctionVisitor` with methods that are called by the framework. Rust uses plain functions that manually traverse the structure. The TS version has `CollectPromotableTemporaries`, `PromoteTemporaries`, `PromoteInterposedTemporaries`, and `PromoteAllInstancedOfPromotedTemporaries` as classes. Rust implements them as sets of functions with shared naming conventions (`collect_promotable_*`, `promote_temporaries_*`, etc.).

2. **State management:** TS uses instance variables on visitor classes. Rust passes state structs as mutable references through the call chain. This is a standard translation pattern.

3. **Function recursion:** TS uses `visitReactiveFunction(fn, this, state)` to recursively process nested functions. Rust should do similar but currently doesn't (see Major Issues #1 and #2).

4. **Arena access pattern:** Rust consistently uses `env.identifiers[id.0 as usize]` and `env.scopes[scope_id.0 as usize]` for indirection, while TS uses direct object references.

5. **Error handling:** TS uses `CompilerError.invariant`, Rust uses `assert!`. This is inconsistent with the architecture guide which says invariants should return `Err(CompilerDiagnostic)`.

## Completeness

1. **Missing nested function recursion:** As noted in Major Issues #1 and #2, the recursive descent into function expressions is incomplete. The TS version calls `this.visitHirFunction(value.loweredFunc.func, state)` in Phase 2 (line 85-86) and `visitReactiveFunction(fn, this, state)` in Phase 4 (line 167-168). Rust needs to add similar recursion.

2. **Missing eachInstructionValueLValue check:** Phase 3 should verify that instruction value lvalues are named, as TS does on line 289-294. Rust skips this per the comment on line 477-478.

3. **All phases implemented:** All four phases from TS are present in Rust:
   - Phase 1: `collect_promotable_*` functions (lines 89-255)
   - Phase 2: `promote_temporaries_*` functions (lines 261-419)
   - Phase 3: `promote_interposed_*` functions (lines 425-733)
   - Phase 4: `promote_all_instances_*` functions (lines 739-956)

4. **Active scope tracking:** Phase 1 correctly implements `activeScopes` tracking with push/pop logic (lines 50-51, 102-104, 226-228 in TS; lines 93-94, 101-104 in Rust).

5. **Pruned scope tracking:** The `pruned` map with `active_scopes` and `used_outside_scope` fields correctly tracks pruned scope usage (lines 176-179 in TS; lines 28-33 in Rust).

6. **Const and global tracking:** Phase 3 correctly tracks const bindings and global loads to avoid unnecessary promotion (TS lines 235-260, 318-377; Rust lines 69-76, 494-596).

7. **Missing utility from HIR:** The `each_pattern_operand` function is defined locally (lines 985-1015) instead of using a HIR visitor if one exists. Should verify if this exists in the HIR visitors crate and use that instead.
