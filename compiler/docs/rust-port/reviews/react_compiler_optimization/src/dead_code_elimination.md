# Review: react_compiler_optimization/src/dead_code_elimination.rs

## Corresponding TypeScript source
- `compiler/packages/babel-plugin-react-compiler/src/Optimization/DeadCodeElimination.ts`

## Summary
The Rust port accurately implements dead code elimination with mark-and-sweep analysis, instruction rewriting for destructuring, StoreLocal to DeclareLocal conversion, and SSR hook preservation. All core logic is preserved.

## Major Issues
None

## Moderate Issues
None

## Minor Issues
None

## Architectural Differences
- **Rust (lines 72-90)**: State struct with methods `reference()`, helper functions `is_id_or_name_used()`, `is_id_used()`, `count()`
- **TS (lines 72-112)**: State class with methods `reference()`, `isIdOrNameUsed()`, `isIdUsed()`, getter `count`
- **Rust (line 96)**: Takes `identifiers: &[Identifier]` parameter to reference function
- **TS (line 82)**: State has `env: Environment` field, accesses identifier directly
- **Rust (lines 433-632)**: Inline implementation of `each_instruction_value_operands()` and helpers
- **TS (lines 21-24)**: Imports visitor utilities `eachInstructionValueOperand`, `eachPatternOperand`, `eachTerminalOperand`
- **Rust (lines 339-351)**: Checks `env.output_mode == OutputMode::Ssr` and hook kind for useState/useReducer/useRef
- **TS (lines 339-366)**: Same SSR logic with getHookKind

## Missing from Rust Port
None. All TS functionality is present including:
- Fixed-point iteration for back edges
- Named variable tracking
- Phi operand marking
- Destructuring pattern rewriting (array holes, object property pruning)
- StoreLocal to DeclareLocal conversion
- SSR hook preservation
- Context variable pruning
- All pruneable value checks

## Additional in Rust Port
- **Rust (lines 433-685)**: Full inline implementations of operand collection functions
- **TS**: Uses visitor utilities from HIR/visitors module
- This is not "additional" logic but rather inlining vs. using utilities
