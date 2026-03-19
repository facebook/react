# Review: compiler/crates/react_compiler_ssa/src/eliminate_redundant_phi.rs

## Corresponding TypeScript file(s)
- compiler/packages/babel-plugin-react-compiler/src/SSA/EliminateRedundantPhi.ts

## Summary
The Rust implementation closely follows the TypeScript version. The core algorithm (iterative fixpoint elimination of redundant phis with back-edge detection) is faithfully reproduced. The main differences are structural: the Rust version manually implements instruction/terminal operand/lvalue iteration instead of using shared visitor functions, and uses the arena/ID-based architecture for inner function handling. There are a few behavioral divergences worth noting.

## Major Issues

None identified.

## Moderate Issues

1. **Phi removal strategy differs**: In TS (EliminateRedundantPhi.ts:108), redundant phis are removed from the `Set` via `block.phis.delete(phi)` during iteration (safe because JS `Set` supports deletion during `for...of`). In Rust (eliminate_redundant_phi.rs:417-443), indices of redundant phis are collected, then removed in reverse order via `block.phis.remove(idx)`. This is functionally equivalent but the `Vec::remove` operation is O(n) for each removal, potentially making it O(n^2) for blocks with many phis. Not a correctness issue but a performance concern.

2. **`rewrite_instruction_lvalues` handles DeclareContext/StoreContext lvalues, matching `eachInstructionLValue` (used in TS EliminateRedundantPhi) but differing from `mapInstructionLValues` (used in TS EnterSSA)**: In TS EliminateRedundantPhi.ts:113, `eachInstructionLValue` is used, which yields `DeclareContext`/`StoreContext` lvalue places (visitors.ts:66-71). The Rust `rewrite_instruction_lvalues` (eliminate_redundant_phi.rs:62-69) correctly handles these. This is correct behavior for this pass.

3. **`rewrite_instruction_operands` for StoreContext maps `lvalue.place` as an operand**: In Rust (eliminate_redundant_phi.rs:168-170), `StoreContext` rewrites both `lvalue.place` and `value`. In TS (visitors.ts:122-126 via `eachInstructionOperand`/`eachInstructionValueOperand`), `StoreContext` also yields both `lvalue.place` and `value`. This matches correctly. However, in the TS `mapInstructionOperands` (visitors.ts:505-508) the same is done. Consistent.

4. **DEBUG validation block missing**: The TS version (EliminateRedundantPhi.ts:151-166) has a `DEBUG` flag-guarded validation block that checks all remaining phis and their operands are not in the rewrite table. The Rust version has no equivalent debug validation.
   - Location: eliminate_redundant_phi.rs (missing, would be after line 497)
   - TS location: EliminateRedundantPhi.ts:151-166

## Minor Issues

1. **Loop structure**: TS uses `do { ... } while (rewrites.size > size && hasBackEdge)` (EliminateRedundantPhi.ts:60,149). Rust uses `loop { ... if !(rewrites.len() > size && has_back_edge) { break; } }` (eliminate_redundant_phi.rs:389,494-496). In TS, `size` is initialized to `rewrites.size` before the do-while, then re-assigned at the start of the loop body. In Rust, `size` is uninitialized and set at the start of the loop body. Both are functionally equivalent since `size` is always set at the top of each iteration.

2. **`sharedRewrites` parameter**: In TS (EliminateRedundantPhi.ts:41), the function accepts an optional `sharedRewrites` parameter. In Rust (eliminate_redundant_phi.rs:369-372), the public entry point always creates a new `HashMap`, but the inner `eliminate_redundant_phi_impl` accepts `&mut HashMap` and is called recursively with the shared map. This is functionally equivalent since the TS passes `rewrites` to recursive calls on inner functions (line 134).

3. **Comment/documentation**: TS has a detailed doc comment explaining the algorithm (EliminateRedundantPhi.ts:24-37). Rust has no equivalent documentation.
   - Location: eliminate_redundant_phi.rs:369

4. **Copyright header missing**: The Rust file lacks the Meta copyright header present in the TS file (EliminateRedundantPhi.ts:1-6).
   - Location: eliminate_redundant_phi.rs:1

5. **`rewrite_place` takes `&mut Place` and `&HashMap`**: In TS (EliminateRedundantPhi.ts:169-177), `rewritePlace` takes `Place` (by reference since JS objects are references) and `Map<Identifier, Identifier>`. The TS looks up by `place.identifier` (the `Identifier` object, using reference identity via `Map`). The Rust version looks up by `place.identifier` which is an `IdentifierId` (a copyable ID). This is the expected arena pattern.
   - Location: eliminate_redundant_phi.rs:12-16

## Architectural Differences

1. **Arena-based inner function handling**: In TS (EliminateRedundantPhi.ts:124), the inner function is accessed directly via `instr.value.loweredFunc.func`. In Rust (eliminate_redundant_phi.rs:461-486), the inner function is accessed via `env.functions[fid.0 as usize]`, using `std::mem::replace` with a `placeholder_function()` to temporarily take ownership for recursive processing.
   - TS location: EliminateRedundantPhi.ts:120-135
   - Rust location: eliminate_redundant_phi.rs:461-486

2. **`rewrites` map uses `IdentifierId` keys**: TS uses `Map<Identifier, Identifier>` (reference identity). Rust uses `HashMap<IdentifierId, IdentifierId>` (value identity via arena IDs).
   - TS location: EliminateRedundantPhi.ts:43-44
   - Rust location: eliminate_redundant_phi.rs:370

3. **Instruction access via flat instruction table**: TS iterates `block.instructions` which are inline `Instruction` objects. Rust iterates `block.instructions` as `Vec<InstructionId>` and indexes into `func.instructions[instr_id.0 as usize]`.
   - Rust location: eliminate_redundant_phi.rs:446-455

4. **Phi identity**: TS phi redundancy check compares `operand.identifier.id` (the numeric `IdentifierId`). Rust compares `operand.identifier` directly (which is `IdentifierId`). Equivalent.
   - TS location: EliminateRedundantPhi.ts:84-85
   - Rust location: eliminate_redundant_phi.rs:422-423

5. **Manual visitor functions instead of shared visitor helpers**: The Rust file implements `rewrite_instruction_lvalues`, `rewrite_instruction_operands`, `rewrite_terminal_operands`, and `rewrite_pattern_lvalues` inline, rather than using shared visitor functions like the TS `eachInstructionLValue`, `eachInstructionOperand`, and `eachTerminalOperand` from `visitors.ts`. This is a structural choice that duplicates logic but avoids borrow checker issues.
   - Rust location: eliminate_redundant_phi.rs:12-363

6. **Phi operands iteration**: TS uses `phi.operands.forEach` (Map iteration). Rust uses `phi.operands.iter_mut()` (IndexMap iteration).
   - TS location: EliminateRedundantPhi.ts:79
   - Rust location: eliminate_redundant_phi.rs:410-413

## Missing TypeScript Features

1. **`RewriteInstructionKindsBasedOnReassignment`**: The TS SSA module exports `rewriteInstructionKindsBasedOnReassignment` from `index.ts` (line 10). This pass has no equivalent in the Rust `react_compiler_ssa` crate. This may be intentional if the pass has not yet been ported.
   - TS location: compiler/packages/babel-plugin-react-compiler/src/SSA/index.ts:10
   - Rust location: compiler/crates/react_compiler_ssa/src/lib.rs (not present)
