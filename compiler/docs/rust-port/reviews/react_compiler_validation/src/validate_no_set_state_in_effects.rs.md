# Review: compiler/crates/react_compiler_validation/src/validate_no_set_state_in_effects.rs

## Corresponding TypeScript Source
`compiler/packages/babel-plugin-react-compiler/src/Validation/ValidateNoSetStateInEffects.ts`

## Summary
Large complex validation (664 lines vs TS 348 lines). Rust version includes additional control flow analysis logic not present in TS.

## Issues

### Major Issues

1. **validate_no_set_state_in_effects.rs:327-454** - Control dominator analysis implementation
   - Rust implements full `post_dominator_frontier` and related functions (lines 327-454)
   - TS imports `createControlDominators` from separate file (line 32)
   - Impact: Rust inlines significant logic that TS delegates to another module
   - Need to verify this matches `ControlDominators.ts` implementation

2. **validate_no_set_state_in_effects.rs:467-519, 539-578** - Dual-pass ref tracking
   - Rust does TWO passes over the function to collect ref-derived values (lines 471-519, then 541-578)
   - TS does single pass (lines 210-289)
   - Impact: Different algorithm structure - need to verify produces same results

### Moderate Issues

1. **validate_no_set_state_in_effects.rs:145-149** - SetStateInfo struct
   - Rust uses struct with only `loc: Option<SourceLocation>`
   - TS uses Place directly (line 49)
   - Impact: Minor architectural difference, Rust extracts just the location

2. **validate_no_set_state_in_effects.rs:160-211** - Error message differences
   - Rust has two similar but distinct error messages based on `enable_verbose` flag
   - TS has same pattern (lines 126-175)
   - Messages appear equivalent

### Minor/Stylistic Issues

1. **validate_no_set_state_in_effects.rs:263-325** - Helper function `collect_operands`
   - Rust implements custom operand collection
   - TS uses `eachInstructionValueOperand` visitor (line 237)
   - Different approach but should be equivalent

## Architectural Differences

1. **Control flow analysis** - Rust inlines post-dominator computation, TS imports it
2. **Ref tracking algorithm** - Rust uses two-pass approach, TS uses single pass with helper
3. **Config access** - Rust accesses multiple config flags explicitly

## Completeness

All functionality present:
- setState tracking through LoadLocal/StoreLocal
- FunctionExpression analysis for setState calls
- useEffectEvent special handling
- Effect hook detection and validation
- Ref-derived value tracking (if enabled)
- Control-dominated block checking (if enabled)
- Verbose vs standard error messages
