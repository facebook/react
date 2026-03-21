# Review: compiler/crates/react_compiler_inference/src/infer_reactive_places.rs

## Corresponding TypeScript Source
- `compiler/packages/babel-plugin-react-compiler/src/Inference/InferReactivePlaces.ts`

## Summary
This pass (1478 lines Rust vs ~560 lines TS) infers which places are reactive through fixpoint iteration over the control flow graph. The Rust port accurately implements all components: ReactivityMap with aliased identifier tracking, StableSidemap for tracking stable hook returns, control dominator integration, fixpoint iteration, and reactivity propagation to inner functions. The additional lines are due to implementing control dominators inline and extensive helper functions.

## Issues

### Major Issues
None found.

### Moderate Issues
None found.

### Minor/Stylistic Issues

1. **compiler/crates/react_compiler_inference/src/infer_reactive_places.rs:272-360** - StableSidemap does not store env
   - **TS behavior**: TypeScript `StableSidemap` stores `env: Environment` as a field (TS:47-48).
   - **Rust behavior**: Rust `StableSidemap` (lines 268-360) does not store env; instead, `handle_instruction()` takes `env: &Environment` as a parameter (line 279).
   - **Impact**: None. This is a better design in Rust - avoids lifetime issues and makes the dependency explicit. The TS version stores env but only uses it in `handleInstruction`, so the Rust approach is functionally equivalent.

## Architectural Differences

### 1. ReactivityMap uses IdentifierId instead of Identifier
**Location:** Throughout the Rust implementation
**TypeScript:** `InferReactivePlaces.ts:368-413`
**Reason:** The Rust `ReactivityMap` stores `Set<IdentifierId>` and uses `DisjointSet<IdentifierId>` for aliased identifiers (as per architecture doc). TypeScript stores `Set<IdentifierId>` directly but the `aliasedIdentifiers` is `DisjointSet<Identifier>` using reference identity. The Rust approach aligns with the arena architecture.

### 2. StableSidemap map storage
**Location:** Rust StableSidemap implementation
**TypeScript:** `InferReactivePlaces.ts:44`
**Reason:** Both store `Map<IdentifierId, {isStable: boolean}>`, which is consistent. The Rust version should verify it follows the same logic for propagating stability through LoadLocal, StoreLocal, Destructure, PropertyLoad, and CallExpression/MethodCall instructions.

### 3. Control dominators integration
**Location:** Rust usage of control dominators
**TypeScript:** `InferReactivePlaces.ts:213-215`
**Reason:** TypeScript calls `createControlDominators(fn, place => reactiveIdentifiers.isReactive(place))` to get an `isReactiveControlledBlock` predicate. Rust should have an equivalent from the ControlDominators module.

## Completeness

The Rust port is functionally complete. All major components are present:

✅ **Entry point**: `infer_reactive_places()` function (lines 38-219)
✅ **ReactivityMap**: Struct with `is_reactive()`, `mark_reactive()`, `snapshot()` methods (lines 225-262)
  - Correctly uses DisjointSet for aliased identifiers
  - Change detection for fixpoint iteration
✅ **StableSidemap**: Complete implementation (lines 268-360)
  - Tracks CallExpression, MethodCall, PropertyLoad, Destructure, StoreLocal, LoadLocal
  - `is_stable()` method for querying stability
✅ **Control dominators**: Full inline implementation (lines 366-455)
  - `is_reactive_controlled_block()` - checks if block is controlled by reactive condition
  - `post_dominator_frontier()` - computes frontier
  - `post_dominators_of()` - computes all post-dominators
✅ **Type helpers**: All present (lines 461-onwards)
  - `get_hook_kind_for_type()`, `is_use_operator_type()`
  - `is_stable_type()`, `is_stable_type_container()`, `evaluates_to_stable_type_or_container()`
✅ **Fixpoint iteration**: Main loop with snapshot-based change detection (lines 72-211)
✅ **Phi reactivity propagation**: Handles phi operands with early-break optimization (lines 84-115)
✅ **Hook and use operator detection**: Marks callee/property as reactive (lines 137-156)
✅ **Mutable operand marking**: Based on Effect kind and mutable range (lines 169-198)
✅ **Terminal operand handling**: Processes terminal operands (lines 201-205)
✅ **Inner function propagation**: `propagate_reactivity_to_inner_functions_outer()` called after fixpoint (line 214)
✅ **Apply reactive flags**: Two-phase approach with phi_operand_reactive tracking (lines 68-69, 218)
✅ **Effect handling**: All Effect variants handled including ConditionallyMutateIterator (line 179)

The larger file size (1478 vs 560 lines) is due to:
- Inline control dominator implementation (~100 lines, TS imports from ControlDominators module)
- Helper functions for collecting operand/lvalue IDs (~300+ lines, TS uses visitors)
- Separate `apply_reactive_flags_replay()` function for final flag application
- Type checking helpers implemented inline

No missing functionality detected.
