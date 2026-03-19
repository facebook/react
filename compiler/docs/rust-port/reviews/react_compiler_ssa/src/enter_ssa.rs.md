# Review: compiler/crates/react_compiler_ssa/src/enter_ssa.rs

## Corresponding TypeScript file(s)
- compiler/packages/babel-plugin-react-compiler/src/SSA/EnterSSA.ts
- compiler/packages/babel-plugin-react-compiler/src/HIR/visitors.ts (for `mapInstructionOperands`, `mapInstructionLValues`, `mapTerminalOperands`, `eachTerminalSuccessor`)

## Summary
The Rust implementation is a faithful port of the TypeScript SSA construction algorithm. The core SSABuilder logic (define/get places, phi construction, incomplete phi handling, block sealing) is correctly translated. The main divergences are architectural (arena-based function handling, ID-based maps, separate env parameter) and a few ordering/structural differences in how inner function contexts and operands are processed. There is one potentially significant logic difference in operand-vs-lvalue processing order for inner function context places.

## Major Issues

1. **Inner function context places are mapped BEFORE other operands, while TS maps them AS PART OF operands**: In TS (EnterSSA.ts:280), `mapInstructionOperands(instr, place => builder.getPlace(place))` is called, which internally maps FunctionExpression/ObjectMethod context places (visitors.ts:591-596) as part of the operand mapping. In Rust (enter_ssa.rs:702-708), context places for function expressions are mapped SEPARATELY and BEFORE `map_instruction_operands` is called (which skips FunctionExpression/ObjectMethod context at lines 148-152). The end result is the same (context places are mapped via `builder.get_place` before lvalues are defined), but the ordering of context place mapping relative to other operand mappings within the same instruction differs. In TS, context is mapped during the operand sweep (after other operands like callee/args in the switch statement order). In Rust, context is mapped first. This should not cause behavioral differences since `get_place` only reads from existing definitions and doesn't mutate any state that other operand reads depend on.
   - TS location: EnterSSA.ts:280 + visitors.ts:591-596
   - Rust location: enter_ssa.rs:695-713

2. **`enter_ssa_impl` passes `root_entry` (outer function's entry) to inner function recursion**: Both TS (EnterSSA.ts:307) and Rust (enter_ssa.rs:761) pass the outer `rootEntry` when recursing into inner functions. This means the `block_id == root_entry` check (Rust line 657) will never match for inner function blocks, so inner function params and context won't be processed in the `if block_id == root_entry` block. In TS, inner function params are handled inside `builder.enter()` (line 297-306), separate from the `blockId === rootEntry` check. In Rust, inner function params are handled at lines 743-753, also separate. So both correctly handle inner function params outside the rootEntry check. This is consistent behavior.

## Moderate Issues

1. **`define_context` is marked `#[allow(dead_code)]`**: The `define_context` method (enter_ssa.rs:445-451) is not called anywhere in the Rust code. In TS (EnterSSA.ts:93-97), `defineContext` is also defined but looking at the EnterSSA code, it is not called either in the TS SSA pass itself. It appears to be defined for potential external use. The `#[allow(dead_code)]` annotation confirms it's unused.
   - Rust location: enter_ssa.rs:445-451
   - TS location: EnterSSA.ts:93-97

2. **`SSABuilder.states` uses `HashMap<BlockId, State>` instead of identity-based `Map<BasicBlock, State>`**: In TS (EnterSSA.ts:41), `#states` is `Map<BasicBlock, State>` keyed by object reference. In Rust (enter_ssa.rs:356), `states` is `HashMap<BlockId, State>`. Since BlockId is unique per block, this is equivalent.
   - TS location: EnterSSA.ts:41
   - Rust location: enter_ssa.rs:356

3. **`SSABuilder.unsealed_preds` uses `HashMap<BlockId, u32>` instead of `Map<BasicBlock, number>`**: In TS (EnterSSA.ts:43), `unsealedPreds` is `Map<BasicBlock, number>`. In Rust (enter_ssa.rs:358), it's `HashMap<BlockId, u32>`. The TS version uses the `BasicBlock` object reference as key; the Rust version uses `BlockId`. However, in the TS `enterSSAImpl` (line 315-327), the successor handling looks up by `BasicBlock` object (`output = func.body.blocks.get(outputId)!`), while in Rust (enter_ssa.rs:789-806), successor handling uses `BlockId` directly without looking up the block object. This is functionally equivalent since BlockId uniquely identifies blocks.
   - TS location: EnterSSA.ts:43, 314-327
   - Rust location: enter_ssa.rs:358, 787-806

4. **`getIdAt` handles missing preds differently**: In TS (EnterSSA.ts:140), the check is `block.preds.size == 0` (accessing the actual block's preds). In Rust (enter_ssa.rs:476-485), the check uses `self.block_preds.get(&block_id)` which is a cached copy of preds. This could diverge if preds are modified after the cache is built (e.g., the inner function entry pred manipulation at line 736). However, the Rust code updates `block_preds` when clearing inner function entry preds (line 776: `builder.block_preds.insert(inner_entry, Vec::new())`), so this should stay synchronized.
   - TS location: EnterSSA.ts:140
   - Rust location: enter_ssa.rs:476-485

5. **`getIdAt` unsealed check**: In TS (EnterSSA.ts:153), `this.unsealedPreds.get(block)! > 0` uses non-null assertion. In Rust (enter_ssa.rs:487), `self.unsealed_preds.get(&block_id).copied().unwrap_or(0)` defaults to 0 if not found. The TS code will throw if `unsealedPreds` doesn't have the block (since it uses `!`), while the Rust code treats missing entries as 0 (sealed). This is a behavioral difference: if a block hasn't been encountered in successor handling yet, the Rust code will treat it as sealed, while the TS code would panic.
   - TS location: EnterSSA.ts:153
   - Rust location: enter_ssa.rs:487-488

6. **`apply_pending_phis` is a separate post-processing step**: In TS (EnterSSA.ts:199), `block.phis.add(phi)` directly adds phis to the block during `addPhi`. In Rust (enter_ssa.rs:532-568, 607-631), phis are accumulated in `builder.pending_phis` during `addPhi`, then applied to blocks in a separate `apply_pending_phis` step after `enter_ssa_impl` completes. This avoids borrow conflicts (can't mutate block phis while iterating blocks). This could cause behavioral differences if any code during SSA construction reads block phis (which it doesn't in the current implementation, so this should be safe).
   - TS location: EnterSSA.ts:199
   - Rust location: enter_ssa.rs:564-568, 607-631

7. **Error handling for `definePlace` undefined identifier**: In TS (EnterSSA.ts:102-108), `CompilerError.throwTodo` is used with `reason`, `description`, `loc`, and `suggestions: null`. In Rust (enter_ssa.rs:420-428), `CompilerDiagnostic::new` with `ErrorCategory::Todo` is used, and a `CompilerDiagnosticDetail::Error` is attached. The Rust version uses `old_place.loc` while the TS uses `oldPlace.loc`. These should be equivalent. The Rust identifier printing uses manual formatting (`format!("{}${}", name.value(), old_id.0)`) while TS uses `printIdentifier(oldId)`.
   - TS location: EnterSSA.ts:102-108
   - Rust location: enter_ssa.rs:416-428

8. **`addPhi` returns void in Rust, returns `Identifier` in TS**: In TS (EnterSSA.ts:186), `addPhi` returns `newPlace.identifier`. In Rust (enter_ssa.rs:532), `add_phi` returns nothing. The TS return value is used in `getIdAt` (line 183: `return this.addPhi(...)`) as a convenience. In Rust (enter_ssa.rs:528-529), `add_phi` is called as a statement and `new_id` is returned separately. Functionally equivalent.
   - TS location: EnterSSA.ts:186, 183, 200
   - Rust location: enter_ssa.rs:528-529, 532

9. **Root function context check uses `is_empty()` vs `length === 0`**: In TS (EnterSSA.ts:263), `func.context.length === 0` is checked. In Rust (enter_ssa.rs:658), `func.context.is_empty()` is checked. Equivalent.
   - TS location: EnterSSA.ts:263
   - Rust location: enter_ssa.rs:658

## Minor Issues

1. **`SSABuilder.print()` / debug method missing**: TS has a `print()` method (EnterSSA.ts:218-237) for debugging. Rust has no equivalent.
   - TS location: EnterSSA.ts:218-237

2. **`SSABuilder.enter()` replaced with manual save/restore**: TS uses `enter(fn)` (EnterSSA.ts:64-68) which saves/restores `#current` around a callback. Rust manually saves and restores `builder.current` (enter_ssa.rs:740, 766).
   - TS location: EnterSSA.ts:64-68
   - Rust location: enter_ssa.rs:740, 766

3. **`nextSsaId` getter missing**: TS has `get nextSsaId()` (EnterSSA.ts:54-56). Rust has no equivalent accessor since `env.next_identifier_id()` is called directly.
   - TS location: EnterSSA.ts:54-56

4. **`State.defs` uses `HashMap<IdentifierId, IdentifierId>` instead of `Map<Identifier, Identifier>`**: Consistent with the arena ID pattern.
   - TS location: EnterSSA.ts:36
   - Rust location: enter_ssa.rs:351

5. **`IncompletePhi` uses owned `Place` values**: In TS (EnterSSA.ts:31-33), `IncompletePhi` has `oldPlace: Place` and `newPlace: Place` where Place is an object reference. In Rust (enter_ssa.rs:345-348), both are owned `Place` values (cheap since Place contains IdentifierId).
   - TS location: EnterSSA.ts:31-33
   - Rust location: enter_ssa.rs:345-348

6. **Copyright header missing**: The Rust file lacks the Meta copyright header.
   - Location: enter_ssa.rs:1

7. **`block_preds` is built from block data in constructor**: In TS, `#blocks` stores the `Map<BlockId, BasicBlock>` directly. In Rust, `block_preds` extracts just the pred relationships into a separate `HashMap<BlockId, Vec<BlockId>>`. This avoids needing to borrow the full blocks map.
   - TS location: EnterSSA.ts:44, 49-51
   - Rust location: enter_ssa.rs:359, 367-371

8. **`map_instruction_operands` takes `&mut Environment` in callback**: In TS (visitors.ts:446-451), `mapInstructionOperands` takes `fn: (place: Place) => Place`. In Rust (enter_ssa.rs:16-19), the callback is `&mut impl FnMut(&mut Place, &mut Environment)`, passing env through. This is needed because Rust's `builder.get_place` needs `&mut Environment`.
   - TS location: visitors.ts:446-451
   - Rust location: enter_ssa.rs:16-19

9. **`map_instruction_lvalues` returns `Result`**: In TS (visitors.ts:420-444), `mapInstructionLValues` takes `fn: (place: Place) => Place` (infallible). In Rust (enter_ssa.rs:211-267), it takes `&mut impl FnMut(&mut Place) -> Result<(), CompilerDiagnostic>` (fallible). This is because `define_place` can return an error for undefined identifiers.
   - TS location: visitors.ts:420-444
   - Rust location: enter_ssa.rs:211-267

## Architectural Differences

1. **Arena-based inner function handling with `std::mem::replace`**: Inner functions are swapped out of `env.functions` via `placeholder_function()`, processed, then swapped back. This pattern appears at enter_ssa.rs:756-764.
   - TS location: EnterSSA.ts:287-308
   - Rust location: enter_ssa.rs:756-764

2. **`env` passed separately from `func`**: TS stores `env` inside `SSABuilder` (EnterSSA.ts:45, 49). Rust passes `env: &mut Environment` as a parameter to methods that need it.
   - TS location: EnterSSA.ts:45
   - Rust location: enter_ssa.rs:398, 411, etc.

3. **Pending phis pattern**: Phis are collected in `builder.pending_phis` and applied after the main traversal (enter_ssa.rs:564-568, 607-631), instead of being added directly to blocks during construction (TS EnterSSA.ts:199). This is a borrow-checker workaround since mutating block phis while iterating blocks would cause borrow conflicts in Rust.
   - TS location: EnterSSA.ts:199
   - Rust location: enter_ssa.rs:362, 564-568, 607-631

4. **`processed_functions` tracking**: The Rust `SSABuilder` has a `processed_functions: Vec<FunctionId>` field (enter_ssa.rs:363) used by `apply_pending_phis` to apply phis to inner function blocks. TS doesn't need this since phis are added directly to blocks.
   - Rust location: enter_ssa.rs:363, 623-630

5. **Instruction access via instruction table**: Rust accesses instructions via `func.instructions[instr_id.0 as usize]` (enter_ssa.rs:689). TS iterates `block.instructions` directly (EnterSSA.ts:279).
   - TS location: EnterSSA.ts:279
   - Rust location: enter_ssa.rs:679-689

6. **`placeholder_function()` utility**: Defined at enter_ssa.rs:815-840, used for `std::mem::replace` pattern. No TS equivalent needed.
   - Rust location: enter_ssa.rs:815-840

7. **`each_terminal_successor` imported from `react_compiler_lowering`**: In TS, `eachTerminalSuccessor` is from `visitors.ts`. In Rust, it's imported from the `react_compiler_lowering` crate (enter_ssa.rs:7).
   - TS location: visitors.ts:1022
   - Rust location: enter_ssa.rs:7

## Missing TypeScript Features

1. **`SSABuilder.print()` debug method**: TS has a `print()` method for debugging (EnterSSA.ts:218-237). No Rust equivalent.

2. **`SSABuilder.enter()` method**: TS has an `enter(fn)` method (EnterSSA.ts:64-68) for scoped current-block save/restore. Rust uses manual save/restore instead.
