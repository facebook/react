# Review: compiler/crates/react_compiler_optimization/src/merge_consecutive_blocks.rs

## Corresponding TypeScript file(s)
- compiler/packages/babel-plugin-react-compiler/src/HIR/MergeConsecutiveBlocks.ts

## Summary
The Rust port faithfully translates the merge consecutive blocks pass. The core algorithm -- finding blocks with a single predecessor that ends in a goto, merging them, and updating phi operands and fallthroughs -- is preserved. Key differences include the absence of recursive merging into inner functions, and the use of `assert_eq!` instead of `CompilerError.invariant` for the single-operand phi check.

## Major Issues

1. **Missing recursive merge into inner FunctionExpression/ObjectMethod bodies**
   - Rust file: `compiler/crates/react_compiler_optimization/src/merge_consecutive_blocks.rs` (absent)
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/HIR/MergeConsecutiveBlocks.ts:39-46`
   - The TS version recursively calls `mergeConsecutiveBlocks` on inner function expressions and object methods:
     ```typescript
     for (const instr of block.instructions) {
       if (instr.value.kind === 'FunctionExpression' || instr.value.kind === 'ObjectMethod') {
         mergeConsecutiveBlocks(instr.value.loweredFunc.func);
       }
     }
     ```
   - The Rust version does not recurse into inner functions. This means inner functions' CFGs will not have consecutive blocks merged. If this pass is called by other passes that also handle inner functions separately, this may be intentional, but it is a functional divergence from the TS behavior.

## Moderate Issues

1. **Phi operand count check uses `assert_eq!` (panic) vs TS `CompilerError.invariant`**
   - Rust file: `compiler/crates/react_compiler_optimization/src/merge_consecutive_blocks.rs:75-79`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/HIR/MergeConsecutiveBlocks.ts:75-78`
   - The TS version uses `CompilerError.invariant(phi.operands.size === 1, ...)` which produces a structured compiler error. The Rust version uses `assert_eq!` which panics with a message. Per the architecture doc, invariants can be panics, so this is acceptable but the error message format differs.

2. **Phi replacement instruction has `effects: None` in Rust; TS includes an `Alias` effect**
   - Rust file: `compiler/crates/react_compiler_optimization/src/merge_consecutive_blocks.rs:97-109`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/HIR/MergeConsecutiveBlocks.ts:87-96`
   - The TS version creates the LoadLocal instruction with `effects: [{kind: 'Alias', from: {...operand}, into: {...lvalue}}]`. The Rust version uses `effects: None`. This means the phi replacement instruction in Rust lacks the aliasing effect that tells downstream passes the lvalue aliases the operand. This could affect downstream mutation/aliasing analysis.

3. **`set_terminal_fallthrough` does not handle the case where terminal has `terminalHasFallthrough` check**
   - Rust file: `compiler/crates/react_compiler_optimization/src/merge_consecutive_blocks.rs:148-155`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/HIR/MergeConsecutiveBlocks.ts:118-122`
   - The TS version uses `terminalHasFallthrough(terminal)` to check if the terminal has a fallthrough, then directly sets `terminal.fallthrough = merged.get(terminal.fallthrough)`. The Rust version uses `terminal_fallthrough` (from lowering crate) to read the fallthrough and then calls `set_terminal_fallthrough` to set it. The TS approach is simpler because it relies on `terminalHasFallthrough` typing. The Rust `set_terminal_fallthrough` only updates terminals that have named `fallthrough` fields -- terminals without fallthrough (like Goto, Return, etc.) are no-ops. The TS `terminalHasFallthrough` serves as a guard so `terminal.fallthrough` is only accessed on terminals that have one. The Rust approach is functionally equivalent but the fallthrough is read from `terminal_fallthrough` and then separately set via `set_terminal_fallthrough`, introducing a double-dispatch pattern.

4. **Fallthrough update: Rust reads `terminal_fallthrough()` then writes via `set_terminal_fallthrough`; TS reads and writes `terminal.fallthrough` directly**
   - Rust file: `compiler/crates/react_compiler_optimization/src/merge_consecutive_blocks.rs:148-155`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/HIR/MergeConsecutiveBlocks.ts:118-122`
   - If `terminal_fallthrough` and `set_terminal_fallthrough` disagree on which terminals have fallthroughs, there could be a bug. The Rust `terminal_fallthrough` function (from the lowering crate) and `set_terminal_fallthrough` (local) must be kept in sync.

## Minor Issues

1. **`shift_remove` vs `delete` for block removal**
   - Rust file: `compiler/crates/react_compiler_optimization/src/merge_consecutive_blocks.rs:120`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/HIR/MergeConsecutiveBlocks.ts:104`
   - The Rust version uses `shift_remove` on IndexMap (preserves order of remaining elements). The TS version uses `Map.delete`. Functionally equivalent.

2. **`phi.operands.shift_remove` vs `phi.operands.delete` for phi update**
   - Rust file: `compiler/crates/react_compiler_optimization/src/merge_consecutive_blocks.rs:139`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/HIR/MergeConsecutiveBlocks.ts:112`
   - Same pattern, using IndexMap operations in Rust vs Map operations in TS.

3. **Block kind check uses `BlockKind::Block` enum vs `'block'` string**
   - Rust file: `compiler/crates/react_compiler_optimization/src/merge_consecutive_blocks.rs:47`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/HIR/MergeConsecutiveBlocks.ts:52`
   - Standard enum vs string literal difference. Functionally equivalent.

4. **Predecessor access: `block.preds.iter().next().unwrap()` vs `Array.from(block.preds)[0]!`**
   - Rust file: `compiler/crates/react_compiler_optimization/src/merge_consecutive_blocks.rs:52`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/HIR/MergeConsecutiveBlocks.ts:58`
   - Different idioms for accessing the first element of a set. Functionally equivalent.

5. **`eval_order` from predecessor's terminal used for phi instructions**
   - Rust file: `compiler/crates/react_compiler_optimization/src/merge_consecutive_blocks.rs:68`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/HIR/MergeConsecutiveBlocks.ts:88`
   - The Rust version uses `func.body.blocks[&pred_id].terminal.evaluation_order()`. The TS version uses `predecessor.terminal.id`. These should be equivalent (both represent the evaluation order/instruction ID of the terminal).

## Architectural Differences

1. **Instructions stored in flat table; phi replacement creates new instructions and pushes to table**
   - Rust file: `compiler/crates/react_compiler_optimization/src/merge_consecutive_blocks.rs:107-109`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/HIR/MergeConsecutiveBlocks.ts:87-98`
   - In Rust, new instructions are pushed to `func.instructions` and their `InstructionId` (index) is recorded. In TS, instructions are created inline and pushed to the block's instruction array directly.

2. **`Place` does not have `kind: 'Identifier'` field**
   - Rust file: `compiler/crates/react_compiler_optimization/src/merge_consecutive_blocks.rs:91-96`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/HIR/MergeConsecutiveBlocks.ts:80-86`
   - The TS Place includes `kind: 'Identifier'`. The Rust Place does not have this discriminator.

3. **`HashMap` for `MergedBlocks` vs ES `Map`**
   - Rust file: `compiler/crates/react_compiler_optimization/src/merge_consecutive_blocks.rs:160`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/HIR/MergeConsecutiveBlocks.ts:126`
   - Standard collection difference.

## Missing TypeScript Features

1. **Recursive merge into inner function expressions and object methods**
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/HIR/MergeConsecutiveBlocks.ts:39-46`
   - The Rust version does not recurse into inner functions. This is a missing feature.
