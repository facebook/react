# Review: react_compiler_optimization/src/outline_functions.rs

## Corresponding TypeScript source
- `compiler/packages/babel-plugin-react-compiler/src/Optimization/OutlineFunctions.ts`

## Summary
The Rust port accurately implements function outlining for anonymous functions with no captured context. The implementation matches the TS version with appropriate arena handling for recursive processing.

## Major Issues
None

## Moderate Issues
None

## Minor Issues

### TODO comment about named functions
- **Rust (line 29)**: Comment `// TODO: handle outlining named functions` but does check `value.loweredFunc.func.id === null` (line 58)
- **TS (line 29)**: Comment `// TODO: handle outlining named functions` and checks `value.loweredFunc.func.id === null`
- **Impact**: None, both have the same limitation
- Both ports skip named functions currently

## Architectural Differences
- **Rust (lines 29-32)**: Collects changes in `Vec<(usize, String, FunctionId)>` for later application
- **TS (lines 14-50)**: Processes changes inline during iteration
- **Rust reasoning**: Avoid borrow conflicts when mutating arena while iterating
- **Rust (lines 86-89)**: Clone function from arena, recursively process, put back
- **TS (line 23)**: Direct recursive call `outlineFunctions(value.loweredFunc.func, fbtOperands)`
- **Rust (line 62-63)**: Clones `id` or `name_hint` before calling `generate_globally_unique_identifier_name()`
- **TS (line 35)**: Passes `loweredFunc.id ?? loweredFunc.nameHint` directly
- **Rust reasoning**: Can't hold borrow into arena while calling mutable env method
- **Rust (line 67)**: `env.generate_globally_unique_identifier_name(hint.as_deref())` takes `Option<&str>`
- **TS (line 34-36)**: `fn.env.generateGloballyUniqueIdentifierName(...)` returns `{value: string}`
- **Rust (line 95)**: Sets `env.functions[function_id.0 as usize].id = Some(generated_name.clone())`
- **TS (line 37)**: Sets `loweredFunc.id = id.value`
- **Rust (line 98)**: Clones function for outlining: `env.functions[function_id.0 as usize].clone()`
- **TS (line 39)**: Passes function directly: `fn.env.outlineFunction(loweredFunc, null)`
- **Rust (line 103-108)**: Replaces instruction value in `func.instructions[instr_idx]`
- **TS (line 40-46)**: Replaces `instr.value` directly

## Missing from Rust Port
None. All TS logic is present including:
- Context length check (must be empty)
- Anonymous function check (id must be null)
- FBT operand exclusion
- Inner function recursion
- Global identifier generation
- Function outlining via env.outline_function()
- LoadGlobal replacement

## Additional in Rust Port
None. Implementation is 1:1 with two-phase pattern for borrow checker.
