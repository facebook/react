# Review: react_compiler_optimization/src/inline_iifes.rs

## Corresponding TypeScript source
- `compiler/packages/babel-plugin-react-compiler/src/Inference/InlineImmediatelyInvokedFunctionExpressions.ts`

## Summary
The Rust port accurately implements IIFE inlining with both single-return and multi-return paths. The implementation properly handles block splitting, instruction table management, and terminal rewriting. All core logic is preserved.

## Major Issues
None

## Moderate Issues
None

## Minor Issues

### Different field name for async flag
- **Rust (line 117)**: Checks `inner_func.is_async`
- **TS (line 126)**: Checks `body.loweredFunc.func.async`
- **Impact**: None, just a naming difference in the HIR structure

## Architectural Differences
- **Rust (line 64)**: Tracks `functions: HashMap<IdentifierId, FunctionId>` mapping to arena function IDs
- **TS (line 87)**: Tracks `functions: Map<IdentifierId, FunctionExpression>` with direct references
- **Rust (line 116)**: Accesses inner function via arena: `&env.functions[inner_func_id.0 as usize]`
- **TS (line 125)**: Direct access via `body.loweredFunc.func`
- **Rust (lines 172-176)**: Takes blocks and instructions from inner function via `drain()` from arena
- **TS (lines 185-187)**: Direct access to `body.loweredFunc.func.body.blocks`
- **Rust (lines 178-186)**: Remaps instruction IDs by adding offset, updates block instruction vectors
- **TS (line 185)**: No remapping needed since blocks are moved directly
- **Rust (line 283)**: `each_instruction_value_operand_ids()` returns `Vec<IdentifierId>`
- **TS (line 234)**: `eachInstructionValueOperand()` yields `Place` via generator
- **Rust (line 415-420)**: `promote_temporary()` sets name to `Some(IdentifierName::Promoted(...))`
- **TS (line 211)**: `promoteTemporary()` sets `identifier.name` to promoted identifier

## Missing from Rust Port
None. All TS logic is present including:
- Single-return optimization path
- Multi-return label-based path
- Block splitting and continuation handling
- Return terminal rewriting
- Temporary declaration and promotion
- Recursive queue processing

## Additional in Rust Port
- **Rust (lines 422-642)**: Full `each_instruction_value_operand_ids()` implementation that exhaustively handles all instruction value kinds
- **TS**: Uses visitor utility `eachInstructionValueOperand()` from HIR/visitors
- This is not "additional" logic but rather an inline implementation vs. using a utility
