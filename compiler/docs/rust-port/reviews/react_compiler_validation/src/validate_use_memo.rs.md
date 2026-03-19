# Review: compiler/crates/react_compiler_validation/src/validate_use_memo.rs

## Corresponding TypeScript file(s)
- `compiler/packages/babel-plugin-react-compiler/src/Validation/ValidateUseMemo.ts`

## Summary
The Rust port closely follows the TypeScript logic for validating useMemo() usage patterns. The core checks -- no parameters on callback, no async/generator callbacks, no context variable reassignment, void return detection, and unused result tracking -- are all faithfully ported. The main divergence is in the return type: the Rust version returns the `CompilerError` (void memo errors) directly, while the TS version calls `fn.env.logErrors(voidMemoErrors.asResult())` at the end. There are several other differences worth noting.

## Major Issues
None.

## Moderate Issues

1. **Return value vs. `logErrors` call for void memo errors**
   - Rust file: `compiler/crates/react_compiler_validation/src/validate_use_memo.rs`, line 16-17
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Validation/ValidateUseMemo.ts`, line 178
   - The TS version calls `fn.env.logErrors(voidMemoErrors.asResult())` at the end, which logs the errors via the environment's error logger (for telemetry/reporting) but does NOT add them to the compilation errors. The Rust version returns the `CompilerError` to the caller. The caller must handle these errors appropriately (e.g., log them). If the caller doesn't handle them, these errors could be silently dropped or incorrectly treated as compilation errors.

2. **`FunctionExpression` tracking: Rust only tracks `FunctionExpression`, TS also only tracks `FunctionExpression`**
   - Rust file: `compiler/crates/react_compiler_validation/src/validate_use_memo.rs`, line 71-79
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Validation/ValidateUseMemo.ts`, line 59-61
   - Both only track `FunctionExpression` (not `ObjectMethod`). Consistent.
   - However, the TS stores the entire `FunctionExpression` value (`functions.set(lvalue.identifier.id, value)`), while the Rust version stores a `FuncExprInfo` with just `func_id` and `loc`. The TS later accesses `body.loweredFunc.func.params`, `body.loweredFunc.func.async`, `body.loweredFunc.func.generator`, `body.loc`. The Rust accesses these through the function arena. Functionally equivalent.

3. **`validate_no_context_variable_assignment` does not recurse into inner functions**
   - Rust file: `compiler/crates/react_compiler_validation/src/validate_no_context_variable_lvalues.rs`, line 244-275
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Validation/ValidateUseMemo.ts`, line 181-212
   - Neither the TS nor Rust version recurses into inner function expressions within the useMemo callback. Both only check the immediate function body. Consistent.
   - Note: the Rust version has an unused `_functions` parameter (line 247), suggesting recursion was considered but not implemented. The TS version similarly only checks the immediate function.

4. **`validate_no_void_use_memo` config check placement**
   - Rust file: `compiler/crates/react_compiler_validation/src/validate_use_memo.rs`, line 222-241
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Validation/ValidateUseMemo.ts`, line 127-144
   - Both check `validate_no_void_use_memo` before performing the void return check and unused memo tracking. Consistent.

## Minor Issues

1. **`each_instruction_value_operand_ids` vs. `eachInstructionValueOperand`**
   - Rust file: `compiler/crates/react_compiler_validation/src/validate_use_memo.rs`, line 289-469
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Validation/ValidateUseMemo.ts`, line 39
   - The TS uses `eachInstructionValueOperand(value)` which is a generator yielding `Place` objects. The Rust version has a local `each_instruction_value_operand_ids` function that returns `Vec<IdentifierId>`. Both are used to check if useMemo results are referenced. The Rust version only collects IDs (not full places) since only the identifier ID is needed for the `unused_use_memos.remove()` check.

2. **`each_terminal_operand_ids` vs. `eachTerminalOperand`**
   - Rust file: `compiler/crates/react_compiler_validation/src/validate_use_memo.rs`, line 481-525
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Validation/ValidateUseMemo.ts`, line 150
   - Same pattern as above -- local implementation collecting IDs.

3. **`has_non_void_return` checks `ReturnVariant::Explicit | ReturnVariant::Implicit`**
   - Rust file: `compiler/crates/react_compiler_validation/src/validate_use_memo.rs`, line 277-286
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Validation/ValidateUseMemo.ts`, line 214-226
   - TS checks `block.terminal.kind === 'return'` and then `block.terminal.returnVariant === 'Explicit' || block.terminal.returnVariant === 'Implicit'`. The Rust uses `if let Terminal::Return { return_variant, .. }` and `matches!(return_variant, ReturnVariant::Explicit | ReturnVariant::Implicit)`. Functionally equivalent.

4. **Error recording: Rust uses `errors.push_diagnostic(...)`, TS uses `fn.env.recordError(...)`**
   - Rust file: `compiler/crates/react_compiler_validation/src/validate_use_memo.rs`, line 185, 203, 257
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Validation/ValidateUseMemo.ts`, line 93, 109, 193
   - The Rust version writes to the passed-in `errors` (which is `&mut env.errors`), while the TS calls `fn.env.recordError`. Functionally equivalent when called through `validate_use_memo()`.

5. **`FuncExprInfo` struct vs. inline `FunctionExpression` storage**
   - Rust file: `compiler/crates/react_compiler_validation/src/validate_use_memo.rs`, line 21-24
   - The TS stores the full `FunctionExpression` instruction value. The Rust stores just the `FunctionId` and `loc`. This is an architectural difference due to the function arena pattern.

6. **`PlaceOrSpread` first arg check**
   - Rust file: `compiler/crates/react_compiler_validation/src/validate_use_memo.rs`, line 166-168
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Validation/ValidateUseMemo.ts`, line 79
   - TS: `arg.kind !== 'Identifier'` (checks if spread). Rust: matches against `PlaceOrSpread::Spread(_)` and returns. Functionally equivalent.

7. **Unused `_func` parameter in `handle_possible_use_memo_call`**
   - Rust file: `compiler/crates/react_compiler_validation/src/validate_use_memo.rs`, line 149
   - The first parameter `_func` is unused (prefixed with underscore). This parameter has no TS equivalent and appears to be leftover.

8. **Error diagnostic construction pattern**
   - Rust file: throughout
   - TS file: throughout
   - TS uses `CompilerDiagnostic.create({...}).withDetails({kind: 'error', ...})`. Rust uses `CompilerDiagnostic::new(...).with_detail(CompilerDiagnosticDetail::Error{...})`. Structurally equivalent.

## Architectural Differences

1. **Function arena access for inner function bodies**
   - Rust file: `compiler/crates/react_compiler_validation/src/validate_use_memo.rs`, line 176
   - Inner function bodies accessed via `functions[body_info.func_id.0 as usize]` instead of direct object reference.

2. **Separate `functions` parameter instead of `env`**
   - Rust file: `compiler/crates/react_compiler_validation/src/validate_use_memo.rs`, line 26-31
   - The `validate_use_memo_impl` function takes `functions: &[HirFunction]` and `errors: &mut CompilerError` separately rather than `env: &mut Environment`. This allows borrow splitting.

3. **`each_instruction_value_operand_ids` and `each_terminal_operand_ids` are local**
   - Rust file: `compiler/crates/react_compiler_validation/src/validate_use_memo.rs`, line 289-525
   - These are large local functions that enumerate all instruction/terminal variants. The TS uses shared visitor utilities from `HIR/visitors`. Having these locally means they must be updated whenever new instruction/terminal variants are added.

## Missing TypeScript Features

1. **`fn.env.logErrors(voidMemoErrors.asResult())` not called**
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Validation/ValidateUseMemo.ts`, line 178
   - The TS version logs void memo errors via `env.logErrors()`. The Rust version returns them to the caller. The caller is responsible for handling them appropriately. If `logErrors` has side effects (e.g., telemetry reporting), those would be missing unless the caller replicates them.
