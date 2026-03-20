# Review: react_compiler_validation/src/validate_use_memo.rs

## Corresponding TypeScript source
- `compiler/packages/babel-plugin-react-compiler/src/Validation/ValidateUseMemo.ts`

## Summary
The Rust port accurately implements useMemo validation with comprehensive operand tracking for void/unused memo detection. Logic is structurally very close to TypeScript.

## Major Issues
None.

## Moderate Issues

### 1. Return type and error handling differ (line 16)
**Location:** `validate_use_memo.rs:16` vs `ValidateUseMemo.ts:25, 178`

**Rust:** `pub fn validate_use_memo(...) -> CompilerError`
**TypeScript:** `export function validateUseMemo(fn: HIRFunction): void` (calls `fn.env.logErrors()` at end)

**Issue:** The Rust version returns `CompilerError` containing VoidUseMemo errors, while TypeScript logs them directly via `fn.env.logErrors()`. The caller must know to handle the returned errors appropriately.

**Recommendation:** Document this difference or match TypeScript's approach of logging errors internally if that fits the Rust architecture better.

## Minor Issues

### 1. Parameter name differs (line 176)
**Location:** `validate_use_memo.rs:176` vs `ValidateUseMemo.ts:86`

**Rust:** `body_func` 
**TypeScript:** `body`

**Note:** Minor naming difference, not functionally significant.

### 2. Different struct for function info (lines 21-24)
**Rust:** Uses custom `FuncExprInfo` struct
**TypeScript:** Stores `FunctionExpression` value directly in the map

**Note:** The Rust version extracts only the needed fields (`func_id`, `loc`) to avoid ownership issues. This is an appropriate architectural difference.

### 3. Operand iteration is explicit and comprehensive (lines 289-525)
**Rust:** Hand-coded `each_instruction_value_operand_ids()` and `each_terminal_operand_ids()` 
**TypeScript:** Uses visitor helpers `eachInstructionValueOperand()` and `eachTerminalOperand()`

**Note:** The Rust version manually implements the visitor logic inline. Both approaches are equivalent in functionality. The Rust version is more explicit about which instruction variants have operands.

## Architectural Differences

### 1. Arena access for functions (lines 107, 176)
**Rust:** `&functions[func_id.0 as usize]`
**TypeScript:** Direct access via `body.loweredFunc.func`

**Reason:** Standard function arena pattern per `rust-port-architecture.md`.

### 2. Separate error accumulation (line 32)
**Rust:** Creates local `void_memo_errors` and returns it
**TypeScript:** Accumulates in local `voidMemoErrors` then calls `fn.env.logErrors()`

**Reason:** Allows caller to decide how to handle VoidUseMemo errors (log vs. aggregate vs. discard).

### 3. Explicit operand ID collection (lines 289-525)
**Rust:** Two dedicated functions that exhaustively match all instruction/terminal variants
**TypeScript:** Uses generic visitor pattern from `HIR/visitors.ts`

**Reason:** Rust doesn't have the visitor infrastructure yet, so passes implement traversal directly. This is more verbose but equally correct.

## Missing from Rust Port
None - all TypeScript validation logic is present.

## Additional in Rust Port

### 1. `FuncExprInfo` struct (lines 21-24)
A lightweight struct holding only the function ID and location, rather than storing the entire `FunctionExpression` value.

### 2. Comprehensive operand visitor implementations (lines 289-525)
The Rust version implements full `each_instruction_value_operand_ids()` and `each_terminal_operand_ids()` functions that exhaustively handle all HIR variants. These replace the TypeScript visitor helpers and are more explicit about coverage.

### 3. Helper `collect_place_or_spread_ids()` (lines 471-478)
A small helper to extract IDs from argument lists. Not needed in TypeScript due to the visitor pattern.
