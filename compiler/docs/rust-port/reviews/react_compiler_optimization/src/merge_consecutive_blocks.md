# Review: react_compiler_optimization/src/merge_consecutive_blocks.rs

## Corresponding TypeScript source
- `compiler/packages/babel-plugin-react-compiler/src/HIR/MergeConsecutiveBlocks.ts`

## Summary
The Rust port accurately implements block merging logic including phi-to-assignment conversion, fallthrough tracking, and inner function recursion. The implementation matches the TS version structurally.

## Major Issues
None

## Moderate Issues
None

## Minor Issues
None

## Architectural Differences
- **Rust (lines 28-42)**: Collects inner function IDs, then uses `std::mem::replace` with `placeholder_function()` to temporarily take functions out of the arena for processing
- **TS (lines 39-46)**: Directly accesses and processes inner functions via `instr.value.loweredFunc.func`
- **Rust (line 51)**: Uses `placeholder_function()` from `react_compiler_ssa::enter_ssa` module
- **TS**: No equivalent needed
- **Rust reasoning**: Borrow checker requires we can't mutably borrow the arena while holding references into it. The placeholder swap pattern allows processing each function independently
- **Rust (line 141)**: Pushes new instruction to `func.instructions` and gets `InstructionId`
- **TS (line 98)**: Pushes instruction directly to `predecessor.instructions`
- **Rust (lines 122-139)**: Creates instruction with effects `Some(vec![AliasingEffect::Alias { from, into }])`
- **TS (lines 87-96)**: Creates instruction with effects `[{kind: 'Alias', from: {...operand}, into: {...lvalue}}]`
- **Rust (line 189)**: `set_terminal_fallthrough()` helper with exhaustive match on all terminal kinds
- **TS (lines 119-121)**: Uses `terminalHasFallthrough()` and direct field assignment `terminal.fallthrough = ...`

## Missing from Rust Port
None. All logic is present including:
- Fallthrough block tracking
- Single predecessor checking
- Phi-to-LoadLocal conversion
- Transitive merge tracking via MergedBlocks
- Predecessor and fallthrough updates

## Additional in Rust Port
- **Rust (lines 221-250)**: Explicit `set_terminal_fallthrough()` helper function with match on all terminal kinds
- **TS**: Uses conditional check + direct field mutation
- This is a structural difference due to Rust's type system requiring exhaustive pattern matching
