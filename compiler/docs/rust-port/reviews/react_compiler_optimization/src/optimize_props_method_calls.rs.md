# Review: compiler/crates/react_compiler_optimization/src/optimize_props_method_calls.rs

## Corresponding TypeScript file(s)
- compiler/packages/babel-plugin-react-compiler/src/Optimization/OptimizePropsMethodCalls.ts

## Summary
The Rust port is a close translation of the TS pass. The logic -- finding `MethodCall` instructions where the receiver is typed as the component's props, and replacing them with `CallExpression` -- is preserved. The main difference is how the props type check is implemented: the Rust version accesses the type through the identifier and type arenas, while the TS version calls `isPropsType` on the identifier directly.

## Major Issues
None.

## Moderate Issues

1. **`is_props_type` accesses type via arena; TS `isPropsType` accesses identifier directly**
   - Rust file: `compiler/crates/react_compiler_optimization/src/optimize_props_method_calls.rs:20-24`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Optimization/OptimizePropsMethodCalls.ts:8` (`isPropsType` imported from HIR)
   - The Rust version manually looks up the identifier and type from arenas: `env.identifiers[identifier_id.0 as usize]` then `env.types[identifier.type_.0 as usize]`. The TS version calls `isPropsType(instr.value.receiver.identifier)` which accesses the identifier's type directly. If the Rust `is_props_type` logic doesn't match the TS `isPropsType` exactly (e.g., different shape ID comparison), it could produce different results.

2. **`BUILT_IN_PROPS_ID` comparison: Rust uses `id == BUILT_IN_PROPS_ID` (pointer/value equality)**
   - Rust file: `compiler/crates/react_compiler_optimization/src/optimize_props_method_calls.rs:23`
   - The Rust version compares `shape_id` with `BUILT_IN_PROPS_ID` using `==`. This should work if `BUILT_IN_PROPS_ID` is a well-known constant. The TS `isPropsType` likely does a similar check. This is fine as long as the constant values match.

3. **Replacement uses `std::mem::replace` with `Debugger` placeholder**
   - Rust file: `compiler/crates/react_compiler_optimization/src/optimize_props_method_calls.rs:39-42`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Optimization/OptimizePropsMethodCalls.ts:43-48`
   - The Rust version uses `std::mem::replace` with a `Debugger { loc: None }` placeholder to take ownership of the old value, then reconstructs the new value. The TS version simply assigns `instr.value = { kind: 'CallExpression', ... }` directly. The Rust approach is a workaround for the borrow checker and is functionally equivalent, though the temporary `Debugger` placeholder is never visible externally.

## Minor Issues

1. **Function signature: Rust takes `env: &Environment`, TS accesses no env**
   - Rust file: `compiler/crates/react_compiler_optimization/src/optimize_props_method_calls.rs:26`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Optimization/OptimizePropsMethodCalls.ts:35`
   - The Rust version needs `env` to access the identifier and type arenas. The TS version doesn't need env because identifiers contain their types directly.

2. **Instruction iteration: Rust clones instruction IDs then iterates**
   - Rust file: `compiler/crates/react_compiler_optimization/src/optimize_props_method_calls.rs:28-29`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Optimization/OptimizePropsMethodCalls.ts:37-38`
   - The Rust version clones the instruction IDs vector (`block.instructions.clone()`) to avoid borrow conflicts. The TS version iterates with an index. Both are valid approaches.

3. **Loop structure: Rust iterates `instruction_ids`, TS uses index-based for loop**
   - Rust file: `compiler/crates/react_compiler_optimization/src/optimize_props_method_calls.rs:29`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Optimization/OptimizePropsMethodCalls.ts:37`
   - Minor stylistic difference.

## Architectural Differences

1. **Identifier and type access via arenas**
   - Rust file: `compiler/crates/react_compiler_optimization/src/optimize_props_method_calls.rs:21-23`
   - The Rust version accesses identifiers and types through `env.identifiers` and `env.types` arenas. The TS version has direct access via `identifier.type`.

2. **Instruction access via flat table**
   - Rust file: `compiler/crates/react_compiler_optimization/src/optimize_props_method_calls.rs:30`
   - The Rust version accesses instructions via `func.instructions[instr_id.0 as usize]`. The TS version accesses `block.instructions[i]`.

## Missing TypeScript Features
None.
