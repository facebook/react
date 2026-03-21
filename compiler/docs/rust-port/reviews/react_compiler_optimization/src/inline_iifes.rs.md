# Review: compiler/crates/react_compiler_optimization/src/inline_iifes.rs

## Corresponding TypeScript Source
`compiler/packages/babel-plugin-react-compiler/src/Inference/InlineImmediatelyInvokedFunctionExpressions.ts`

## Summary
Sophisticated port of IIFE inlining with single-return and multi-return path handling. The implementation correctly handles CFG manipulation, block splitting, instruction remapping, and terminal rewriting with appropriate architectural adaptations for Rust.

## Issues

### Major Issues
None found

### Moderate Issues
None found

### Minor/Stylistic Issues

1. **Line 232: Promotes temporary identifiers with `IdentifierName::Promoted` format**
   - Uses `format!("#t{}", decl_id.0)` to generate promoted names
   - Matches the pattern used elsewhere in the Rust port
   - TS likely has similar logic in identifier promotion utilities

2. **Line 416-420: `promote_temporary` creates names with format `#t{decl_id}`**
   - Consistent with other uses of promoted temporaries in the Rust port
   - TS version likely uses similar naming convention

## Architectural Differences

1. **Queue-based iteration pattern**: Lines 73-75 use a queue with manual indexing (`queue_idx`) to iterate blocks while potentially adding new blocks during iteration. TS can iterate with `continue` statements. The Rust approach is necessary because we modify `func.body.blocks` during iteration.

2. **Instruction offset remapping**: Lines 179-186 and 252-258 remap instruction IDs when merging inner function instructions into the outer function by adding `instr_offset`. This is necessary because Rust stores instructions in a flat `Vec` whereas TS can keep them nested.

3. **Block draining from inner function**: Lines 172-177 and 245-250 use `drain()` to move blocks and instructions from the inner function to the outer function. TS can reference the inner function's blocks directly.

4. **`placeholder_function()` usage**: Line 51 references `enter_ssa::placeholder_function()` used with `std::mem::replace`. This is a standard pattern for temporarily taking ownership of values from arenas.

5. **`create_temporary_place` usage**: Multiple locations use this helper to create temporaries. TS likely has similar utilities.

## Completeness

All functionality correctly ported:
- Detection of IIFE patterns (CallExpression with zero args calling anonymous FunctionExpression)
- Skipping of functions with parameters, async, or generator functions
- Single-return optimization path (direct goto replacement)
- Multi-return path with LabelTerminal
- Block splitting and continuation block creation
- Instruction remapping with offset calculation
- Return terminal rewriting to StoreLocal + Goto
- Temporary declaration with DeclareLocal for multi-return case
- Temporary identifier promotion
- Function cleanup (removal of inlined function definitions)
- CFG cleanup with reverse postorder, mark_instruction_ids, mark_predecessors, merge_consecutive_blocks
- Recursive processing of nested function expressions
- Statement block kind filtering (skips inlining in expression blocks)

**No missing features.**

The implementation correctly handles the complex CFG manipulation required for IIFE inlining.
