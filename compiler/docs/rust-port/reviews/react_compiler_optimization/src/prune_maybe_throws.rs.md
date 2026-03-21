# Review: compiler/crates/react_compiler_optimization/src/prune_maybe_throws.rs

## Corresponding TypeScript Source
`compiler/packages/babel-plugin-react-compiler/src/Optimization/PruneMaybeThrows.ts`

## Summary
Conservative port of MaybeThrow terminal pruning that removes exception handlers for blocks that provably cannot throw. The implementation correctly handles terminal mapping, CFG cleanup, and phi operand rewriting with appropriate error handling.

## Issues

### Major Issues
None found

### Moderate Issues
None found

### Minor/Stylistic Issues

1. **Line 54-67: Returns `Result<(), CompilerDiagnostic>` for phi operand errors**
   - Uses Rust's Result type for error handling
   - TS likely uses CompilerError.invariant which throws
   - The Rust version provides structured error information with category, message, and source location

2. **Line 127-134: Very conservative instruction throwability check**
   - Only considers `Primitive`, `ArrayExpression`, and `ObjectExpression` as non-throwing
   - Matches TS conservative approach
   - Comment explains this is intentional - even variable references can throw due to TDZ

## Architectural Differences

1. **Terminal mapping via HashMap**: Line 93 returns `Option<HashMap<BlockId, BlockId>>` to track which blocks had terminals changed. TS likely has similar tracking.

2. **Two-phase phi operand updates**: Lines 46-84 collect updates then apply them in a second phase using `shift_remove` and `insert`. Avoids mutation during iteration.

3. **MaybeThrow handler nulling**: Lines 114-116 null out the handler field while preserving the MaybeThrow terminal. Comment explains this preserves continuation clarity for BuildReactiveFunction.

4. **CFG cleanup sequence**: Lines 37-42 call the same sequence as TS:
   - `get_reverse_postordered_blocks`
   - `remove_unreachable_for_updates`
   - `remove_dead_do_while_statements`
   - `remove_unnecessary_try_catch`
   - `mark_instruction_ids`
   - `merge_consecutive_blocks`

5. **Error handling for missing terminal mapping**: Lines 53-67 return a structured CompilerDiagnostic if a phi operand's predecessor isn't found in the mapping. TS uses CompilerError.invariant.

## Completeness

All functionality correctly ported:
- Detection of MaybeThrow terminals
- Conservative throwability analysis (only Primitive, ArrayExpression, ObjectExpression are non-throwing)
- Handler nulling instead of terminal replacement to preserve continuation info
- Terminal mapping tracking
- Full CFG cleanup sequence
- Phi operand predecessor remapping
- Predecessor marking update
- Early return when no terminals changed
- Diagnostic emission for unmapped predecessors with proper error category and source location

**No missing features.**

The implementation correctly handles the pruning transformation with appropriate conservatism and error handling.
