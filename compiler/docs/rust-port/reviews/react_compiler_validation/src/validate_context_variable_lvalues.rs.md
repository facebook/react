# Review: react_compiler_validation/src/validate_context_variable_lvalues.rs

## Corresponding TypeScript source
- `compiler/packages/babel-plugin-react-compiler/src/Validation/ValidateContextVariableLValues.ts`

## Summary
The Rust port accurately implements the context variable lvalue validation logic with proper handling of nested functions and error reporting.

## Major Issues
None.

## Moderate Issues

### 1. Default case handling differs (lines 97-100)
**Location:** `validate_context_variable_lvalues.rs:97-100`

**TypeScript (lines 73-86):**
```typescript
default: {
  for (const _ of eachInstructionValueLValue(value)) {
    fn.env.recordError(
      CompilerDiagnostic.create({
        category: ErrorCategory.Todo,
        reason: 'ValidateContextVariableLValues: unhandled instruction variant',
        description: `Handle '${value.kind} lvalues`,
      }).withDetails({
        kind: 'error',
        loc: value.loc,
        message: null,
      }),
    );
  }
}
```

**Rust:**
```rust
_ => {
    // All lvalue-bearing instruction kinds are handled above.
    // The default case is a no-op for current variants.
}
```

**Issue:** The Rust version silently ignores unhandled instruction variants with lvalues, while TypeScript explicitly records a Todo error. This could hide bugs if new instruction variants with lvalues are added but not handled.

**Recommendation:** Either implement the same error reporting in Rust, or add a comment explaining why the silent handling is intentional (e.g., if all lvalue-bearing variants are guaranteed to be exhaustively handled).

## Minor Issues

### 1. Different parameter order (line 39)
**Location:** `validate_context_variable_lvalues.rs:39` vs `ValidateContextVariableLValues.ts:20-22`

**Rust:** `validate_context_variable_lvalues(func: &HirFunction, env: &mut Environment)`
**TypeScript:** `validateContextVariableLValues(fn: HIRFunction): void` (env accessed via `fn.env`)

**Note:** This is intentional per Rust architecture - separating `env` from `func` allows better borrow checker management. Not an issue, just documenting the difference.

### 2. Error handling pattern differs (lines 199, 185-196)
**Location:** `validate_context_variable_lvalues.rs:171-183, 185-196`

**TypeScript (lines 110-120, 124-130):**
- Records non-fatal Todo error for destructure case, then returns early
- Throws fatal invariant error for local/context mismatch

**Rust:**
- Records non-fatal Todo error for destructure case, returns `Ok(())`
- Returns fatal `Err(CompilerDiagnostic)` for local/context mismatch

**Note:** This matches the Rust architecture document's error handling pattern. The difference is correct and intentional.

## Architectural Differences

### 1. Separate validation variant with custom error sink (lines 42-53)
The Rust port provides `validate_context_variable_lvalues_with_errors()` which accepts separate function/identifier arenas and a custom error sink. This pattern doesn't exist in TypeScript.

**Reason:** Allows callers to discard diagnostics when lowering is incomplete, supporting the Rust compiler's phased approach.

### 2. Arena access pattern (lines 66, 107-108, 146-147)
**Rust:** `&func.instructions[instr_id.0 as usize]`, `&functions[func_id.0 as usize]`, `&identifiers[id.0 as usize]`
**TypeScript:** Direct field access on shared references

**Reason:** Standard arena-based architecture per `rust-port-architecture.md`.

### 3. Two-phase inner function processing (lines 62, 105-109)
**Rust:** Collects `FunctionId`s into a `Vec`, then processes them after the main block loop
**TypeScript:** Processes inner functions immediately in the switch case

**Reason:** Avoids borrow checker conflicts when recursively calling validation on inner functions while iterating over the parent function's instructions.

## Missing from Rust Port
None - all TypeScript logic is present in Rust.

## Additional in Rust Port

### 1. `validate_context_variable_lvalues_with_errors()` (lines 42-53)
An additional entry point that accepts separate arenas and error sink. This supports scenarios where the caller wants to control error collection (e.g., discarding errors when lowering is incomplete).

### 2. `Display` impl for `VarRefKind` (lines 20-28)
Provides string formatting for the enum variants. TypeScript uses string literals directly.
