# Review: compiler/crates/react_compiler_validation/src/validate_hooks_usage.rs

## Corresponding TypeScript Source
`compiler/packages/babel-plugin-react-compiler/src/Validation/ValidateHooksUsage.ts`

## Summary
Accurate port of hooks usage validation with proper tracking of hook kinds through abstract interpretation. Error handling matches TS patterns well.

## Issues

### Major Issues
None found

### Moderate Issues

1. **validate_hooks_usage.rs:311-312** - Dynamic hook error logic difference
   - TS (lines 318-319): `else if (calleeKind === Kind.PotentialHook) { recordDynamicHookUsageError(instr.value.callee); }`
   - Rust (lines 310-312): Same logic but needs verification that it's outside the conditional hook check
   - Impact: Minor - logic appears correct but worth verifying the control flow matches exactly

### Minor/Stylistic Issues

1. **validate_hooks_usage.rs:194** - `compute_unconditional_blocks` parameter
   - Takes `env.next_block_id_counter` parameter
   - TS version (line 87) calls `computeUnconditionalBlocks(fn)` without extra parameter
   - This is likely a Rust implementation detail for block ID management

2. **validate_hooks_usage.rs:411-413** - Error recording order
   - TS (lines 418-420): Records errors via iteration over `errorsByPlace` Map
   - Rust (lines 411-413): Records errors via iteration over `IndexMap`
   - Using `IndexMap` in Rust ensures insertion order is preserved, matching TS Map iteration order - this is correct

3. **validate_hooks_usage.rs:419-479** - `visit_function_expression` implementation
   - TS (lines 423-456): Processes function expressions recursively
   - Rust (lines 419-479): More complex with `enum Item` to track processing order
   - Rust approach is more explicit about processing order but achieves same result

## Architectural Differences

1. **Error deduplication** - Uses `IndexMap<SourceLocation, CompilerErrorDetail>` to deduplicate errors by location, matching TS `Map<t.SourceLocation, CompilerErrorDetail>` with insertion-order preservation

2. **Hook kind determination** - Uses `env.get_hook_kind_for_type()` and helper function `get_hook_kind_for_id()` vs TS `getHookKind()`

3. **Pattern matching** - Extensive use of match expressions vs TS switch statements, as expected

## Completeness

All functionality present:
- Kind lattice with proper join operation
- Hook name detection
- Conditional hook call validation
- Dynamic hook usage validation
- Invalid hook usage (passing as value) validation
- Function expression recursion with hook call detection
- Proper error deduplication and ordering
