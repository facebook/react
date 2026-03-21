# Review: compiler/crates/react_compiler_validation/src/validate_no_set_state_in_render.rs

## Corresponding TypeScript Source
`compiler/packages/babel-plugin-react-compiler/src/Validation/ValidateNoSetStateInRender.ts`

## Summary
Accurate port with good structural correspondence. Clean implementation.

## Issues

### Major Issues
None found

### Moderate Issues

1. **validate_no_set_state_in_render.rs:83-102** - FunctionExpression operand checking
   - TS (lines 86-98): Uses `eachInstructionValueOperand` to check if function references setState
   - Rust (lines 87-100): Manually checks `context` captures twice
   - Impact: Rust code redundantly checks context (lines 87-91 and 93-99), might miss non-context operands

### Minor/Stylistic Issues

1. **validate_no_set_state_in_render.rs:58-59** - active_manual_memo_id type
   - Rust: `Option<u32>`
   - TS (line 61): `number | null`
   - Equivalent, just different nullability patterns

2. **validate_no_set_state_in_render.rs:127-128** - manual_memo_id unused
   - Line 128: `let _ = manual_memo_id;`
   - TS line 121 uses it in invariant check
   - Rust removed the invariant check, should probably restore it

## Architectural Differences

1. **Function signature** - Rust takes separate parameters for identifiers/types/functions arrays, TS accesses via fn.env
2. **Error collection** - Rust returns `Vec<CompilerDiagnostic>`, TS returns `CompilerError`

## Completeness

All functionality present:
- Unconditional setState detection
- setState tracking through Load/StoreLocal
- FunctionExpression recursion
- Manual memo (useMemo) tracking
- Different error messages for render vs useMemo context
- useKeyedState config flag handling
