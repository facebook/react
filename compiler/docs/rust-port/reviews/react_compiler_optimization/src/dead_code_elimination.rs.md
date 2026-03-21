# Review: compiler/crates/react_compiler_optimization/src/dead_code_elimination.rs

## Corresponding TypeScript Source
`compiler/packages/babel-plugin-react-compiler/src/Optimization/DeadCodeElimination.ts`

## Summary
Faithful port of dead code elimination implementing mark-and-sweep analysis with two-phase collection/application pattern to handle Rust's borrow checker. The core logic matches closely with architectural adaptations for arena-based storage.

## Issues

### Major Issues
None found

### Moderate Issues

1. **Line 47: Phi removal uses `retain` instead of `block.phis.delete(phi)`**
   - TS file: line 46-48 (`for (const phi of block.phis) { if (!state.isIdOrNameUsed(phi.place.identifier)) { block.phis.delete(phi); } }`)
   - Rust file: line 39-41 (`block.phis.retain(|phi| { is_id_or_name_used(&state, &env.identifiers, phi.place.identifier) })`)
   - TS behavior: Uses `Set.delete()` to remove phis while iterating
   - Rust behavior: Uses `Vec::retain()` which keeps matching elements
   - Impact: Functionally equivalent but different iteration patterns - TS removes elements found to be unused, Rust keeps elements found to be used. The logic is inverted but correct.
   - Note: This is actually correct - no issue here upon closer inspection

### Minor/Stylistic Issues

1. **Line 44-47: Different instruction retention pattern**
   - TS uses `retainWhere(block.instructions, instr => state.isIdOrNameUsed(instr.lvalue.identifier))`
   - Rust uses `block.instructions.retain(|instr_id| { ... })`
   - The Rust version explicitly looks up the instruction from the table whereas TS receives it directly via the utility function. Functionally equivalent.

2. **Line 66-69: Context variable retention**
   - TS uses `retainWhere(fn.context, contextVar => state.isIdOrNameUsed(contextVar.identifier))`
   - Rust uses `func.context.retain(|ctx_var| { ... })`
   - Same pattern as instruction retention - functionally equivalent

3. **Line 122: `env: &Environment` parameter naming**
   - TS uses `fn.env` internally via the HIRFunction
   - Rust passes `env: &Environment` as a separate parameter
   - This is an expected architectural difference per the architecture guide

## Architectural Differences

1. **State class vs struct with methods**: TS uses a class with instance methods (`reference()`, `isIdOrNameUsed()`, `isIdUsed()`), Rust uses free functions that take `&mut State` or `&State`. This is idiomatic for each language.

2. **Two-phase collect/apply for instruction rewriting**: Lines 35-63 in Rust collect instructions to rewrite first, then apply rewrites in a second phase. This avoids borrow conflicts when mutating `func.instructions` while holding references to blocks. TS can mutate directly during iteration.

3. **Instruction table access**: Rust uses `func.instructions[instr_id.0 as usize]` to access instructions, TS uses `block.instructions[i]` which returns the instruction directly.

4. **Visitor functions**: Rust implements `each_instruction_value_operands()`, `each_terminal_operands()`, and `each_pattern_operands()` as standalone functions. TS uses visitor utilities `eachInstructionValueOperand()`, `eachTerminalOperand()`, and `eachPatternOperand()` from a shared module. The Rust implementations are local to this file for now.

## Completeness

All functionality from the TypeScript version has been correctly ported:
- Mark phase with fixpoint iteration for back-edges
- Two-track usage tracking (SSA ids and named variables)
- Sweep phase removing unused phis, instructions, and context variables
- Instruction rewriting for Destructure and StoreLocal
- Prunability analysis for all instruction types
- SSR-specific hook pruning logic (useState, useReducer, useRef)
- Back-edge detection
- Complete coverage of all instruction value types in `each_instruction_value_operands`
- Complete coverage of all terminal types in `each_terminal_operands`
- Complete coverage of pattern types in `each_pattern_operands`

**No missing features identified.**
