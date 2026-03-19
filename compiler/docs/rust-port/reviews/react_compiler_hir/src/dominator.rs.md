# Review: compiler/crates/react_compiler_hir/src/dominator.rs

## Corresponding TypeScript file(s)
- `compiler/packages/babel-plugin-react-compiler/src/HIR/Dominator.ts`
- `compiler/packages/babel-plugin-react-compiler/src/HIR/ComputeUnconditionalBlocks.ts`
- `compiler/packages/babel-plugin-react-compiler/src/HIR/visitors.ts` (for `eachTerminalSuccessor`)

## Summary
This file ports the dominator/post-dominator computation and the unconditional blocks analysis. The algorithm is faithful to the TypeScript implementation (Cooper/Harvey/Kennedy). The main structural difference is that the Rust version takes `next_block_id_counter` as an explicit parameter rather than using `fn.env.nextBlockId`.

## Major Issues
None.

## Moderate Issues

1. **Missing `computeDominatorTree` function**
   The Rust file only implements `compute_post_dominator_tree` and `compute_unconditional_blocks`. The TS file (`Dominator.ts:21-25`) also exports `computeDominatorTree` which computes forward dominators using `buildGraph` (not `buildReverseGraph`). The Rust port is missing `buildGraph` and `computeDominatorTree` entirely.

2. **Missing `Dominator` class (forward dominator tree)**
   `/compiler/crates/react_compiler_hir/src/dominator.rs:21-37` - Only `PostDominator` is implemented. TS (`Dominator.ts:69-106`) has a separate `Dominator<T>` class for forward dominators.

3. **Graph representation uses `Vec` + index map instead of ordered `Map`**
   `/compiler/crates/react_compiler_hir/src/dominator.rs:51-57` - TS uses `Map<T, Node<T>>` which preserves insertion order. Rust uses `Vec<Node>` with a separate `HashMap<BlockId, usize>` for lookup, and sorts into RPO via explicit DFS. The RPO ordering may differ from TS when `HashSet` iteration order of predecessors/successors differs (since `HashSet` is unordered while TS `Set` preserves insertion order). However, this should not affect correctness since the dominator algorithm converges regardless of iteration order.

4. **`each_terminal_successor` returns `Vec<BlockId>` instead of an iterator**
   `/compiler/crates/react_compiler_hir/src/dominator.rs:72` - TS (`visitors.ts`) likely returns an iterable. The Rust version allocates a Vec for each call. This is a performance concern but not a correctness issue.

5. **`PostDominator.get` panics on unknown node**
   `/compiler/crates/react_compiler_hir/src/dominator.rs:31` - Uses `expect` which panics. TS (`Dominator.ts:128-132`) uses `CompilerError.invariant` which also throws. Semantically equivalent but the Rust panic has a less informative message than TS's structured error.

## Minor Issues

1. **Missing `debug()` method on `PostDominator`**
   TS (`Dominator.ts:135-144`) has a `debug()` method for pretty-printing. Not present in Rust.

2. **`each_terminal_successor` is defined in this file instead of a separate `visitors` module**
   TS puts `eachTerminalSuccessor` in `visitors.ts`. Rust puts it directly in `dominator.rs`.

3. **`compute_unconditional_blocks` uses `assert!` instead of structured error**
   `/compiler/crates/react_compiler_hir/src/dominator.rs:312-314` - TS (`ComputeUnconditionalBlocks.ts:29-32`) uses `CompilerError.invariant`. The Rust version uses `assert!` which panics with a message string but not a structured compiler diagnostic.

4. **`build_reverse_graph` uses `HashSet` for `preds` and `succs`**
   `/compiler/crates/react_compiler_hir/src/dominator.rs:47-48` - TS uses `Set<T>` which preserves insertion order. Rust `HashSet` does not preserve order. For dominator computation this doesn't matter for correctness (the algorithm converges) but may affect performance characteristics.

## Architectural Differences

1. **`next_block_id_counter` passed as parameter**
   `/compiler/crates/react_compiler_hir/src/dominator.rs:114-115` - TS accesses `fn.env.nextBlockId` directly. In Rust, `env` is separate from `HirFunction`, so the counter must be passed explicitly.

2. **`compute_unconditional_blocks` returns `HashSet<BlockId>` instead of `Set<BlockId>`**
   `/compiler/crates/react_compiler_hir/src/dominator.rs:300` - Expected Rust type mapping.

## Missing TypeScript Features

1. **Forward `Dominator<T>` class and `computeDominatorTree` function** - Only post-dominators are implemented.
2. **`debug()` pretty-print methods** on dominator tree types.
