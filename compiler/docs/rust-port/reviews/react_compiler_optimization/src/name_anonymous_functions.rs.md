# Review: compiler/crates/react_compiler_optimization/src/name_anonymous_functions.rs

## Corresponding TypeScript Source
`compiler/packages/babel-plugin-react-compiler/src/Transform/NameAnonymousFunctions.ts`

## Summary
Well-structured port of anonymous function naming that generates descriptive names based on usage context. The implementation correctly handles variable assignments, hook calls, JSX props, and nested functions with appropriate name propagation patterns.

## Issues

### Major Issues
None found

### Moderate Issues
None found

### Minor/Stylistic Issues

1. **Line 84-87: Uses `std::mem::take` for instructions**
   - Pattern to temporarily take ownership of the instruction vector to avoid borrow conflicts
   - TS can modify instructions directly
   - Standard workaround for Rust borrow checker

2. **Line 273: Hook name fallback uses `"(anonymous)".to_string()`**
   - Matches TS behavior which uses fallback string for unnamed hooks
   - Correct implementation

## Architectural Differences

1. **Node struct instead of class**: Lines 109-120 define a `Node` struct with fields. TS uses an object with the same structure. Equivalent.

2. **Recursive visitor function**: Lines 34-58 implement `visit` as a nested function that recursively builds name prefixes. TS has identical logic structure.

3. **Two-phase name application**: Lines 73-87 collect updates in a Vec, build a HashMap, then apply to functions. TS can update directly during traversal.

4. **Name hint updates on FunctionExpression values**: Lines 79 and 83-87 update `name_hint` on both the HirFunction in the arena and on FunctionExpression instruction values. TS likely has similar multi-phase updates.

## Completeness

All functionality correctly ported:
- Function expression tracking in `functions` map
- Named variable tracking in `names` map
- LoadGlobal name tracking
- LoadLocal/LoadContext name propagation
- PropertyLoad chained name tracking (e.g., "obj.prop")
- StoreLocal/StoreContext variable assignment naming
- CallExpression/MethodCall hook-based naming with argument indices
- JSX attribute naming with element context (e.g., "<Component>.onClick")
- Nested function processing with recursive tree building
- Prefix-based hierarchical naming (e.g., "ComponentName[handler > inner]")
- Hook kind detection via type system
- Differentiation between single and multiple function arguments
- Respecting existing names and name hints
- Name updates to both arena functions and instruction values

**No missing features.**

The implementation handles all the naming patterns from the TypeScript version.
