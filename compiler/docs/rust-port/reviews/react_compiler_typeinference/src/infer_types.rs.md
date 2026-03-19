# Review: compiler/crates/react_compiler_typeinference/src/infer_types.rs

## Corresponding TypeScript file(s)
- `compiler/packages/babel-plugin-react-compiler/src/TypeInference/InferTypes.ts`
- `compiler/packages/babel-plugin-react-compiler/src/HIR/visitors.ts` (for `eachInstructionLValue`, `eachInstructionOperand` used in the TS `apply` function)

## Summary
The Rust port is a faithful translation of the TypeScript `InferTypes.ts`. The core logic (equation generation, unification, type resolution) is structurally equivalent. There are a few missing features (`enableTreatSetIdentifiersAsStateSetters`, context variable type resolution in `apply`, `StartMemoize` dep operand resolution), a regex simplification in `is_ref_like_name`, and a couple of error-handling divergences. The `unify` / `unify_with_shapes` split is a structural adaptation for borrow-checker constraints.

## Major Issues

1. **Missing `enableTreatSetIdentifiersAsStateSetters` support in `CallExpression`**
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/TypeInference/InferTypes.ts:270:276`
   - Rust file: `compiler/crates/react_compiler_typeinference/src/infer_types.rs:433:446`
   - In the TS code, when `env.config.enableTreatSetIdentifiersAsStateSetters` is true, callees whose name starts with `set` get `shapeId: BuiltInSetStateId` on the Function type equation. The Rust code has a comment `// enableTreatSetIdentifiersAsStateSetters is skipped (treated as false)` and always passes `shape_id: None`. The config field `enable_treat_set_identifiers_as_state_setters` exists in the Rust `EnvironmentConfig` (at `compiler/crates/react_compiler_hir/src/environment_config.rs:137`) but is never read. Additionally, `BUILT_IN_SET_STATE_ID` is not imported at all in the Rust file.

2. **Missing context variable type resolution in `apply_instruction_operands` for FunctionExpression/ObjectMethod**
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/HIR/visitors.ts:221:225`
   - Rust file: `compiler/crates/react_compiler_typeinference/src/infer_types.rs:1013:1015`
   - In the TS `eachInstructionValueOperand`, `FunctionExpression` and `ObjectMethod` yield `instrValue.loweredFunc.func.context` -- the captured context variables. The Rust `apply_instruction_operands` skips these entirely with a comment "Inner functions are handled separately via recursion." However, the recursion in `apply_function` only resolves types within the inner function's blocks (phis, instructions, returns), not the context array on `HirFunction.context`. This means captured context places do not get their types resolved in the Rust port.

3. **Missing `StartMemoize` dep operand resolution in `apply_instruction_operands`**
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/HIR/visitors.ts:260:268`
   - Rust file: `compiler/crates/react_compiler_typeinference/src/infer_types.rs:1054`
   - In the TS `eachInstructionValueOperand`, `StartMemoize` yields `dep.root.value` for `NamedLocal` deps. The Rust `apply_instruction_operands` lists `StartMemoize` in the no-operand catch-all arm, so these dep operand places never get their types resolved.

## Moderate Issues

1. **`is_ref_like_name` regex simplification**
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/TypeInference/InferTypes.ts:783`
   - Rust file: `compiler/crates/react_compiler_typeinference/src/infer_types.rs:111:122`
   - The TS regex is `/^(?:[a-zA-Z$_][a-zA-Z$_0-9]*)Ref$|^ref$/` which requires that names ending in `Ref` must start with a valid JS identifier character and contain only identifier characters before `Ref`. The Rust uses `object_name == "ref" || object_name.ends_with("Ref")` which is more permissive -- it would match strings like `"123Ref"` or `"foo bar Ref"` or `""` + `"Ref"` (i.e., just `"Ref"` alone). In practice, since `object_name` comes from identifier names which are valid JS identifiers, this likely never differs, but it is technically a looser check.

2. **`unify` vs `unify_with_shapes` split for Property type resolution**
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/TypeInference/InferTypes.ts:533:565`
   - Rust file: `compiler/crates/react_compiler_typeinference/src/infer_types.rs:1078:1084`
   - In the TS, the `unify` method always has access to `this.env` and can call `this.env.getPropertyType()` / `this.env.getFallthroughPropertyType()` whenever it encounters a Property type. The Rust splits into `unify` (no shapes) and `unify_with_shapes` (with shapes). When `unify` is called without shapes (e.g., from `bind_variable_to` -> recursive `unify`), Property types that appear in the RHS won't get shape-based resolution because `shapes` is `None`. This could miss property type resolution in deeply recursive unification scenarios where a Property type surfaces only after substitution.

3. **Property type resolution uses `resolve_property_type` instead of `env.getPropertyType` / `env.getFallthroughPropertyType`**
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/TypeInference/InferTypes.ts:550:556`
   - Rust file: `compiler/crates/react_compiler_typeinference/src/infer_types.rs:84:107`
   - The TS has two different methods: `getPropertyType(objectType, propertyName)` for literal property names and `getFallthroughPropertyType(objectType, computedType)` for computed properties. The Rust `resolve_property_type` merges these into one function. The TS `getPropertyType` does a specific lookup by property name then falls back to `"*"`, while `getFallthroughPropertyType` goes straight to `"*"`. The Rust does `shape.properties.get(s)` then falls back to `"*"` for String literals, `"*"` only for Number and Computed. The Rust `PropertyLiteral::Number` case goes directly to `"*"` fallback, while the TS would attempt to look up the number as a string property name first via `getPropertyType`. This is likely fine since number property names on shapes are uncommon, but is a behavioral difference.

4. **Error handling in `bind_variable_to` for empty Phi operands**
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/TypeInference/InferTypes.ts:608:611`
   - Rust file: `compiler/crates/react_compiler_typeinference/src/infer_types.rs:1192:1197`
   - The TS calls `CompilerError.invariant(type.operands.length > 0, ...)` which throws an invariant error if there are zero operands. The Rust silently returns, losing the invariant check. The comment acknowledges this divergence.

5. **Error handling for cycle detection in `bind_variable_to`**
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/TypeInference/InferTypes.ts:641`
   - Rust file: `compiler/crates/react_compiler_typeinference/src/infer_types.rs:1233:1236`
   - The TS throws `new Error('cycle detected')` when `occursCheck` returns true and `tryResolveType` returns null. The Rust silently returns. The comment acknowledges this divergence.

6. **`generate_for_function_id` duplicates `generate` logic for inner functions**
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/TypeInference/InferTypes.ts:111:156` (`generate` is recursive via `yield* generate(value.loweredFunc.func)`)
   - Rust file: `compiler/crates/react_compiler_typeinference/src/infer_types.rs:264:346`
   - The TS `generate` function recursively calls itself for inner functions. The Rust has a separate `generate_for_function_id` function that duplicates much of the `generate` logic (param handling, phi processing, instruction iteration, return type unification). This creates a maintenance burden -- if `generate` is updated, `generate_for_function_id` must be updated in sync. The duplication is due to borrow-checker constraints (taking functions out of the arena with `std::mem::replace`).

7. **`generate_for_function_id` pre-resolved global types are shared from outer function**
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/TypeInference/InferTypes.ts:254:259`
   - Rust file: `compiler/crates/react_compiler_typeinference/src/infer_types.rs:264:270`
   - In the TS, each recursive call to `generate(value.loweredFunc.func)` creates its own scope for `names` and processes LoadGlobal inline with access to `func.env`. In the Rust, `generate_for_function_id` receives the outer function's `global_types` map, which was pre-computed from the outer function's instructions only. LoadGlobal instructions inside inner functions won't have entries in this map. However, `generate_for_function_id` still passes `global_types` through, so inner function LoadGlobal instructions will find no matching entry and be skipped (no type equation emitted). In the TS, `env.getGlobalDeclaration()` is called inline during generation for each LoadGlobal, including those in inner functions. This means inner function LoadGlobal types may not be resolved in the Rust port.

8. **`generate_for_function_id` shares `names` map with outer function**
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/TypeInference/InferTypes.ts:130` (`const names = new Map()` is local to each `generate` call)
   - Rust file: `compiler/crates/react_compiler_typeinference/src/infer_types.rs:269`
   - In the TS, each recursive call to `generate` creates a fresh `names` Map. In the Rust, the `names` HashMap is shared between the outer function and all inner functions. This means name lookups for identifiers in an inner function could match names from the outer function, potentially causing incorrect ref-like-name detection or property type inference.

## Minor Issues

1. **`isPrimitiveBinaryOp` missing `|>` (pipeline operator)**
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/TypeInference/InferTypes.ts:57`
   - Rust file: `compiler/crates/react_compiler_typeinference/src/infer_types.rs:62:81`
   - The TS includes `'|>'` (pipeline operator) in `isPrimitiveBinaryOp`. The Rust `is_primitive_binary_op` does not include a pipeline operator variant. This may simply be because the Rust `BinaryOperator` enum does not have a pipeline variant, meaning it's excluded at the type level. If a `PipelineRight` variant is added later, it should be included.

2. **`isPrimitiveBinaryOp` missing `'>>>'` (unsigned right shift)**
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/TypeInference/InferTypes.ts:40:58`
   - Rust file: `compiler/crates/react_compiler_typeinference/src/infer_types.rs:62:81`
   - The TS `isPrimitiveBinaryOp` is a switch with a `default: return false` fallback, so `'>>>'` implicitly returns false. The Rust `BinaryOperator` may or may not have `UnsignedShiftRight` -- if it does, it would also return false via the `matches!` macro, so this is likely equivalent. Noting for completeness.

3. **Function signature: `infer_types` takes `&mut Environment` in Rust vs TS `inferTypes` takes only `func: HIRFunction`**
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/TypeInference/InferTypes.ts:64`
   - Rust file: `compiler/crates/react_compiler_typeinference/src/infer_types.rs:31`
   - The TS `inferTypes(func)` accesses `func.env` internally. The Rust takes `env: &mut Environment` as a separate parameter. This is expected per the architecture document.

4. **Unifier constructor: Rust takes `enable_treat_ref_like_identifiers_as_refs: bool` vs TS takes `env: Environment`**
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/TypeInference/InferTypes.ts:529`
   - Rust file: `compiler/crates/react_compiler_typeinference/src/infer_types.rs:1071`
   - The TS `Unifier` stores the full `Environment` reference. The Rust `Unifier` only stores the boolean config flag. This is because the Rust avoids storing `&Environment` due to borrow conflicts.

5. **`generate` is not a generator**
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/TypeInference/InferTypes.ts:111:113` (uses `function*` generator yielding `TypeEquation`)
   - Rust file: `compiler/crates/react_compiler_typeinference/src/infer_types.rs:176`
   - The TS uses a generator pattern, yielding `TypeEquation` objects that are consumed by the `unify` loop in `inferTypes`. The Rust calls `unifier.unify()` directly during generation, eliminating the intermediate `TypeEquation` type. This is a valid structural simplification.

6. **No `TypeEquation` type in Rust**
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/TypeInference/InferTypes.ts:99:109`
   - The TS defines a `TypeEquation = { left: Type; right: Type }` type and an `equation()` helper function. The Rust has no equivalent since equations are unified directly.

7. **`apply` function naming**
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/TypeInference/InferTypes.ts:72` (`apply`)
   - Rust file: `compiler/crates/react_compiler_typeinference/src/infer_types.rs:727` (`apply_function`)
   - Minor naming difference: TS uses `apply`, Rust uses `apply_function`.

8. **`unify_impl` vs `unify` naming**
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/TypeInference/InferTypes.ts:533` (`unify`)
   - Rust file: `compiler/crates/react_compiler_typeinference/src/infer_types.rs:1086` (`unify_impl`)
   - The TS has a single `unify` method. The Rust splits into `unify`, `unify_with_shapes`, and `unify_impl` (the actual implementation). The public `unify` forwards to `unify_impl` with `shapes: None`.

9. **Comment about `typeEquals` for Phi types**
   - Rust file: `compiler/crates/react_compiler_typeinference/src/infer_types.rs:127:129`
   - The Rust has a doc comment noting that Phi equality always returns false due to a bug in the TS `phiTypeEquals`. This is correct behavior matching the TS, but the comment documents a known TS bug being intentionally preserved.

10. **`get_type` helper function**
    - Rust file: `compiler/crates/react_compiler_typeinference/src/infer_types.rs:50:53`
    - The Rust has a `get_type` helper that constructs `Type::TypeVar { id: type_id }` from an `IdentifierId`. No TS equivalent since TS accesses `identifier.type` directly. This is an arena-pattern adaptation.

11. **`make_type` helper function**
    - TS file: `compiler/packages/babel-plugin-react-compiler/src/TypeInference/InferTypes.ts:19` (imported `makeType` from HIR)
    - Rust file: `compiler/crates/react_compiler_typeinference/src/infer_types.rs:56:60`
    - The TS imports `makeType` from the HIR module. The Rust defines `make_type` locally, taking `&mut Vec<Type>` to avoid needing `&mut Environment`.

12. **`JsxExpression` and `JsxFragment` are separate match arms in Rust**
    - TS file: `compiler/packages/babel-plugin-react-compiler/src/TypeInference/InferTypes.ts:444:459` (combined `case 'JsxExpression': case 'JsxFragment':`)
    - Rust file: `compiler/crates/react_compiler_typeinference/src/infer_types.rs:641:672`
    - The TS handles both in a single case block with an inner `if (value.kind === 'JsxExpression')` check. The Rust has separate match arms. Functionally equivalent.

## Architectural Differences

1. **Arena-based type access pattern**
   - Rust file: `compiler/crates/react_compiler_typeinference/src/infer_types.rs:50:53`
   - Types are accessed via `identifiers[id].type_` -> `TypeId`, then a `Type::TypeVar { id }` is constructed. The TS accesses `identifier.type` directly as an inline `Type` object.

2. **Split borrows to avoid borrow conflicts**
   - Rust file: `compiler/crates/react_compiler_typeinference/src/infer_types.rs:231:245`
   - The `generate_instruction_types` function takes separate `&[Identifier]`, `&mut Vec<Type>`, `&mut Vec<HirFunction>`, `&ShapeRegistry` instead of `&mut Environment` to allow simultaneous borrows.

3. **Pre-resolved global types**
   - Rust file: `compiler/crates/react_compiler_typeinference/src/infer_types.rs:206:214`
   - LoadGlobal types are pre-resolved before the instruction loop because `get_global_declaration` needs `&mut env`, which conflicts with the split borrows used during instruction processing. The TS resolves them inline.

4. **`std::mem::replace` for inner function processing**
   - Rust file: `compiler/crates/react_compiler_typeinference/src/infer_types.rs:275:278`
   - Inner functions are temporarily taken out of the `functions` arena with `std::mem::replace` and a `placeholder_function()` sentinel. This is a borrow-checker workaround since the function needs to be read while `functions` is mutably borrowed.

5. **`resolve_identifier` writes to `types` arena instead of mutating `identifier.type` directly**
   - Rust file: `compiler/crates/react_compiler_typeinference/src/infer_types.rs:774:784`
   - TS: `place.identifier.type = unifier.get(place.identifier.type)` (direct mutation).
   - Rust: looks up `identifiers[id].type_` to get a `TypeId`, then writes the resolved type into `types[type_id]`. This is the arena-based equivalent.

6. **Inline `apply_instruction_lvalues` and `apply_instruction_operands` instead of generic iterators**
   - Rust file: `compiler/crates/react_compiler_typeinference/src/infer_types.rs:787:1059`
   - The TS uses `eachInstructionLValue` and `eachInstructionOperand` generic iterators from `visitors.ts`. The Rust inlines these as explicit match arms in `apply_instruction_lvalues` and `apply_instruction_operands`. This avoids the overhead of generic iterators and lifetime issues.

## Missing TypeScript Features

1. **`enableTreatSetIdentifiersAsStateSetters` flag for CallExpression** -- The TS checks this config flag to assign `BuiltInSetStateId` shape to callee functions whose name starts with `set`. The Rust skips this entirely (see Major Issues #1).

2. **Context variable type resolution for inner functions** -- The TS `apply` resolves types for `func.context` places on FunctionExpression/ObjectMethod via `eachInstructionOperand`. The Rust does not resolve context place types (see Major Issues #2).

3. **`StartMemoize` dep operand type resolution** -- The TS resolves types for `NamedLocal` dep root values in `StartMemoize`. The Rust skips these (see Major Issues #3).

4. **Inner function LoadGlobal type resolution** -- The TS resolves LoadGlobal types for inner functions via `env.getGlobalDeclaration()` called inline during generation. The Rust pre-computes global types only for the outer function, so inner function LoadGlobal instructions may miss type equations (see Moderate Issues #7).
