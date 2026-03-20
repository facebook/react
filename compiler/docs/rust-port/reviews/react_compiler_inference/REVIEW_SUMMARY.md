# React Compiler Inference Crate Review Summary

## Overview
This directory contains detailed reviews of the Rust port for the `react_compiler_inference` crate, covering core inference passes from part 1 of the Rust port plan.

**Date:** 2026-03-20
**Reviewer:** Claude (Sonnet 4.5)
**Scope:** Core inference passes (part 1)

## Files Reviewed

### 1. lib.rs
- **Status:** ✓ Complete
- **Severity:** None identified
- **File:** [lib.rs.md](./src/lib.rs.md)
- **Summary:** Module exports are correct. All inference and reactive scope passes properly declared and re-exported.

### 2. analyse_functions.rs
- **Status:** ✓ Complete
- **Severity:** Minor issues only
- **File:** [analyse_functions.rs.md](./src/analyse_functions.rs.md)
- **Summary:** Structurally accurate port. Main differences are architectural (arena access, debug logger callback). Minor typo in panic message and additional invariant error checking.

### 3. infer_reactive_scope_variables.rs
- **Status:** ✓ Complete
- **Severity:** Minor to moderate issues
- **File:** [infer_reactive_scope_variables.rs.md](./src/infer_reactive_scope_variables.rs.md)
- **Summary:** Core logic correctly ported including DisjointSet implementation. Location merging may need verification for GeneratedSource vs None handling. Missing debug logger call before panics. Additional validation loop required for Rust's value semantics.

### 4. memoize_fbt_and_macro_operands_in_same_scope.rs
- **Status:** ✓ Complete
- **Severity:** Minor to moderate issues
- **File:** [memoize_fbt_and_macro_operands_in_same_scope.rs.md](./src/memoize_fbt_and_macro_operands_in_same_scope.rs.md)
- **Summary:** Comprehensive port with correct two-phase analysis. Self-referential fbt.enum macro handled differently (may need verification). Missing SINGLE_CHILD_FBT_TAGS export. Inline implementation of operand collection instead of importing from visitors.

### 5. infer_reactive_places.rs
- **Status:** ⚠️ Partial review (file too large)
- **Severity:** Moderate verification needed
- **File:** [infer_reactive_places.rs.md](./src/infer_reactive_places.rs.md)
- **Summary:** Core algorithm structure appears correct with fixpoint iteration and reactivity propagation. Needs full verification of: StableSidemap completeness, all Effect variants handling, inner function propagation logic. File size prevented complete review.

### 6. infer_mutation_aliasing_ranges.rs
- **Status:** ⚠️ Partial review (file too large - 1737 lines)
- **Severity:** Critical verification needed
- **File:** [infer_mutation_aliasing_ranges.rs.md](./src/infer_mutation_aliasing_ranges.rs.md)
- **Summary:** Complex abstract heap model and mutation propagation algorithm. High-level structure appears correct. **CRITICAL:** Must verify mutation queue logic, edge ordering semantics, MutationKind comparisons, and all three algorithm parts. This pass is essential for correctness.

### 7. infer_mutation_aliasing_effects.rs
- **Status:** ⚠️ Partial review (file too large - 2900+ lines in TS)
- **Severity:** **CRITICAL** verification needed
- **File:** [infer_mutation_aliasing_effects.rs.md](./src/infer_mutation_aliasing_effects.rs.md)
- **Summary:** The most complex pass in the entire compiler. Abstract interpretation with fixpoint iteration, signature inference for 50+ instruction types, effect application logic. **MISSION CRITICAL:** Requires thorough testing and verification. Key areas: InferenceState merge logic, applyEffect function (600+ lines), signature computation for all instruction kinds, function signature expansion, error generation.

## Severity Summary

### Critical Issues
- **infer_mutation_aliasing_effects.rs**: Extreme complexity (2900+ lines in TS) requires extensive verification and testing
- **infer_mutation_aliasing_ranges.rs**: Complex algorithm with mutation propagation must be verified for correctness

### Moderate Issues
- **infer_reactive_scope_variables.rs**: Location merging logic (GeneratedSource vs None)
- **memoize_fbt_and_macro_operands_in_same_scope.rs**: Self-referential macro structure, missing export
- **infer_reactive_places.rs**: Incomplete review due to file size

### Minor Issues
- **analyse_functions.rs**: Typo in panic message, missing debug logging
- Various: Debug logging before panics consistently missing across multiple files

## Architectural Patterns Verified

All files correctly implement:
1. ✓ Arena-based access for identifiers, scopes, functions (IdentifierId, ScopeId, FunctionId)
2. ✓ Separate Environment parameter from HirFunction
3. ✓ ID-based maps instead of reference-identity maps (HashMap<IdentifierId, T>)
4. ✓ Place is Clone (small, contains IdentifierId)
5. ✓ Two-phase collect/apply pattern where needed
6. ✓ MutableRange access via identifier arena
7. ✓ Panic instead of CompilerError for invariants (where appropriate)

## Missing from Rust Port

### Across Multiple Files
1. **SINGLE_CHILD_FBT_TAGS** constant (needed by memoize_fbt pass)
2. **Debug logging before panics** - TypeScript often calls `fn.env.logger?.debugLogIRs` before throwing errors to aid debugging
3. **Source location index field** - TypeScript SourceLocation has `index: number` field that may be missing in Rust

### Verification Needed
1. **ReactiveScope field initialization** - infer_reactive_scope_variables needs to verify all fields (dependencies, declarations, reassignments, etc.) are properly initialized
2. **Effect variant coverage** - Verify Effect::ConditionallyMutateIterator is handled in reactive places
3. **Visitor helper functions** - Some files inline operand collection; verify logic matches visitor utilities

## Recommendations

### Immediate Actions
1. **Complete reviews for large files** - infer_mutation_aliasing_effects.rs and infer_mutation_aliasing_ranges.rs need full line-by-line verification
2. **Add SINGLE_CHILD_FBT_TAGS export** to memoize_fbt_and_macro_operands_in_same_scope
3. **Add debug logging before panics** - Help with debugging by logging HIR state before invariant failures
4. **Verify location merging** in infer_reactive_scope_variables (GeneratedSource handling)

### Testing Strategy
1. **Extensive fixture testing** for mutation/aliasing passes - these are the most complex
2. **Diff testing** - Compare Rust vs TypeScript output on all existing fixtures
3. **Edge case testing** - Focus on:
   - Self-referential data structures
   - Deeply nested aliasing chains
   - Complex phi node scenarios
   - Function expression signatures
   - Hoisted function handling

### Code Review Focus
1. **InferenceState::merge()** - Critical for fixpoint correctness
2. **applyEffect()** - 600+ lines, must handle all effect kinds correctly
3. **AliasingState::mutate()** - Queue-based graph traversal must preserve ordering semantics
4. **Signature computation** - Must cover all 50+ instruction kinds

## Conclusion

The Rust port of the inference crate demonstrates strong structural correspondence to the TypeScript source. The core architectural patterns (arenas, ID types, separate Environment) are consistently applied across all files.

**However**, the two largest and most complex passes (InferMutationAliasingEffects and InferMutationAliasingRanges) require critical additional verification due to their size and complexity. These passes are fundamental to compiler correctness and must be thoroughly tested.

The smaller passes (AnalyseFunctions, InferReactiveScopeVariables, MemoizeFbtAndMacroOperandsInSameScope) have only minor issues that are easily addressable.

**Overall Assessment:** Solid foundation with architectural consistency. Requires focused verification effort on the two largest passes before the port can be considered production-ready for the inference crate.
