# Review: compiler/crates/react_compiler_validation/src/validate_no_capitalized_calls.rs

## Corresponding TypeScript file(s)
- `compiler/packages/babel-plugin-react-compiler/src/Validation/ValidateNoCapitalizedCalls.ts`

## Summary
The Rust port is a close and accurate translation of the TypeScript original. The logic for detecting capitalized function calls and method calls is faithfully preserved. There are only minor differences.

## Major Issues
None.

## Moderate Issues

1. **PropertyLoad only checks string properties; TS also checks `typeof value.property === 'string'`**
   - Rust file: `compiler/crates/react_compiler_validation/src/validate_no_capitalized_calls.rs`, line 55-62
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Validation/ValidateNoCapitalizedCalls.ts`, line 62-67
   - The TS checks `typeof value.property === 'string'` because `property` can be a string or number. The Rust version uses `if let PropertyLiteral::String(prop_name) = property` which is the correct Rust equivalent -- `PropertyLiteral` is an enum with `String` and `Number` variants. Functionally equivalent.

2. **All-uppercase check uses different approach**
   - Rust file: `compiler/crates/react_compiler_validation/src/validate_no_capitalized_calls.rs`, line 36
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Validation/ValidateNoCapitalizedCalls.ts`, line 35
   - TS: `value.binding.name.toUpperCase() === value.binding.name`. Rust: `name != name.to_uppercase()`. Both correctly exclude all-uppercase identifiers like `CONSTANTS`. The negation is just inverted (TS uses `!(...) ` in the condition, Rust uses `!=`). Functionally equivalent but note that `to_uppercase()` in Rust handles Unicode uppercasing, while JS `toUpperCase()` also handles Unicode. Both should behave the same for ASCII identifiers.

## Minor Issues

1. **`allow_list` built from `env.globals().keys()` vs. TS `DEFAULT_GLOBALS.keys()`**
   - Rust file: `compiler/crates/react_compiler_validation/src/validate_no_capitalized_calls.rs`, line 12
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Validation/ValidateNoCapitalizedCalls.ts`, line 15-16
   - TS imports `DEFAULT_GLOBALS` directly. Rust calls `env.globals()`. These should return the same set of keys, assuming `env.globals()` returns the global registry. If `env.globals()` includes user-configured globals beyond `DEFAULT_GLOBALS`, this could be a behavioral difference (Rust would be more permissive).

2. **`isAllowed` helper not used in Rust**
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Validation/ValidateNoCapitalizedCalls.ts`, line 19-21
   - The TS defines an `isAllowed` closure. The Rust version inlines `allow_list.contains(name)` directly at line 37. Functionally identical.

3. **Config field name casing**
   - Rust file: `compiler/crates/react_compiler_validation/src/validate_no_capitalized_calls.rs`, line 13
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Validation/ValidateNoCapitalizedCalls.ts`, line 17
   - TS: `envConfig.validateNoCapitalizedCalls`. Rust: `env.config.validate_no_capitalized_calls`. Standard casing convention difference.

4. **`continue` vs. `break` after recording CallExpression error**
   - Rust file: `compiler/crates/react_compiler_validation/src/validate_no_capitalized_calls.rs`, line 53
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Validation/ValidateNoCapitalizedCalls.ts`, line 57
   - Both use `continue` to skip to the next instruction after recording the error. Functionally equivalent.

5. **`PropertyLoad` does not check all-uppercase for property names**
   - Rust file: `compiler/crates/react_compiler_validation/src/validate_no_capitalized_calls.rs`, line 57
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Validation/ValidateNoCapitalizedCalls.ts`, line 63-65
   - Neither TS nor Rust checks for all-uppercase property names (only `LoadGlobal` checks for this). Both only check `starts_with uppercase`. Consistent.

6. **Error `loc` field: Rust uses `*loc` (dereferenced), TS uses `value.loc`**
   - Rust file: `compiler/crates/react_compiler_validation/src/validate_no_capitalized_calls.rs`, line 49
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Validation/ValidateNoCapitalizedCalls.ts`, line 54
   - The Rust `loc` is extracted from the `CallExpression` variant's `loc` field. The TS uses `value.loc`. Both refer to the instruction value's source location. Functionally equivalent.

## Architectural Differences

1. **Arena-based instruction access**
   - Rust file: `compiler/crates/react_compiler_validation/src/validate_no_capitalized_calls.rs`, line 26
   - Instructions accessed via `func.instructions[instr_id.0 as usize]` rather than direct iteration.

2. **No inner function recursion**
   - Both TS and Rust only validate the top-level function, not inner function expressions. This is consistent.

## Missing TypeScript Features
None.
