# Review: react_compiler_ssa/src/eliminate_redundant_phi.rs

## Corresponding TypeScript source
- `compiler/packages/babel-plugin-react-compiler/src/SSA/EliminateRedundantPhi.ts`

## Summary
The Rust implementation closely follows the TypeScript version. The core algorithm (iterative fixpoint elimination of redundant phis with back-edge detection) is faithfully reproduced. The main differences are structural: the Rust version implements inline visitor functions instead of using shared visitor helpers, uses the arena/ID-based architecture for inner function handling, and uses a two-phase approach for phi removal.

## Major Issues
None.

## Moderate Issues

1. **Phi removal uses `Vec::remove` which is O(n) per removal**: eliminate_redundant_phi.rs:417-443
   - **TS**: Removes redundant phis from the `Set` via `block.phis.delete(phi)` during iteration (EliminateRedundantPhi.ts:108), which is O(1).
   - **Rust**: Collects indices of redundant phis in a `Vec<usize>`, then removes them in reverse order via `block.phis.remove(idx)`.
   - **Impact**: The `Vec::remove` operation shifts all subsequent elements, making it O(n) per removal. For blocks with many redundant phis, this could be O(n²). Not a correctness issue but a potential performance concern.
   - **Alternative**: Could use `retain` or swap-remove pattern for O(n) overall.

2. **DEBUG validation block missing**: eliminate_redundant_phi.rs (missing after line 497)
   - **TS**: Has a `DEBUG` flag-guarded validation block (EliminateRedundantPhi.ts:151-166) that checks all remaining phis and their operands are not in the rewrite table.
   - **Rust**: No equivalent debug validation.
   - **Impact**: Loss of debug-mode invariant checking. Not critical but useful for development.

## Minor Issues

1. **Copyright header missing**: eliminate_redundant_phi.rs:1
   - The Rust file lacks the Meta copyright header present in the TypeScript file (EliminateRedundantPhi.ts:1-6).

2. **Algorithm documentation missing**: eliminate_redundant_phi.rs:369
   - **TS**: Has a detailed doc comment explaining the algorithm (EliminateRedundantPhi.ts:24-37).
   - **Rust**: No equivalent documentation comment on the public function.

3. **Loop structure uses `loop` + `break` instead of `do...while`**: eliminate_redundant_phi.rs:389, 494-496
   - **TS**: `do { ... } while (rewrites.size > size && hasBackEdge)` (EliminateRedundantPhi.ts:60, 149).
   - **Rust**: `loop { ... if !(rewrites.len() > size && has_back_edge) { break; } }`.
   - **Impact**: Functionally equivalent. The `size` variable initialization differs slightly (uninitialized in Rust, initialized before the loop in TS) but both are set at the top of each iteration.

4. **`sharedRewrites` parameter handling**: eliminate_redundant_phi.rs:369-372 vs EliminateRedundantPhi.ts:40-41
   - **TS**: The public function accepts an optional `sharedRewrites?: Map<Identifier, Identifier>` parameter, defaulting to a new Map if not provided.
   - **Rust**: The public `eliminate_redundant_phi` always creates a new `HashMap` and calls `eliminate_redundant_phi_impl` with it. The inner function accepts `&mut HashMap` for recursive calls.
   - **Impact**: Functionally equivalent. The TS passes `rewrites` to recursive calls (line 134), which is what the Rust impl does.

5. **`rewrite_instruction_lvalues` handles DeclareContext/StoreContext lvalues**: eliminate_redundant_phi.rs:62-69
   - This is CORRECT behavior. The TS uses `eachInstructionLValue` (EliminateRedundantPhi.ts:113), which includes DeclareContext/StoreContext lvalue places (visitors.ts:66-71).
   - The Rust implementation correctly handles these cases.

6. **`rewrite_instruction_operands` for StoreContext maps both `lvalue.place` and `value`**: eliminate_redundant_phi.rs:168-170
   - This is CORRECT behavior matching the TS visitor `eachInstructionOperand` (visitors.ts:122-126).

## Architectural Differences

1. **Arena-based inner function handling**: eliminate_redundant_phi.rs:461-486
   - **TS**: Accesses inner function directly via `instr.value.loweredFunc.func` (EliminateRedundantPhi.ts:124).
   - **Rust**: Accesses via `env.functions[fid.0 as usize]`, uses `std::mem::replace` with `placeholder_function()` to temporarily take ownership for recursive processing.

2. **`rewrites` map uses `IdentifierId` keys**: eliminate_redundant_phi.rs:370
   - **TS**: `Map<Identifier, Identifier>` using reference identity (EliminateRedundantPhi.ts:43-44).
   - **Rust**: `HashMap<IdentifierId, IdentifierId>` using value equality via arena IDs.

3. **Instruction access via flat instruction table**: eliminate_redundant_phi.rs:446-455
   - **TS**: Iterates `block.instructions` which are inline `Instruction` objects (EliminateRedundantPhi.ts:112).
   - **Rust**: Iterates `block.instructions` as `Vec<InstructionId>` and indexes into `func.instructions[instr_id.0 as usize]`.

4. **Phi identity comparison**: eliminate_redundant_phi.rs:422-423 vs EliminateRedundantPhi.ts:84-85
   - **TS**: Compares `operand.identifier.id` (the numeric `IdentifierId` field inside `Identifier`).
   - **Rust**: Compares `operand.identifier` directly (which is the `IdentifierId` itself).
   - Semantically equivalent.

5. **Manual visitor functions instead of shared helpers**: eliminate_redundant_phi.rs:12-363
   - The Rust file implements `rewrite_place`, `rewrite_pattern_lvalues`, `rewrite_instruction_lvalues`, `rewrite_instruction_operands`, and `rewrite_terminal_operands` inline.
   - **TS**: Uses shared visitor functions `eachInstructionLValue`, `eachInstructionOperand`, `eachTerminalOperand` from `visitors.ts`.
   - **Rationale**: Rust's borrow checker makes it difficult to use shared visitor closures that mutate, so each pass implements its own visitors.
   - This duplicates logic across passes but is a pragmatic choice for the Rust port.

6. **Phi operands iteration**: eliminate_redundant_phi.rs:410-413
   - **TS**: Uses `phi.operands.forEach` (Map iteration, EliminateRedundantPhi.ts:79).
   - **Rust**: Uses `phi.operands.iter_mut()` (IndexMap iteration).
   - The use of `IndexMap` in Rust preserves insertion order, matching TS `Map` behavior.

7. **Context rewriting**: eliminate_redundant_phi.rs:470-475
   - **TS**: Iterates `context` and calls `rewritePlace(place, rewrites)` (EliminateRedundantPhi.ts:124-126).
   - **Rust**: Accesses `env.functions[fid.0 as usize].context` and rewrites in place.

## Missing from Rust Port

1. **DEBUG validation block**: EliminateRedundantPhi.ts:151-166
   - The TS version has debug-mode invariant checking for remaining phis.
   - Not critical for functionality but useful for debugging.

2. **Algorithm documentation**: EliminateRedundantPhi.ts:24-37
   - The TS has a detailed doc comment explaining the algorithm and referencing the paper it's based on.
   - The Rust version has no equivalent documentation.

## Additional in Rust Port

1. **`placeholder_function()` usage**: eliminate_redundant_phi.rs:6, 478-480
   - Imported from `enter_ssa` module for the `std::mem::replace` pattern.
   - No TS equivalent needed.

2. **Separate `rewrite_*` functions**: eliminate_redundant_phi.rs:12-363
   - The Rust version implements its own visitor functions instead of using shared helpers.
   - This is necessary due to Rust's borrow checker and the desire to mutate in place.
