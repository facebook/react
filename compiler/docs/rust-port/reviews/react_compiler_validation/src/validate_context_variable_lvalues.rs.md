# Review: compiler/crates/react_compiler_validation/src/validate_context_variable_lvalues.rs

## Corresponding TypeScript file(s)
- `compiler/packages/babel-plugin-react-compiler/src/Validation/ValidateContextVariableLvalues.ts`

## Summary
The Rust port closely follows the TypeScript logic. The core validation algorithm -- tracking identifier kinds across instructions and detecting context/local mismatches -- is faithfully ported. The main structural difference is that the Rust version passes arena slices explicitly rather than accessing `fn.env`, and offers a `_with_errors` variant for external error sinks. There are a few divergences worth noting.

## Major Issues
None.

## Moderate Issues

1. **Missing default-case error reporting for unhandled lvalue-bearing instructions**
   - Rust file: `compiler/crates/react_compiler_validation/src/validate_context_variable_lvalues.rs`, line 97-101
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Validation/ValidateContextVariableLvalues.ts`, line 72-87
   - The TypeScript `default` case iterates `eachInstructionValueLValue(value)` and if any lvalues are found, records a Todo error (`"ValidateContextVariableLValues: unhandled instruction variant"`). The Rust `default` case (`_ => {}`) is a silent no-op. This means any future instruction kind that introduces new lvalues would silently skip validation in Rust but produce an error in TypeScript.

2. **Error recording vs. throwing for the destructure-context conflict**
   - Rust file: `compiler/crates/react_compiler_validation/src/validate_context_variable_lvalues.rs`, line 171-182
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Validation/ValidateContextVariableLvalues.ts`, line 110-121
   - Both correctly record a Todo diagnostic. However, the TS version calls `env.recordError(...)` which pushes onto `env.#errors`, while the Rust version calls `errors.push_diagnostic(...)` on the passed-in `CompilerError`. When called through `validate_context_variable_lvalues()` (the public API), this writes to `env.errors`, which is equivalent. But the Rust `_with_errors` variant could receive a throwaway error sink, meaning these errors could be silently dropped. This is likely intentional but is a behavioral difference from TS.

## Minor Issues

1. **`format_place` output differs from TS `printPlace`**
   - Rust file: `compiler/crates/react_compiler_validation/src/validate_context_variable_lvalues.rs`, line 144-152
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Validation/ValidateContextVariableLvalues.ts`, line 127
   - The Rust `format_place` produces `"<effect> <name>$<id>"` using `place.effect` display and raw numeric id. The TS `printPlace` likely has richer formatting (includes the `identifier.id` which is already assigned, may include more context). The exact output differs, but this only affects error message descriptions, not correctness.

2. **VarRefKind is a `Copy` enum with Display impl; TS uses string literals**
   - Rust file: `compiler/crates/react_compiler_validation/src/validate_context_variable_lvalues.rs`, line 13-28
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Validation/ValidateContextVariableLvalues.ts`, line 93-96
   - TS uses `'local' | 'context' | 'destructure'` string literal types. Rust uses a proper enum with `Display` impl. Functionally equivalent.

3. **Return type: `Result<(), CompilerDiagnostic>` vs. `void`**
   - Rust file: `compiler/crates/react_compiler_validation/src/validate_context_variable_lvalues.rs`, line 36-40
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Validation/ValidateContextVariableLvalues.ts`, line 20
   - The TS function returns `void` (errors are thrown via `CompilerError.invariant()` or recorded via `env.recordError()`). The Rust function returns `Result<(), CompilerDiagnostic>` to propagate the invariant error. This is consistent with the architecture doc's error handling guidance.

4. **Type alias `IdentifierKinds` uses `HashMap` vs. TS `Map`**
   - Rust file: `compiler/crates/react_compiler_validation/src/validate_context_variable_lvalues.rs`, line 30
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Validation/ValidateContextVariableLvalues.ts`, line 93-96
   - The TS map key is `IdentifierId` (a number). The Rust map key is `IdentifierId` (a newtype wrapping u32). Functionally equivalent.

5. **`visit` function takes `env_identifiers: &[Identifier]` separately from `identifiers: &mut IdentifierKinds`**
   - Rust file: `compiler/crates/react_compiler_validation/src/validate_context_variable_lvalues.rs`, line 154-159
   - This is a naming difference to avoid confusion between the two maps; the TS version accesses identifiers through the shared `Place` objects directly.

## Architectural Differences

1. **Arena-based identifier access**
   - Rust file: `compiler/crates/react_compiler_validation/src/validate_context_variable_lvalues.rs`, line 66, 107-108, 146
   - Identifiers and functions are accessed via index into arena slices (`identifiers[id.0 as usize]`, `functions[func_id.0 as usize]`) instead of TS's direct object references.

2. **Two-phase collect/apply for inner functions**
   - Rust file: `compiler/crates/react_compiler_validation/src/validate_context_variable_lvalues.rs`, line 62, 106-109
   - Inner function IDs are collected into a `Vec<FunctionId>` during block iteration, then processed after the loop. The TS version recurses directly inside the match arm. This is a borrow checker workaround.

3. **Separate `functions` and `identifiers` parameters**
   - Rust file: `compiler/crates/react_compiler_validation/src/validate_context_variable_lvalues.rs`, line 45-53
   - Instead of passing `env` and accessing `env.functions`/`env.identifiers`, the Rust version takes explicit slice parameters to allow fine-grained borrow splitting.

4. **`each_pattern_operand` reimplemented locally**
   - Rust file: `compiler/crates/react_compiler_validation/src/validate_context_variable_lvalues.rs`, line 115-141
   - TS imports `eachPatternOperand` from `HIR/visitors`. The Rust version has a local implementation. This may be because the shared visitor utility doesn't exist yet in the Rust HIR crate, or the function is simple enough to inline.

## Missing TypeScript Features

1. **`eachInstructionValueLValue` check in default case**
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Validation/ValidateContextVariableLvalues.ts`, line 73
   - The TS default case uses `eachInstructionValueLValue(value)` to detect unhandled instructions that have lvalues. The Rust port does not have this safety check, silently ignoring any unhandled instruction kinds.
