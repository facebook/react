# Review: compiler/crates/react_compiler_validation/src/lib.rs

## Corresponding TypeScript Source
N/A - This is a Rust module organization file with no direct TS equivalent

## Summary
Standard Rust crate entry point that re-exports all validation functions from submodules.

## Issues

### Major Issues
None found

### Moderate Issues
None found

### Minor/Stylistic Issues

1. **lib.rs:20** - Exports both `validate_no_derived_computations_in_effects_exp` and `validate_no_derived_computations_in_effects`
   - The `_exp` version is exported but not documented
   - Should clarify which is the standard version

## Architectural Differences

This file doesn't exist in TypeScript. TS uses:
- `src/Validation/*.ts` files directly imported by consumers
- No central validation module index

Rust uses:
- `src/lib.rs` to organize and re-export all validation functions
- Standard Rust module pattern

## Completeness

All validation modules properly declared and re-exported:
1. validate_context_variable_lvalues
2. validate_exhaustive_dependencies
3. validate_hooks_usage
4. validate_locals_not_reassigned_after_render
5. validate_no_capitalized_calls
6. validate_no_derived_computations_in_effects (+ _exp variant)
7. validate_no_freezing_known_mutable_functions
8. validate_no_jsx_in_try_statement
9. validate_no_ref_access_in_render
10. validate_no_set_state_in_effects
11. validate_no_set_state_in_render
12. validate_static_components
13. validate_use_memo
