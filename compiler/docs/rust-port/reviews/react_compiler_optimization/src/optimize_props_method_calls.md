# Review: react_compiler_optimization/src/optimize_props_method_calls.rs

## Corresponding TypeScript source
- `compiler/packages/babel-plugin-react-compiler/src/Optimization/OptimizePropsMethodCalls.ts`

## Summary
The Rust port accurately implements the props method call optimization, converting MethodCall to CallExpression when the receiver is the props object. Implementation is minimal and matches TS 1:1.

## Major Issues
None

## Moderate Issues
None

## Minor Issues
None

## Architectural Differences
- **Rust (line 20)**: Uses helper `is_props_type(identifier_id, env)` checking `env.identifiers` and `env.types` arenas
- **TS (line 41)**: Uses helper `isPropsType(instr.value.receiver.identifier)` which accesses type information directly
- **Rust (line 23)**: Matches `Type::Object { shape_id: Some(id) } if id == BUILT_IN_PROPS_ID`
- **TS (line 8)**: Imports and uses `isPropsType` from HIR module
- **Rust (lines 38-42)**: Uses `std::mem::replace` to take ownership of value, then pattern matches to extract fields
- **TS (lines 43-48)**: Direct field mutation `instr.value = { ... }`

## Missing from Rust Port
None. All logic is present.

## Additional in Rust Port
None. Implementation is 1:1 with TS.
