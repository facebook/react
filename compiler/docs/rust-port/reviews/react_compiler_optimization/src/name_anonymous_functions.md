# Review: react_compiler_optimization/src/name_anonymous_functions.rs

## Corresponding TypeScript source
- `compiler/packages/babel-plugin-react-compiler/src/Transform/NameAnonymousFunctions.ts`

## Summary
The Rust port accurately implements anonymous function naming including variable assignment tracking, call expression naming, JSX prop naming, and nested function traversal. The implementation matches the TS version with appropriate arena-based architecture adaptations.

## Major Issues
None

## Moderate Issues
None

## Minor Issues
None

## Architectural Differences
- **Rust (lines 74-76)**: Sets `env.functions[function_id.0 as usize].name_hint = Some(name.clone())`
- **TS (lines 28-30)**: Sets `node.fn.nameHint = name` and `node.fn.loweredFunc.func.nameHint = name`
- **Rust reasoning**: Functions are in arena, accessed by FunctionId
- **Rust (lines 79-87)**: Updates name_hint in FunctionExpression instruction values by iterating all instructions in func and all arena functions
- **TS**: Not needed since FunctionExpression.name_hint is a reference that was already updated
- **Rust (lines 83-86)**: Uses `std::mem::take` to temporarily extract instructions from arena functions to avoid borrow conflicts
- **TS**: No borrow checker, direct mutation
- **Rust (line 109)**: Node struct with `function_id: FunctionId` field
- **TS (line 46)**: Node type with `fn: FunctionExpression` field (direct reference)
- **Rust (line 164)**: Accesses inner function via arena: `&env.functions[lowered_func.func.0 as usize]`
- **TS (line 90)**: Direct access: `value.loweredFunc.func`
- **Rust (line 267)**: `env.get_hook_kind_for_type(callee_ty)` using type from identifiers arena
- **TS (line 126)**: `getHookKind(fn.env, callee.identifier)` helper

## Missing from Rust Port
None. All TS logic is present including:
- LoadGlobal name tracking
- LoadLocal/LoadContext name tracking
- PropertyLoad name composition
- FunctionExpression node creation and recursion
- StoreLocal/StoreContext variable assignment naming
- CallExpression/MethodCall argument naming with hook kind detection
- JsxExpression prop naming with element name composition
- Nested function tree traversal with prefix generation

## Additional in Rust Port
- **Rust (lines 79-87)**: Extra logic to update FunctionExpression instruction values across all functions
- **TS**: Not needed due to reference semantics
- This is an architectural necessity, not additional logic
