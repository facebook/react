# Review: react_compiler_optimization/src/prune_maybe_throws.rs

## Corresponding TypeScript source
- `compiler/packages/babel-plugin-react-compiler/src/Optimization/PruneMaybeThrows.ts`

## Summary
The Rust port accurately implements PruneMaybeThrows, preserving all core logic including terminal mapping, phi operand rewriting, and CFG cleanup. The implementation is structurally identical to the TypeScript version.

## Major Issues
None

## Moderate Issues
None

## Minor Issues
None

## Architectural Differences
- **Rust (line 19)**: Uses `HirFunction` and `&mut [HirFunction]` as parameters, matching the arena-based architecture where inner functions are stored separately in `env.functions`
- **TS (line 38)**: Uses `HIRFunction` directly, with inner functions accessed via `instr.value.loweredFunc.func`
- **Rust (line 33-42)**: Takes `functions: &mut [HirFunction]` parameter for recursive call to `merge_consecutive_blocks`. TS version (line 50) calls `mergeConsecutiveBlocks(fn)` which recursively handles inner functions internally
- **Rust (line 94)**: `&func.instructions` arena indexed by `instr_id.0 as usize`
- **TS (line 84-86)**: Direct iteration `block.instructions.some(instr => ...)`
- **Rust (line 105)**: Indexes into instruction arena: `&instructions[instr_id.0 as usize]`
- **TS (line 85)**: Direct instruction access from array
- **Rust (line 53-67)**: Error handling via `ok_or_else()` returning `CompilerDiagnostic`
- **TS (line 57-63)**: Uses `CompilerError.invariant()` which throws

## Missing from Rust Port
None. All logic is present.

## Additional in Rust Port
None. Implementation is 1:1.
