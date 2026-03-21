# Review: compiler/crates/react_compiler_reactive_scopes/src/prune_hoisted_contexts.rs

## Corresponding TypeScript Source
compiler/packages/babel-plugin-react-compiler/src/ReactiveScopes/PruneHoistedContexts.ts

## Summary
The Rust port correctly implements hoisted context pruning but diverges in error handling strategy (recording vs. throwing) and has a logical bug in the function definition tracking.

## Issues

### Major Issues

1. **Incorrect function definition tracking and removal** (prune_hoisted_contexts.rs:173-180)
   - **Description**: After setting `definition: Some(lvalue.place.identifier)`, the code removes the identifier from `state.uninitialized`, making subsequent references safe. However, this removal should happen AFTER the assertion check.
   - **TS behavior**: Lines 150-155 set `maybeHoistedFn.definition = instruction.value.lvalue.place` then delete from `state.uninitialized`. This makes future references to the function safe.
   - **Rust behavior**: Lines 173-180 set the definition and immediately remove from uninitialized in the wrong order relative to the assertion.
   - **Impact**: The logic appears correct but the removal on line 179 happens after updating the entry on line 174-177, which is redundant since we already have mutable access. More critically, the control flow suggests this removal happens unconditionally, but it should only happen if we confirmed the hoisted function.

2. **Error recording vs. throwing** (prune_hoisted_contexts.rs:118-124, 183-189)
   - **Description**: The Rust version records Todo errors via `env.record_error()` instead of throwing them.
   - **TS behavior**: Lines 92-95 and 158-162 use `CompilerError.throwTodo()` which immediately aborts compilation.
   - **Rust behavior**: Lines 118-124 and 183-189 call `env_mut().record_error()` with `ErrorCategory::Todo`.
   - **Impact**: **CRITICAL** - The TS version throws and stops processing, while the Rust version continues. This means the Rust version may produce incorrect output or crash later when it encounters invalid state that should have aborted earlier. According to the architecture guide, `throwTodo()` should return `Err(CompilerDiagnostic)`, not call `record_error()`.

3. **visitPlace signature mismatch** (prune_hoisted_contexts.rs:107-128)
   - **Description**: The Rust `visit_place` method takes `EvaluationOrder` as first parameter.
   - **TS behavior**: Line 82-96 shows `visitPlace(_id: InstructionId, place: Place, ...)`.
   - **Rust behavior**: Line 109 has `_id: EvaluationOrder`.
   - **Impact**: Type mismatch - according to the architecture guide, "The old TypeScript `InstructionId` is renamed to `EvaluationOrder`", but the actual parameter should match what the visitor trait expects. Need to verify this matches the trait definition.

### Moderate Issues

4. **Comparison of IdentifierId vs. Place** (prune_hoisted_contexts.rs:115)
   - **Description**: The Rust version compares `*definition != Some(place.identifier)` (comparing `Option<IdentifierId>` with `IdentifierId`).
   - **TS behavior**: Line 90 compares `maybeHoistedFn.definition !== place` (comparing `Place | null` with `Place`).
   - **Rust behavior**: Line 115 compares `IdentifierId` values instead of whole `Place` objects.
   - **Impact**: Different semantics - TS checks if it's the exact same Place object, Rust only checks if it's the same identifier. The Rust approach is probably more correct (checking logical identity), but it's a divergence.

5. **Assertion vs. invariant** (prune_hoisted_contexts.rs:168-171)
   - **Description**: Uses `assert!` macro for the hoisted function check.
   - **TS behavior**: Line 146 uses `CompilerError.invariant()` which provides error details.
   - **Rust behavior**: Line 168-171 uses plain `assert!` with a string message.
   - **Impact**: When the assertion fails, the Rust version will panic with less context than the TS version which includes location information. Should use a proper error type or `CompilerError::invariant` equivalent.

6. **Raw pointer pattern for environment** (prune_hoisted_contexts.rs:66-75)
   - **Description**: Uses `*mut Environment` stored in the Transform struct.
   - **TS behavior**: Direct access to environment via `state.env` or closure capture.
   - **Rust behavior**: Lines 70-75 wrap all env access in unsafe blocks.
   - **Impact**: Same unsafe pattern as other files. Needs architectural review.

### Minor/Stylistic Issues

7. **Enum variant naming** (prune_hoisted_contexts.rs:44-47)
   - **Description**: `UninitializedKind::UnknownKind` is redundant (Kind appears twice).
   - **Suggestion**: Consider `UninitializedKind::Unknown` and `UninitializedKind::Func`.

8. **Vec allocation for declaration IDs** (prune_hoisted_contexts.rs:72-79)
   - **Description**: Collects declaration IDs into a Vec before iterating, which is unnecessary.
   - **TS behavior**: Lines 73-75 iterate directly over `scope.scope.declarations.values()`.
   - **Rust behavior**: Lines 72-79 collect into a Vec first.
   - **Impact**: Extra allocation. Could iterate directly and collect only the IDs needed, or restructure to avoid the Vec.

9. **Duplicate scope_data access** (prune_hoisted_contexts.rs:82, 101)
   - **Description**: Reads `scope_data` twice, once at the start and once at the end of `visit_scope`.
   - **TS behavior**: Single access pattern via direct property access.
   - **Rust behavior**: Line 82 and line 101 both read from the arena.
   - **Impact**: Minor inefficiency, but arena access is cheap.

10. **Missing debug information in assertions** (prune_hoisted_contexts.rs:168-171)
    - **Description**: The assertion message doesn't include the actual kind found.
    - **Suggestion**: Use `assert!(matches!(...), "Expected Func, got: {:?}", kind)`.

## Architectural Differences

1. **Error handling strategy**: The most critical difference - TS throws on Todo errors to abort immediately, while Rust records them and continues. This violates the architecture guide's error handling section.

2. **Place vs. IdentifierId comparison**: The Rust version compares logical identity (IdentifierId) while TS compares reference identity (Place objects). This is actually more correct in Rust since Place is Clone.

3. **Stack vs. Vec for active scopes**: TS uses a `Stack` utility type, Rust uses `Vec<HashSet<...>>` directly. Functionally equivalent.

## Completeness

**Implemented**:
- ✅ Tracking active scope declarations
- ✅ Tracking uninitialized hoisted variables
- ✅ Detecting hoisted function references before definition
- ✅ Removing DeclareContext for hoisted declarations
- ✅ Converting StoreContext let/const to Reassign
- ✅ Handling function declarations specially
- ✅ Cleaning up uninitialized tracking after scopes

**Incorrect or missing**:
- ❌ Error handling: records instead of returning Err() for Todo errors
- ⚠️ Function definition tracking has logic issue (redundant remove)
- ⚠️ Assertion should be invariant error, not panic
- ⚠️ Place vs IdentifierId comparison is a semantic change
