# Review: compiler/crates/react_compiler_optimization/src/prune_unused_labels_hir.rs

## Corresponding TypeScript Source
`compiler/packages/babel-plugin-react-compiler/src/HIR/PruneUnusedLabelsHIR.ts`

## Summary
Straightforward port of unused label pruning that merges label/body/fallthrough block triples when the body immediately breaks to the fallthrough. The implementation correctly validates constraints and updates the CFG structure.

## Issues

### Major Issues
None found

### Moderate Issues
None found

### Minor/Stylistic Issues

1. **Lines 54-69: Uses assert! macros for validation**
   - Rust uses `assert!` for phi emptiness and predecessor validation checks
   - TS uses `CompilerError.invariant` which provides richer error context
   - The Rust assertions will panic with the provided message
   - TS invariants include source location information

2. **Line 96-99: Uses `swap_remove` instead of `shift_remove` for preds**
   - Line 97 uses `block.preds.swap_remove(&old)` which doesn't preserve order
   - Line 98 uses `block.preds.insert(new)` which adds at the end
   - For a Set this is fine, but may differ from TS ordering if TS maintains insertion order
   - Since preds is a Set, order shouldn't matter semantically

## Architectural Differences

1. **Three-phase processing**:
   - Phase 1 (lines 20-45): Identify mergeable labels
   - Phase 2 (lines 48-87): Apply merges and build rewrite map
   - Phase 3 (lines 90-100): Rewrite predecessor sets
   - TS likely has similar multi-phase structure

2. **Rewrites HashMap tracking**: Line 48 uses `HashMap<BlockId, BlockId>` to track transitive rewrites. TS uses `Map<BlockId, BlockId>`.

3. **Block removal via `shift_remove`**: Lines 83-84 use `shift_remove` on IndexMap to remove merged blocks while preserving order of remaining blocks.

4. **Instruction and terminal cloning**: Lines 72-74 clone instructions and terminal from merged blocks. TS can move or reference them directly.

## Completeness

All functionality correctly ported:
- Detection of Label terminals
- Validation that body block immediately breaks to fallthrough
- BlockKind::Block requirement for both body and fallthrough
- GotoVariant::Break requirement
- Empty phi validation for mergeable blocks
- Single predecessor validation
- Instruction merging from body and fallthrough into label block
- Terminal replacement
- Block removal
- Transitive rewrite tracking
- Predecessor set updates across all blocks
- Uses `original_label_id` vs `label_id` to handle transitive merges correctly

**No missing features.**

The implementation correctly handles the label pruning transformation with appropriate validation.
