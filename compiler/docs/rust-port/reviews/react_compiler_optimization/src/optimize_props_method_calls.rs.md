# Review: compiler/crates/react_compiler_optimization/src/optimize_props_method_calls.rs

## Corresponding TypeScript Source
`compiler/packages/babel-plugin-react-compiler/src/Optimization/OptimizePropsMethodCalls.ts`

## Summary
Very straightforward port that converts MethodCall instructions on props objects into CallExpression instructions. The implementation is clean, simple, and matches the TypeScript version exactly.

## Issues

### Major Issues
None found

### Moderate Issues
None found

### Minor/Stylistic Issues

1. **Line 23: Uses hardcoded `BUILT_IN_PROPS_ID` constant**
   - Both TS and Rust use a special built-in shape ID to identify props objects
   - This is correct and matches the TS implementation

## Architectural Differences

1. **Instruction collection before mutation**: Lines 28 collects `instruction_ids` into a Vec before iterating to modify instructions. This avoids borrow conflicts. TS can mutate during iteration.

2. **`std::mem::replace` with temporary value**: Line 39-42 uses `mem::replace` to swap out the old instruction value with a temporary `Debugger` value, then reconstructs the CallExpression. This is necessary because we can't partially move out of a borrowed struct in Rust.

## Completeness

All functionality correctly ported:
- Props type detection via `BUILT_IN_PROPS_ID` shape matching
- MethodCall to CallExpression conversion
- Preservation of property as callee
- Preservation of arguments
- Preservation of location info

**No missing features.**

The implementation is minimal and complete.
