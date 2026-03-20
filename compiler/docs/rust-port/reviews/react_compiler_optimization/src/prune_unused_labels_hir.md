# Review: react_compiler_optimization/src/prune_unused_labels_hir.rs

## Corresponding TypeScript source
- `compiler/packages/babel-plugin-react-compiler/src/HIR/PruneUnusedLabelsHIR.ts`

## Summary
The Rust port accurately implements unused label pruning with proper label/next/fallthrough block merging and predecessor rewriting. The implementation matches the TS version structurally.

## Major Issues
None

## Moderate Issues
None

## Minor Issues
None

## Architectural Differences
- **Rust (lines 53-69)**: Uses `assert!()` for validation with explicit error messages
- **TS (lines 52-69)**: Uses `CompilerError.invariant()` for validation
- **Rust (line 86)**: `rewrites.insert(*fallthrough_id, label_id)` - inserts into HashMap
- **TS (line 75)**: `rewrites.set(fallthroughId, labelId)` - inserts into Map
- **Rust (lines 91-99)**: Collects preds to rewrite, then iterates and modifies
- **TS (lines 78-85)**: Direct iteration and modification using `for...of` with delete/add
- **Rust reasoning**: Borrow checker requires collecting before mutating

## Missing from Rust Port
None. All TS logic is present including:
- Label terminal detection
- Goto+Break pattern matching
- Block kind validation (must be BlockKind::Block)
- Three-block merge (label + next + fallthrough)
- Phi validation (must be empty)
- Predecessor validation (single predecessors only)
- Instruction merging
- Terminal replacement
- Transitive rewrite tracking
- Predecessor set updates

## Additional in Rust Port
None. Implementation is 1:1.
