# Review: react_compiler_validation/src/lib.rs

## Corresponding TypeScript source
- `compiler/packages/babel-plugin-react-compiler/src/Validation/index.ts`

## Summary
The Rust lib.rs correctly exports the four ported validation passes with appropriate public APIs.

## Major Issues
None.

## Moderate Issues
None.

## Minor Issues
None.

## Architectural Differences
None - this is a straightforward module definition.

## Missing from Rust Port

The following validation passes exist in TypeScript but are NOT yet ported to Rust:

1. **ValidateExhaustiveDependencies.ts** - Validates that effects/memoization have exhaustive dependency arrays
2. **ValidateLocalsNotReassignedAfterRender.ts** - Validates that local variables aren't reassigned after being rendered
3. **ValidateNoDerivedComputationsInEffects_exp.ts** - Experimental validation for derived computations in effects
4. **ValidateNoDerivedComputationsInEffects.ts** - Validates no derived computations in effects
5. **ValidateNoFreezingKnownMutableFunctions.ts** - Validates that known mutable functions aren't frozen
6. **ValidateNoImpureFunctionsInRender.ts** - Validates no impure functions are called during render
7. **ValidateNoJSXInTryStatement.ts** - Validates JSX doesn't appear in try blocks
8. **ValidateNoRefAccessInRender.ts** - Validates that refs aren't accessed during render
9. **ValidateNoSetStateInEffects.ts** - Validates setState isn't called in effects
10. **ValidateNoSetStateInRender.ts** - Validates setState isn't called during render
11. **ValidatePreservedManualMemoization.ts** - Validates manual memoization is preserved
12. **ValidateSourceLocations.ts** - Validates source locations are correct
13. **ValidateStaticComponents.ts** - Validates component static constraints

## Additional in Rust Port
None - all Rust exports have TypeScript equivalents.
