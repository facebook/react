# Review: compiler/crates/react_compiler_optimization/src/outline_functions.rs

## Corresponding TypeScript Source
`compiler/packages/babel-plugin-react-compiler/src/Optimization/OutlineFunctions.ts`

## Summary
Clean and focused port of function outlining that extracts anonymous functions with no captured context into top-level outlined functions. The depth-first processing order and replacement with LoadGlobal instructions matches the TypeScript implementation.

## Issues

### Major Issues
None found

### Moderate Issues
None found

### Minor/Stylistic Issues

1. **Line 82-96: Clone entire inner function for recursion**
   - Line 85-86 clone the inner function, process it, then write it back
   - Necessary workaround for Rust's borrow checker
   - TS can recurse directly without cloning

2. **Line 99-102: Hint extraction uses `clone()` on Option<String>**
   - Creates a new String allocation for the hint
   - TS can pass the string directly
   - Minor performance difference

## Architectural Differences

1. **Action enum pattern**: Lines 31-39 define an `Action` enum to defer processing. This allows collecting all actions first, then processing them in depth-first order. TS processes inline during iteration.

2. **Depth-first ordering**: Lines 82-123 process actions sequentially, recursing first then outlining. The comment explains this matches TS ordering where inner functions get names before outer ones.

3. **FBT operands parameter**: Line 27 takes `fbt_operands: &HashSet<IdentifierId>` parameter. TS likely has similar FBT-related filtering.

4. **`env.outline_function` call**: Line 111 calls `env.outline_function(outlined_func, None)` to register the outlined function. TS likely has similar environment method.

5. **`env.generate_globally_unique_identifier_name`**: Line 104 generates unique names. TS has equivalent functionality.

## Completeness

All functionality correctly ported:
- Detection of anonymous function expressions (checking `inner_func.id.is_none()`)
- Captured context check (`inner_func.context.is_empty()`)
- FBT operand filtering
- Recursive processing of inner functions (depth-first)
- Globally unique name generation with hint support
- Setting outlined function's `id` field
- Outlining via `env.outline_function`
- Replacement of FunctionExpression with LoadGlobal
- Preservation of source location
- Recursive processing of ObjectMethod (without outlining them)

**No missing features.**

The implementation correctly handles the outlining transformation with proper depth-first ordering.
