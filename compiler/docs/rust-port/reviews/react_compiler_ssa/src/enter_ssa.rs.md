# Review: react_compiler_ssa/src/enter_ssa.rs

## Corresponding TypeScript source
- `compiler/packages/babel-plugin-react-compiler/src/SSA/EnterSSA.ts`
- `compiler/packages/babel-plugin-react-compiler/src/HIR/visitors.ts` (for visitor functions)

## Summary
The Rust implementation is a faithful port of the TypeScript SSA construction algorithm. The core SSABuilder logic (define/get places, phi construction, incomplete phi handling, block sealing) is correctly translated. The main divergences are architectural (arena-based function handling, ID-based maps, separate env parameter) and structural adaptations for Rust's borrow checker.

## Major Issues
None.

## Moderate Issues

1. **Inner function context mapping order differs from TypeScript**: enter_ssa.rs:695-713
   - **TS**: `mapInstructionOperands(instr, place => builder.getPlace(place))` (EnterSSA.ts:280) calls the visitor which maps FunctionExpression/ObjectMethod context places as part of the operand traversal (visitors.ts:591-596).
   - **Rust**: Context places for function expressions are mapped separately BEFORE `map_instruction_operands` is called (enter_ssa.rs:702-708). The `map_instruction_operands` function explicitly skips FunctionExpression/ObjectMethod (lines 148-152).
   - **Impact**: The ordering of context place mapping relative to other instruction operands differs, but the end result is the same. `get_place` only reads existing definitions and doesn't mutate state that other operand reads depend on, so this should not cause behavioral differences.

2. **`definePlace` for undefined identifiers throws CompilerError.throwTodo in TS, returns Err in Rust**: enter_ssa.rs:416-428 vs EnterSSA.ts:102-108
   - **TS**: Uses `CompilerError.throwTodo` with `reason`, `description`, `loc`, `suggestions: null`.
   - **Rust**: Returns `Err(CompilerDiagnostic::new(...))` with `ErrorCategory::Todo` and attaches a `CompilerDiagnosticDetail::Error`.
   - **Impact**: Functionally equivalent. The TS throws an exception that will be caught by the pipeline's error handler. The Rust returns an error that will be propagated via `?`.

3. **`getIdAt` unsealed check differs in fallback behavior**: enter_ssa.rs:487-488 vs EnterSSA.ts:153
   - **TS**: `this.unsealedPreds.get(block)! > 0` uses non-null assertion (`!`), which will throw if the block is not in the map.
   - **Rust**: `self.unsealed_preds.get(&block_id).copied().unwrap_or(0)` defaults to 0 if not found.
   - **Impact**: If a block hasn't been encountered in successor handling yet, the TS code would panic, while the Rust code treats it as sealed (0 unsealed preds). This could lead to different behavior in edge cases, though in normal operation all blocks should be in the map.

4. **Phis are accumulated and applied in a separate post-processing step**: enter_ssa.rs:362, 564-568, 607-631
   - **TS**: `block.phis.add(phi)` directly adds phis to the block during `addPhi` (EnterSSA.ts:199).
   - **Rust**: Phis are accumulated in `builder.pending_phis: HashMap<BlockId, Vec<Phi>>` during `addPhi`, then applied to blocks in a separate `apply_pending_phis` function after `enter_ssa_impl` completes.
   - **Impact**: This is a borrow-checker workaround to avoid mutating block phis while iterating blocks. Should be functionally equivalent as long as no code during SSA construction reads block phis (which it doesn't).

5. **`SSABuilder.block_preds` caches predecessor relationships**: enter_ssa.rs:359, 367-371, 776
   - **TS**: Accesses `block.preds` directly from the block object.
   - **Rust**: Builds a `block_preds: HashMap<BlockId, Vec<BlockId>>` cache in the constructor and updates it when modifying preds (e.g., clearing inner function entry preds at line 776).
   - **Impact**: Could diverge if preds are modified and the cache isn't updated, but the code correctly updates the cache when needed.

## Minor Issues

1. **Copyright header missing**: enter_ssa.rs:1
   - The Rust file lacks the Meta copyright header present in the TypeScript file.

2. **`SSABuilder.print()` debug method missing**: EnterSSA.ts:218-237
   - The TS version has a `print()` method for debugging that outputs the state map.
   - The Rust version has no equivalent.

3. **`SSABuilder.enter()` replaced with manual save/restore**: enter_ssa.rs:740, 766 vs EnterSSA.ts:64-68
   - **TS**: Uses `enter(fn)` method which saves/restores `#current` around a callback.
   - **Rust**: Manually saves and restores `builder.current`.

4. **`nextSsaId` getter missing**: EnterSSA.ts:54-56
   - The TS version has a `get nextSsaId()` accessor.
   - The Rust version calls `env.next_identifier_id()` directly.

5. **`define_context` marked as dead code**: enter_ssa.rs:445-451
   - The method is marked `#[allow(dead_code)]` and is not called anywhere.
   - The TS version also defines `defineContext` (EnterSSA.ts:93-97) but doesn't call it.
   - Both versions define it for potential external use, but it's unused in the SSA pass itself.

6. **`addPhi` returns void in Rust, returns Identifier in TS**: enter_ssa.rs:532 vs EnterSSA.ts:186
   - **TS**: Returns `newPlace.identifier` and is used inline in `getIdAt` (line 183).
   - **Rust**: Returns `()` and `new_id` is returned separately from the call site.
   - Functionally equivalent, just different code organization.

7. **`IncompletePhi` uses owned Place values**: enter_ssa.rs:345-348 vs EnterSSA.ts:31-33
   - **TS**: Stores `Place` references.
   - **Rust**: Stores owned `Place` values (cheap since Place contains IdentifierId).

8. **`map_instruction_operands` callback signature differs**: enter_ssa.rs:16-19 vs visitors.ts:446-451
   - **TS**: `fn: (place: Place) => Place`
   - **Rust**: `&mut impl FnMut(&mut Place, &mut Environment)`
   - The Rust version passes `&mut Environment` to the callback because `builder.get_place` needs it.

9. **`map_instruction_lvalues` returns Result**: enter_ssa.rs:211-267 vs visitors.ts:420-444
   - **TS**: Takes `fn: (place: Place) => Place` (infallible).
   - **Rust**: Takes `&mut impl FnMut(&mut Place) -> Result<(), CompilerDiagnostic>` (fallible).
   - This is because `define_place` can return an error for undefined identifiers.

10. **Root function context check uses `is_empty()` vs `length === 0`**: enter_ssa.rs:658 vs EnterSSA.ts:263
    - Semantically equivalent, just idiomatic for each language.

## Architectural Differences

1. **Arena-based inner function handling with `std::mem::replace`**: enter_ssa.rs:756-764, 815-840
   - Inner functions are accessed via `env.functions[fid.0 as usize]`.
   - They are swapped out using `std::mem::replace` with a `placeholder_function()`, processed, then swapped back.
   - This pattern is necessary because Rust's borrow checker prevents mutating `env.functions` while holding a reference to an inner function.
   - TS accesses inner functions directly via `instr.value.loweredFunc.func` (EnterSSA.ts:287-308).

2. **`env` passed separately from `func`**: Throughout
   - **TS**: `env` is stored inside `SSABuilder` as `#env` (EnterSSA.ts:45).
   - **Rust**: `env: &mut Environment` is passed as a parameter to functions that need it.
   - This follows the Rust port architecture pattern of keeping `Environment` separate from `HirFunction`.

3. **Pending phis pattern**: enter_ssa.rs:362, 564-568, 607-631
   - Phis are collected in `builder.pending_phis` and applied in a post-processing step.
   - This avoids borrow conflicts that would arise from mutating block phis while iterating blocks.

4. **`processed_functions` tracking**: enter_ssa.rs:363, 724, 623-630
   - The Rust `SSABuilder` has a `processed_functions: Vec<FunctionId>` field used by `apply_pending_phis` to apply phis to inner function blocks.
   - TS doesn't need this since phis are added directly to blocks during construction.

5. **Instruction access via instruction table**: enter_ssa.rs:679-689
   - Rust accesses instructions via `func.instructions[instr_id.0 as usize]`.
   - TS iterates `block.instructions` directly as inline `Instruction` objects (EnterSSA.ts:279).

6. **`SSABuilder.states` uses `HashMap<BlockId, State>` instead of `Map<BasicBlock, State>`**: enter_ssa.rs:356 vs EnterSSA.ts:41
   - TS keys by `BasicBlock` object reference identity.
   - Rust keys by `BlockId` value.
   - Functionally equivalent since BlockId uniquely identifies blocks.

7. **`SSABuilder.unsealed_preds` uses `HashMap<BlockId, u32>` instead of `Map<BasicBlock, number>`**: enter_ssa.rs:358 vs EnterSSA.ts:43
   - Same pattern as `states` map.

8. **`State.defs` uses `HashMap<IdentifierId, IdentifierId>` instead of `Map<Identifier, Identifier>`**: enter_ssa.rs:351 vs EnterSSA.ts:36
   - Follows the arena ID pattern: instead of storing references to `Identifier` objects, stores copyable `IdentifierId` values.

9. **`each_terminal_successor` imported from `react_compiler_lowering`**: enter_ssa.rs:7
   - In TS, `eachTerminalSuccessor` is in `visitors.ts`.
   - In Rust, it's in the `react_compiler_lowering` crate.

## Missing from Rust Port

1. **`SSABuilder.print()` debug method**: EnterSSA.ts:218-237
   - Useful for debugging but not essential for functionality.

2. **`SSABuilder.enter()` method**: EnterSSA.ts:64-68
   - The Rust version uses manual save/restore instead, which is functionally equivalent.

3. **`nextSsaId` getter**: EnterSSA.ts:54-56
   - Not needed in Rust since `env.next_identifier_id()` is called directly.

## Additional in Rust Port

1. **`placeholder_function()` utility**: enter_ssa.rs:815-840
   - Used for the `std::mem::replace` pattern when processing inner functions.
   - No TS equivalent needed since TS can access inner functions without ownership issues.

2. **`apply_pending_phis` function**: enter_ssa.rs:613-631
   - Applies accumulated phis to blocks after SSA construction.
   - No TS equivalent needed since TS adds phis directly to blocks.

3. **`processed_functions` field in SSABuilder**: enter_ssa.rs:363
   - Tracks which inner functions were processed so their phis can be applied.
   - No TS equivalent needed.

4. **`block_preds` cache**: enter_ssa.rs:359, 367-371
   - Caches predecessor relationships to avoid repeated block lookups.
   - TS accesses `block.preds` directly.
