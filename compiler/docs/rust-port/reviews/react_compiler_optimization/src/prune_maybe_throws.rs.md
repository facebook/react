# Review: compiler/crates/react_compiler_optimization/src/prune_maybe_throws.rs

## Corresponding TypeScript file(s)
- compiler/packages/babel-plugin-react-compiler/src/Optimization/PruneMaybeThrows.ts

## Summary
The Rust port faithfully translates the PruneMaybeThrows pass. The core logic -- identifying blocks with `MaybeThrow` terminals whose instructions cannot throw, nulling out the handler, and then cleaning up the CFG -- is well preserved. The main differences are in error handling approach, missing debug assertions, and an extra `mark_predecessors` call.

## Major Issues
None.

## Moderate Issues

1. **Missing `assertConsistentIdentifiers(fn)` and `assertTerminalSuccessorsExist(fn)`**
   - Rust file: `compiler/crates/react_compiler_optimization/src/prune_maybe_throws.rs` (absent)
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Optimization/PruneMaybeThrows.ts:72-73`
   - The TS version calls these validation assertions at the end of the pass. The Rust version does not. This could mask bugs during development.

2. **Extra `mark_predecessors` call at the end of Rust version**
   - Rust file: `compiler/crates/react_compiler_optimization/src/prune_maybe_throws.rs:84`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Optimization/PruneMaybeThrows.ts` (absent)
   - The Rust version calls `mark_predecessors(&mut func.body)` at the end of `prune_maybe_throws` (after phi operand rewriting). The TS version does not call `markPredecessors` at the end. The TS relies on `mergeConsecutiveBlocks` (which internally calls `markPredecessors`) to leave predecessors correct. The extra call in Rust is harmless but diverges from TS.

3. **Missing `markPredecessors` call before phi rewriting in TS, but present implicitly via `mergeConsecutiveBlocks`**
   - Rust file: `compiler/crates/react_compiler_optimization/src/prune_maybe_throws.rs:38-39`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Optimization/PruneMaybeThrows.ts:49-50`
   - The TS version does not call `markPredecessors` before `mergeConsecutiveBlocks`. The Rust version does not call it explicitly before `merge_consecutive_blocks` either, but `merge_consecutive_blocks` itself calls `mark_predecessors` internally. Both should have correct predecessors after merge. However, the Rust version uses `block.preds` during phi rewriting (line 49), which happens after `merge_consecutive_blocks`. Since `merge_consecutive_blocks` calls `mark_predecessors` internally, this should be correct.

4. **`instruction_may_throw` accesses `instr.value` directly in Rust vs TS passing `instr` and checking `instr.value.kind`**
   - Rust file: `compiler/crates/react_compiler_optimization/src/prune_maybe_throws.rs:124-131`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Optimization/PruneMaybeThrows.ts:96-107`
   - Both check the same three instruction kinds: `Primitive`, `ArrayExpression`, `ObjectExpression`. The Rust version uses `match &instr.value` while TS uses `switch (instr.value.kind)`. Functionally equivalent.

5. **`pruneMaybeThrowsImpl` accesses instructions differently**
   - Rust file: `compiler/crates/react_compiler_optimization/src/prune_maybe_throws.rs:91,101-102`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Optimization/PruneMaybeThrows.ts:84-85`
   - The TS version calls `block.instructions.some(instr => instructionMayThrow(instr))` where `block.instructions` is an array of `Instruction` objects. The Rust version calls `block.instructions.iter().any(|instr_id| instruction_may_throw(&instructions[instr_id.0 as usize]))` where `block.instructions` is a `Vec<InstructionId>` (indices into the flat table). This is an expected architectural difference.

## Minor Issues

1. **Return type: `Result<(), CompilerDiagnostic>` vs `void`**
   - Rust file: `compiler/crates/react_compiler_optimization/src/prune_maybe_throws.rs:29`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Optimization/PruneMaybeThrows.ts:38`
   - The Rust version returns a `Result` to propagate the invariant error for missing phi predecessor mappings. The TS version throws via `CompilerError.invariant`. This follows the Rust error handling pattern from the architecture doc.

2. **Invariant error for missing predecessor mapping: Rust returns `Err`, TS throws**
   - Rust file: `compiler/crates/react_compiler_optimization/src/prune_maybe_throws.rs:51-64`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Optimization/PruneMaybeThrows.ts:58-64`
   - The Rust version uses `Err(CompilerDiagnostic::new(...))` with `ok_or_else`. The TS version uses `CompilerError.invariant(mappedTerminal != null, {...})`. Both produce an error with category Invariant, reason, and description. The error messages are similar but not identical.

3. **TS error description includes `printPlace(phi.place)`, Rust does not**
   - Rust file: `compiler/crates/react_compiler_optimization/src/prune_maybe_throws.rs:56-58`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Optimization/PruneMaybeThrows.ts:60-63`
   - The TS version includes `for phi ${printPlace(phi.place)}` in the description. The Rust version only includes block IDs. Minor diagnostic difference.

4. **Phi rewriting uses two-phase collect/apply pattern**
   - Rust file: `compiler/crates/react_compiler_optimization/src/prune_maybe_throws.rs:44-81`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Optimization/PruneMaybeThrows.ts:53-69`
   - The Rust version collects updates into vectors (`phi_updates`) then applies them in a separate loop. The TS version mutates phi operands inline during iteration using `phi.operands.delete(predecessor)` and `phi.operands.set(mappedTerminal, operand)`. The Rust two-phase approach is necessary to avoid borrowing conflicts.

5. **`GENERATED_SOURCE` import location differs**
   - Rust file: `compiler/crates/react_compiler_optimization/src/prune_maybe_throws.rs:17`
   - The Rust version imports `GENERATED_SOURCE` from `react_compiler_diagnostics`. The TS version imports `GeneratedSource` from the HIR module.

## Architectural Differences

1. **Instruction access via flat table with `InstructionId` indices**
   - Rust file: `compiler/crates/react_compiler_optimization/src/prune_maybe_throws.rs:91,102`
   - Expected per architecture doc.

2. **`HashMap<BlockId, BlockId>` for terminal mapping vs `Map<BlockId, BlockId>`**
   - Rust file: `compiler/crates/react_compiler_optimization/src/prune_maybe_throws.rs:90`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Optimization/PruneMaybeThrows.ts:78`
   - Standard collection difference.

3. **`func.body.blocks = get_reverse_postordered_blocks(...)` vs `reversePostorderBlocks(fn.body)` in-place mutation**
   - Rust file: `compiler/crates/react_compiler_optimization/src/prune_maybe_throws.rs:34`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Optimization/PruneMaybeThrows.ts:45`
   - Expected difference.

## Missing TypeScript Features

1. **`assertConsistentIdentifiers(fn)` and `assertTerminalSuccessorsExist(fn)` are not called**
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Optimization/PruneMaybeThrows.ts:72-73`
   - Debug validation assertions are missing from the Rust version.

2. **`printPlace(phi.place)` in error description**
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Optimization/PruneMaybeThrows.ts:62`
   - The Rust version does not include the phi place in the error description.
