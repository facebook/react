# Action Items from Inference Crate Review

## Critical Priority

### infer_mutation_aliasing_effects.rs
- [ ] Complete line-by-line verification of entire file (~2900 lines in TS)
- [ ] Verify InferenceState::merge() implements correct fixpoint detection
- [ ] Verify applyEffect() handles all effect kinds correctly (600+ lines)
- [ ] Verify computeSignatureForInstruction() covers all 50+ instruction types
- [ ] Verify effect interning uses identical hash function as TypeScript
- [ ] Verify function signature caching uses FunctionId not FunctionExpression reference
- [ ] Verify try-catch terminal handling (catch handler binding aliasing)
- [ ] Verify return terminal freeze effect for non-function-expressions
- [ ] Test extensively with all existing fixtures
- [ ] Add integration tests for complex aliasing scenarios

### infer_mutation_aliasing_ranges.rs
- [ ] Complete line-by-line verification of entire file (1737 lines)
- [ ] Verify AliasingState::mutate() queue-based traversal is correct
- [ ] Verify edge ordering semantics preserved (index field usage)
- [ ] Verify MutationKind enum derives support correct comparison operators
- [ ] Verify all three algorithm parts are complete:
  - [ ] Part 1: Build abstract model and process mutations
  - [ ] Part 2: Populate legacy effects and mutable ranges
  - [ ] Part 3: Determine external function effects
- [ ] Verify hoisted function StoreContext range extension logic
- [ ] Verify Node struct has all required fields with correct types
- [ ] Verify appendFunctionErrors propagates inner function errors
- [ ] Test with complex mutation chains and aliasing graphs

## High Priority

### infer_reactive_places.rs
- [ ] Complete review of full file (too large for initial review)
- [ ] Verify StableSidemap handles all instruction types:
  - [ ] Destructure
  - [ ] PropertyLoad
  - [ ] StoreLocal
  - [ ] LoadLocal
  - [ ] CallExpression/MethodCall
- [ ] Verify all Effect variants handled in operand reactivity marking
- [ ] Verify Effect::ConditionallyMutateIterator is handled
- [ ] Verify propagateReactivityToInnerFunctions is recursive and complete
- [ ] Verify control dominators integration matches TypeScript
- [ ] Verify fixpoint iteration loop structure
- [ ] Verify phi reactivity propagation logic

### memoize_fbt_and_macro_operands_in_same_scope.rs
- [ ] Add SINGLE_CHILD_FBT_TAGS export (used elsewhere in codebase)
- [ ] Verify self-referential fbt.enum macro structure is equivalent to TypeScript
- [ ] Verify inline operand collection matches visitor utility behavior
- [ ] Verify PrefixUpdate/PostfixUpdate operand collection is correct

### infer_reactive_scope_variables.rs
- [ ] Fix location merging to check for GeneratedSource equivalent (not just None)
- [ ] Add debug logger call before panic in validation error path
- [ ] Verify ReactiveScope initialization includes all fields:
  - [ ] dependencies
  - [ ] declarations
  - [ ] reassignments
  - [ ] earlyReturnValue
  - [ ] merged
- [ ] Verify SourceLocation includes index field if used in TypeScript
- [ ] Verify inline visitor helpers match imported utilities

## Medium Priority

### analyse_functions.rs
- [ ] Fix typo in panic message: "AnalyzeFunctions" → "AnalyseFunctions"
- [ ] Document debug_logger callback pattern as intentional architectural difference
- [ ] Consider adding debug logging when env.has_invariant_errors() triggers early return

### lib.rs
- [ ] Verify crate organization (combining Inference + ReactiveScopes) aligns with architecture plan
- [ ] Add crate-level documentation explaining pass purposes and pipeline position
- [ ] Cross-reference TypeScript index.ts files to ensure no missing re-exports

## Low Priority (Documentation/Polish)

### All Files
- [ ] Ensure consistent panic messages format and detail level
- [ ] Add TODO comments for known divergences from TypeScript
- [ ] Document all architectural differences in comments where non-obvious
- [ ] Consider adding tracing/logging framework for debug output (instead of DEBUG const)

### Specific Documentation
- [ ] Document why placeholder_function exists (analyse_functions.rs)
- [ ] Document arena swap pattern for processing inner functions
- [ ] Document two-phase collect/apply pattern usage
- [ ] Document effect interning strategy and why it matters

## Testing Priorities

### Unit Tests Needed
- [ ] DisjointSet implementation (infer_reactive_scope_variables.rs)
- [ ] Location merging logic (infer_reactive_scope_variables.rs)
- [ ] Macro definition lookup and property resolution (memoize_fbt.rs)
- [ ] MutationKind ordering and comparison
- [ ] Effect hashing and interning

### Integration Tests Needed
- [ ] Complex aliasing chains with multiple levels
- [ ] Phi nodes with reactive operands
- [ ] Hoisted function handling
- [ ] Try-catch with thrown call results
- [ ] Self-referential data structures
- [ ] Inner function signature inference
- [ ] All instruction types signature computation

### Regression Tests
- [ ] Run all existing TypeScript fixtures through Rust compiler
- [ ] Compare outputs (HIR with effects, errors, etc.)
- [ ] Identify any divergences and root cause

## Verification Checklist

Before marking inference crate as complete:

- [ ] All action items above addressed
- [ ] All TypeScript fixtures pass in Rust
- [ ] No regression in fixture test results
- [ ] Code review by Rust expert for borrow checker patterns
- [ ] Code review by compiler expert for algorithmic correctness
- [ ] Performance benchmarking shows acceptable characteristics
- [ ] Memory usage profiling shows no leaks or excessive allocation

## Notes

- The two large files (infer_mutation_aliasing_*.rs) are mission-critical and require the most attention
- Effect interning and abstract interpretation correctness are fundamental to the entire compiler
- The architecture patterns (arenas, ID types) are consistently applied - this is a strength
- Consider whether the large files should be split into smaller modules for maintainability
