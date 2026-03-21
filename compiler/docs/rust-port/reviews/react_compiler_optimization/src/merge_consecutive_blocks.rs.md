# Review: compiler/crates/react_compiler_optimization/src/merge_consecutive_blocks.rs

## Corresponding TypeScript Source
`compiler/packages/babel-plugin-react-compiler/src/HIR/MergeConsecutiveBlocks.ts`

## Summary
Clean port of consecutive block merging that handles CFG simplification by merging blocks with single predecessors. The implementation correctly handles phi node conversion to LoadLocal instructions and updates the CFG structure with appropriate architectural adaptations for Rust.

## Issues

### Major Issues
None found

### Moderate Issues
None found

### Minor/Stylistic Issues

1. **Line 49-54: Uses `std::mem::replace` with `placeholder_function()` for inner functions**
   - Standard pattern in Rust port to temporarily take ownership of inner functions from the arena
   - TS can recurse directly into nested functions

2. **Line 109-112: Assert macro for phi operand count validation**
   - Rust uses `assert_eq!` macro with detailed message
   - TS uses `CompilerError.invariant` which has richer error context
   - The Rust version panics immediately whereas TS could include source location

## Architectural Differences

1. **Recursive processing of inner functions**: Lines 28-55 collect inner function IDs, then use `std::mem::replace` to process each one. TS can recurse directly during iteration.

2. **Fallthrough blocks tracking**: Lines 58-63 build a `HashSet<BlockId>` of fallthrough blocks. TS builds a `Set<BlockId>` during the same iteration. Equivalent functionality.

3. **MergedBlocks helper class**: Lines 193-219 implement a helper to track transitive block merges. TS has identical logic.

4. **Phi to LoadLocal conversion**: Lines 102-144 convert phi nodes to LoadLocal instructions with Alias effects. Matches TS logic exactly.

5. **Two-phase phi operand updates**: Lines 158-177 collect updates then apply them to avoid mutation during iteration. TS can update the Map in-place during iteration.

## Completeness

All functionality correctly ported:
- Recursive processing of inner functions in FunctionExpression and ObjectMethod
- Fallthrough block tracking to avoid breaking block scopes
- Single-predecessor detection
- Block kind filtering (only merge `BlockKind::Block`)
- Goto terminal requirement for mergeability
- Phi node conversion to LoadLocal with Alias effects
- Block instruction and terminal merging
- Transitive merge tracking and application to phi operands
- Fallthrough terminal updates
- Predecessor marking
- Uses `shift_remove` for phi operand updates to maintain order

**No missing features.**

The implementation is complete and handles the subtleties of CFG manipulation correctly.
