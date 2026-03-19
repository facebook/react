# Review: compiler/crates/react_compiler_hir/src/default_module_type_provider.rs

## Corresponding TypeScript file(s)
- `compiler/packages/babel-plugin-react-compiler/src/HIR/DefaultModuleTypeProvider.ts`

## Summary
Faithful port of the default module type provider. All three modules (`react-hook-form`, `@tanstack/react-table`, `@tanstack/react-virtual`) are present with matching configurations. The type config structures match the TS originals.

## Major Issues
None.

## Moderate Issues
None.

## Minor Issues

1. **`react-hook-form` `useForm` hook config: `positional_params` is `None` vs TS's implicit absence**
   `/compiler/crates/react_compiler_hir/src/default_module_type_provider.rs:48` - The Rust version explicitly sets `positional_params: None`. In TS (`DefaultModuleTypeProvider.ts:46-68`), the `useForm` hook config doesn't specify `positionalParams` at all (it's optional). These are semantically equivalent since `None`/`undefined` are both treated as "no positional params specified".

2. **Struct field name differences follow Rust conventions**
   E.g., `positional_params` vs `positionalParams`, `rest_param` vs `restParam`, `return_value_kind` vs `returnValueKind`. Expected.

3. **Error message strings match exactly**
   The `known_incompatible` messages match the TS originals character-for-character.

## Architectural Differences
None significant. The function signature and return type are analogous.

## Missing TypeScript Features
None. All three modules and their configurations are fully ported.
