# Review: compiler/crates/react_compiler_optimization/src/inline_iifes.rs

## Corresponding TypeScript file(s)
- compiler/packages/babel-plugin-react-compiler/src/Inference/InlineImmediatelyInvokedFunctionExpressions.ts

## Summary
The Rust port is a faithful translation of the TS IIFE inlining pass. The core algorithm -- finding function expressions assigned to temporaries, detecting their use as IIFEs, and inlining their CFG -- is preserved. The main structural difference is how inner function blocks/instructions are transferred: the Rust version must drain inner function data from the function arena and remap instruction IDs due to the flat instruction table architecture, while the TS version directly moves block references. There are some behavioral differences around how the queue is managed (block IDs vs block references) and how operands are collected.

## Major Issues

1. **Queue iterates block IDs, not block objects -- may miss inlined blocks that were re-added**
   - Rust file: `compiler/crates/react_compiler_optimization/src/inline_iifes.rs:73`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Inference/InlineImmediatelyInvokedFunctionExpressions.ts:98`
   - The TS version pushes `continuationBlock` (the actual block object) to the queue, and iteration is over block objects. The Rust version pushes `continuation_block_id` and looks up the block from `func.body.blocks` each iteration. This works correctly because the continuation block is added to `func.body.blocks` before being pushed to the queue.

2. **`each_instruction_value_operand_ids` may be incomplete or diverge from TS `eachInstructionValueOperand`**
   - Rust file: `compiler/crates/react_compiler_optimization/src/inline_iifes.rs:423-630`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Inference/InlineImmediatelyInvokedFunctionExpressions.ts:234` (uses `eachInstructionValueOperand` from visitors)
   - The Rust version implements a custom `each_instruction_value_operand_ids` function that manually enumerates all instruction value variants. The TS version uses a shared `eachInstructionValueOperand` visitor. If new instruction value variants are added, the Rust function must be updated manually. Any missing variant would cause function expressions to not be removed from the `functions` map, potentially allowing incorrect inlining. The Rust version should ideally use a shared visitor from the HIR crate.

3. **`StoreContext` operand collection includes `lvalue.place.identifier` in Rust but TS `eachInstructionValueOperand` may differ**
   - Rust file: `compiler/crates/react_compiler_optimization/src/inline_iifes.rs:436-439`
   - The Rust version collects both `lvalue.place.identifier` and `val.identifier` for `StoreContext`. The TS `eachInstructionValueOperand` typically yields only the operand places (right-hand side values), not lvalues. If the TS visitor does not yield the StoreContext lvalue, this could cause a divergence where the Rust version removes function expressions from the `functions` map more aggressively.

## Moderate Issues

1. **Inner function block/instruction transfer uses drain + offset remapping**
   - Rust file: `compiler/crates/react_compiler_optimization/src/inline_iifes.rs:172-222`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Inference/InlineImmediatelyInvokedFunctionExpressions.ts:163-188`
   - The Rust version must drain blocks and instructions from the inner function in the arena, append instructions to the outer function's instruction table with an offset, and remap instruction IDs in each block. The TS version simply moves block references. This is a significant implementation difference but is necessary due to the flat instruction table architecture. The offset remapping at line 184 (`*iid = InstructionId(iid.0 + instr_offset)`) should be correct.

2. **`is_statement_block_kind` only checks `Block | Catch`, TS uses `isStatementBlockKind`**
   - Rust file: `compiler/crates/react_compiler_optimization/src/inline_iifes.rs:312-314`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Inference/InlineImmediatelyInvokedFunctionExpressions.ts:104`
   - The TS `isStatementBlockKind` is imported from HIR and may include additional block kinds beyond `block` and `catch`. If the TS function checks for more kinds, the Rust version would be more restrictive about which blocks can contain IIFEs.

3. **`promote_temporary` format differs from TS `promoteTemporary`**
   - Rust file: `compiler/crates/react_compiler_optimization/src/inline_iifes.rs:416-420`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Inference/InlineImmediatelyInvokedFunctionExpressions.ts:212` (uses `promoteTemporary` from HIR)
   - The Rust version generates names like `#t{decl_id}` using `IdentifierName::Promoted`. The TS version uses `promoteTemporary(result.identifier)` from the HIR module. The actual name format and identifier name kind may differ.

4. **Single-return path: Rust uses `LoadLocal` + `Goto` while TS does the same, but TS iterates over all blocks**
   - Rust file: `compiler/crates/react_compiler_optimization/src/inline_iifes.rs:189-219`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Inference/InlineImmediatelyInvokedFunctionExpressions.ts:163-184`
   - The TS version iterates `for (const block of body.loweredFunc.func.body.blocks.values())` and replaces *all* return terminals. Since `hasSingleExitReturnTerminal` already verified there's only one, this is safe. The Rust version does the same. Both are equivalent.

5. **Multi-return path: `rewrite_block` uses `EvaluationOrder(0)` for goto ID, TS uses `makeInstructionId(0)`**
   - Rust file: `compiler/crates/react_compiler_optimization/src/inline_iifes.rs:372-374`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Inference/InlineImmediatelyInvokedFunctionExpressions.ts:307-313`
   - The TS version uses `id: makeInstructionId(0)` for the goto terminal. The Rust version uses `id: ret_id` (the original return terminal's ID). This is a divergence -- the TS version explicitly sets the goto's `id` to 0, while the Rust version preserves the return terminal's ID.

6. **`rewrite_block` terminal ID: Rust preserves `ret_id`, TS uses `makeInstructionId(0)`**
   - Rust file: `compiler/crates/react_compiler_optimization/src/inline_iifes.rs:372`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Inference/InlineImmediatelyInvokedFunctionExpressions.ts:311`
   - In the multi-return rewrite path, the Rust version keeps the original return terminal's `id` for the new goto terminal. The TS version sets `id: makeInstructionId(0)`. These should be equivalent after `markInstructionIds` runs, but could cause intermediate state differences.

7. **`has_single_exit_return_terminal` iterates `func.body.blocks.values()` -- identical logic**
   - Rust file: `compiler/crates/react_compiler_optimization/src/inline_iifes.rs:317-333`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Inference/InlineImmediatelyInvokedFunctionExpressions.ts:267-277`
   - The TS version uses `hasReturn ||= block.terminal.kind === 'return'`. The Rust version uses `has_return = true` inside the `Return` match arm. These are logically equivalent.

## Minor Issues

1. **`GENERATED_SOURCE` import and usage for `DeclareLocal`**
   - Rust file: `compiler/crates/react_compiler_optimization/src/inline_iifes.rs:392`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Inference/InlineImmediatelyInvokedFunctionExpressions.ts:322`
   - Both use `GeneratedSource` / `GENERATED_SOURCE` for the `DeclareLocal` instruction location. Equivalent.

2. **`block_terminal_id` and `block_terminal_loc` extracted before modification**
   - Rust file: `compiler/crates/react_compiler_optimization/src/inline_iifes.rs:128-130`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Inference/InlineImmediatelyInvokedFunctionExpressions.ts:156-162`
   - The Rust version explicitly extracts `block.terminal.evaluation_order()` and `block.terminal.loc()` before modifying the block. The TS version accesses `block.terminal.id` and `block.terminal.loc` inline when constructing the new terminal. Equivalent behavior.

3. **`functions` map type: `HashMap<IdentifierId, FunctionId>` vs `Map<IdentifierId, FunctionExpression>`**
   - Rust file: `compiler/crates/react_compiler_optimization/src/inline_iifes.rs:64`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Inference/InlineImmediatelyInvokedFunctionExpressions.ts:87`
   - The TS version stores `FunctionExpression` values directly. The Rust version stores `FunctionId` and accesses the function via the arena. Expected architectural difference.

4. **Continuation block `phis` type: `Vec::new()` vs `new Set()`**
   - Rust file: `compiler/crates/react_compiler_optimization/src/inline_iifes.rs:142`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Inference/InlineImmediatelyInvokedFunctionExpressions.ts:143`
   - The Rust uses `Vec<Phi>` while TS uses `Set<Phi>`. Expected data structure difference.

5. **Continuation block `preds` type: `indexmap::IndexSet::new()` vs `new Set()`**
   - Rust file: `compiler/crates/react_compiler_optimization/src/inline_iifes.rs:143`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Inference/InlineImmediatelyInvokedFunctionExpressions.ts:144`
   - Expected data structure difference.

## Architectural Differences

1. **Inner function access via arena with `env.functions[inner_func_id.0 as usize]`**
   - Rust file: `compiler/crates/react_compiler_optimization/src/inline_iifes.rs:116`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Inference/InlineImmediatelyInvokedFunctionExpressions.ts:119`
   - TS accesses `body.loweredFunc.func` directly. Rust accesses via the function arena.

2. **Block and instruction draining from inner function**
   - Rust file: `compiler/crates/react_compiler_optimization/src/inline_iifes.rs:173-176,246-249`
   - The Rust version uses `inner_func.body.blocks.drain(..)` and `inner_func.instructions.drain(..)` to transfer ownership. The TS version simply iterates and moves references.

3. **Instruction ID remapping after transfer**
   - Rust file: `compiler/crates/react_compiler_optimization/src/inline_iifes.rs:184-186,256-258`
   - No equivalent in TS. This is necessary because the Rust flat instruction table requires adjusting InstructionIds when instructions from the inner function are appended to the outer function's instruction table.

4. **`each_instruction_value_operand_ids` is a local implementation instead of shared visitor**
   - Rust file: `compiler/crates/react_compiler_optimization/src/inline_iifes.rs:423-630`
   - TS file: uses `eachInstructionValueOperand` from `../HIR/visitors`
   - The Rust version implements its own operand collection function. This should ideally be a shared utility in the HIR crate.

## Missing TypeScript Features

1. **No `retainWhere` utility -- uses `block.instructions.retain()` directly**
   - Rust file: `compiler/crates/react_compiler_optimization/src/inline_iifes.rs:295-298`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Inference/InlineImmediatelyInvokedFunctionExpressions.ts:247-249`
   - The TS uses a utility `retainWhere`. The Rust uses `Vec::retain`. Functionally equivalent.

2. **No assertion/validation helpers called after cleanup**
   - The TS version implicitly validates structure through the type system. The Rust version does not call validation helpers after the cleanup steps.
