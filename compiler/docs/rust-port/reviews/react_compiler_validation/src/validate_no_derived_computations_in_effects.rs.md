# Review: compiler/crates/react_compiler_validation/src/validate_no_derived_computations_in_effects.rs

## Corresponding TypeScript Source
`compiler/packages/babel-plugin-react-compiler/src/Validation/ValidateNoDerivedComputationsInEffects.ts`

## Summary
Complex validation pass for preventing derived computations in effects. The TS version is relatively simple (230 lines), but the Rust file contains a much larger experimental implementation that wasn't in the provided TS source.

## Issues

### Major Issues

1. **File contains multiple implementations** - Cannot fully review
   - The Rust file is 69.5KB (too large to display fully)
   - Contains `validate_no_derived_computations_in_effects` AND `validate_no_derived_computations_in_effects_exp`
   - TS source provided is only 230 lines (basic version)
   - Impact: Cannot verify the large `_exp` experimental version without corresponding TS

### Moderate Issues

1. **Basic version appears to match TS structure**
   - Both track `candidateDependencies`, `functions`, `locals` Maps
   - Both look for useEffect calls with function expressions and dependencies
   - Both call `validateEffect` helper
   - Structure is comparable but need full visibility to confirm

### Minor/Stylistic Issues
Cannot assess without full file visibility

## Architectural Differences
Cannot fully assess without seeing complete implementations

## Completeness

**Basic version:**
- Appears to follow TS logic
- Tracks array expressions as candidate dependencies
- Tracks function expressions
- Detects useEffect hooks with proper signatures

**Experimental version:**
- Large implementation not in provided TS
- Likely corresponds to a different or newer TS file
- Cannot review without source
