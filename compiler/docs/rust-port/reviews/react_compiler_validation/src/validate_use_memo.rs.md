# Review: compiler/crates/react_compiler_validation/src/validate_use_memo.rs

## Corresponding TypeScript Source
`compiler/packages/babel-plugin-react-compiler/src/Validation/ValidateUseMemo.ts`

## Summary
Good port with comprehensive implementation. Includes extensive operand collection helpers that TS delegates to visitor utilities.

## Issues

### Major Issues
None found

### Moderate Issues

1. **validate_use_memo.rs:16-18** - Return type and error handling
   - TS (line 25): `export function validateUseMemo(fn: HIRFunction): void` - records void memo errors via `env.logErrors()`
   - Rust (line 16): Returns `CompilerError` containing void memo errors
   - Impact: Caller pattern differs - Rust returns errors to caller, TS logs them internally

2. **validate_use_memo.rs:289-525** - Manual operand/terminal collection
   - Rust implements `each_instruction_value_operand_ids`, `each_terminal_operand_ids`, helpers (200+ lines)
   - TS uses `eachInstructionValueOperand`, `eachTerminalOperand` from visitors module
   - Impact: Significant code duplication - should these be in a shared visitor module?

### Minor/Stylistic Issues

1. **validate_use_memo.rs:20-24** - FuncExprInfo struct
   - Rust creates dedicated struct
   - TS stores FunctionExpression values directly in Map
   - Minor architectural difference

## Architectural Differences

1. **Error return** - Returns CompilerError vs void + internal logging
2. **Visitor pattern** - Implements operand iteration directly vs using shared visitors
3. **Helper organization** - Many helpers extracted vs relying on imported utilities

## Completeness

All functionality present:
- useMemo/React.useMemo detection
- Function expression tracking
- useMemo callback validation (parameters, async/generator, context reassignment)
- Void return detection
- Unused useMemo result detection
- VoidUseMemo error categorization
