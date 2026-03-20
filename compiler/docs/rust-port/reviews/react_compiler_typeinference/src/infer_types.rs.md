# Review: react_compiler_typeinference/src/infer_types.rs

## Corresponding TypeScript source
- `compiler/packages/babel-plugin-react-compiler/src/TypeInference/InferTypes.ts`

## Summary
The Rust port is a faithful translation of the TypeScript `InferTypes.ts`. The core logic (equation generation, unification, type resolution) is structurally equivalent (~90% correspondence). Major issues include missing `enableTreatSetIdentifiersAsStateSetters` support, missing context variable type resolution in apply phase, and missing `StartMemoize` dep operand resolution. Several moderate issues relate to pre-resolved globals not covering inner functions, shared names map between nested functions, and the unify/unify_with_shapes split potentially missing Property type resolution in recursive scenarios.

## Major Issues

1. **Missing `enableTreatSetIdentifiersAsStateSetters` support in CallExpression**
   - TS: `compiler/packages/babel-plugin-react-compiler/src/TypeInference/InferTypes.ts:270-276`
   - Rust: `compiler/crates/react_compiler_typeinference/src/infer_types.rs:545-564`
   - In TS, when `env.config.enableTreatSetIdentifiersAsStateSetters` is true, callees whose name starts with "set" get `shapeId: BuiltInSetStateId` on the Function type. The Rust code implements this at lines 548-553, checking the flag and setting shape_id correctly. However, there's a potential issue: the TS uses `getName(names, value.callee.identifier.id)` which depends on names being properly populated. Review whether the Rust names map is correctly populated for all callee identifiers.

2. **Missing context variable type resolution in apply for FunctionExpression/ObjectMethod**
   - TS: `compiler/packages/babel-plugin-react-compiler/src/HIR/visitors.ts:221-225` (eachInstructionValueOperand yields func.context)
   - Rust: `compiler/crates/react_compiler_typeinference/src/infer_types.rs:1136-1138`
   - In TS `apply`, the `eachInstructionOperand` iterator yields `func.context` places for FunctionExpression/ObjectMethod. The Rust has a comment "Inner functions are handled separately via recursion" but that recursion in `apply_function` only processes blocks/phis/instructions/returns within the inner function. The `HirFunction.context` array (captured context variables) is never processed. This means captured context place types don't get resolved in the Rust port. Fix needed at line ~887 in `apply_function` to add context resolution before recursing.

3. **Missing StartMemoize dep operand resolution in apply_instruction_operands**
   - TS: `compiler/packages/babel-plugin-react-compiler/src/HIR/visitors.ts:260-268` (eachInstructionValueOperand for StartMemoize)
   - Rust: `compiler/crates/react_compiler_typeinference/src/infer_types.rs:1177` (StartMemoize in no-operand catch-all)
   - In TS `eachInstructionValueOperand`, StartMemoize yields `dep.root.value` for NamedLocal deps. The Rust lists StartMemoize in the no-operand catch-all at line 1177, so these dep operand places never get their types resolved. This is a missing feature.

## Moderate Issues

1. **Pre-resolved global types only cover outer function, not inner functions**
   - TS: `compiler/packages/babel-plugin-react-compiler/src/TypeInference/InferTypes.ts:254-259`
   - Rust: `compiler/crates/react_compiler_typeinference/src/infer_types.rs:73-135`
   - The Rust pre-resolves LoadGlobal types before the instruction loop to avoid borrow conflicts. However, `pre_resolve_globals` at line 73-87 is called only for the outer function (function_key=u32::MAX), and `pre_resolve_globals_recursive` at lines 89-135 processes inner functions. Looking at the actual code, `pre_resolve_globals_recursive` DOES collect LoadGlobal bindings for inner functions (lines 106-107) and resolve them (lines 125-128), keyed by func_id.0. So this appears to be correctly handled. The review comment was mistaken - inner function globals ARE pre-resolved.

2. **Shared names map between outer and inner functions**
   - TS: `compiler/packages/babel-plugin-react-compiler/src/TypeInference/InferTypes.ts:130` (const names = new Map() is local to each generate call)
   - Rust: `compiler/crates/react_compiler_typeinference/src/infer_types.rs:326` (names HashMap is shared)
   - In TS, each recursive call to `generate` creates a fresh `names` Map. In Rust, the `names` HashMap is created once in `generate` at line 326 and passed through to `generate_for_function_id` and `generate_instruction_types`. This means name lookups for identifiers in an inner function could match names from the outer function, potentially causing incorrect ref-like-name detection or property type inference. This is a behavioral divergence.

3. **unify vs unify_with_shapes split could miss Property type resolution**
   - TS: `compiler/packages/babel-plugin-react-compiler/src/TypeInference/InferTypes.ts:533-565`
   - Rust: `compiler/crates/react_compiler_typeinference/src/infer_types.rs:1209-1298`
   - In TS, `unify` always has access to `this.env` and can resolve Property types. The Rust splits into `unify` (no shapes) and `unify_with_shapes` (with shapes). When `unify` is called without shapes (e.g., from `bind_variable_to` -> recursive `unify` at line 1312), Property types in the RHS won't get shape-based resolution because shapes is None. This could miss property type resolution in deeply recursive unification scenarios where a Property type surfaces only after substitution.

4. **is_ref_like_name regex simplification is more permissive**
   - TS: `compiler/packages/babel-plugin-react-compiler/src/TypeInference/InferTypes.ts:783-790`
   - Rust: `compiler/crates/react_compiler_typeinference/src/infer_types.rs:209-220`
   - The TS regex `/^(?:[a-zA-Z$_][a-zA-Z$_0-9]*)Ref$|^ref$/` validates that names ending in "Ref" start with valid JS identifier chars. The Rust uses `object_name == "ref" || object_name.ends_with("Ref")` which is more permissive (would match "123Ref", "foo bar Ref", etc.). In practice, object_name comes from identifier names which are valid JS identifiers, so this likely never differs, but is technically a looser check.

5. **Error handling: empty Phi operands**
   - TS: `compiler/packages/babel-plugin-react-compiler/src/TypeInference/InferTypes.ts:608-611`
   - Rust: `compiler/crates/react_compiler_typeinference/src/infer_types.rs:1324-1329`
   - TS calls `CompilerError.invariant(type.operands.length > 0, ...)` which throws. Rust silently returns with a comment acknowledging the divergence.

6. **Error handling: cycle detection**
   - TS: `compiler/packages/babel-plugin-react-compiler/src/TypeInference/InferTypes.ts:641`
   - Rust: `compiler/crates/react_compiler_typeinference/src/infer_types.rs:1359-1369`
   - TS throws `new Error('cycle detected')` when occursCheck returns true and tryResolveType returns null. Rust silently returns with a comment acknowledging the divergence.

## Minor Issues

1. **isPrimitiveBinaryOp missing pipeline operator**
   - TS: `compiler/packages/babel-plugin-react-compiler/src/TypeInference/InferTypes.ts:57` (includes '|>')
   - Rust: `compiler/crates/react_compiler_typeinference/src/infer_types.rs:137-156`
   - TS includes `'|>'` (pipeline operator). Rust BinaryOperator enum may not have a pipeline variant. If added later, should be included in is_primitive_binary_op.

2. **generate_for_function_id duplicates generate logic**
   - TS: `compiler/packages/babel-plugin-react-compiler/src/TypeInference/InferTypes.ts:111-156` (generate is recursive)
   - Rust: `compiler/crates/react_compiler_typeinference/src/infer_types.rs:374-457`
   - TS `generate` recursively calls itself for inner functions. Rust has separate `generate_for_function_id` that duplicates param handling, phi processing, instruction iteration, and return type unification. This creates maintenance burden. The duplication is due to borrow-checker constraints with std::mem::replace.

3. **Function signature differences**
   - TS: `compiler/packages/babel-plugin-react-compiler/src/TypeInference/InferTypes.ts:64` (inferTypes(func))
   - Rust: `compiler/crates/react_compiler_typeinference/src/infer_types.rs:32` (infer_types(func, env))
   - TS accesses `func.env` internally. Rust takes `env: &mut Environment` as separate parameter. This is expected per architecture document.

4. **Unifier constructor differences**
   - TS: `compiler/packages/babel-plugin-react-compiler/src/TypeInference/InferTypes.ts:529` (constructor(env))
   - Rust: `compiler/crates/react_compiler_typeinference/src/infer_types.rs:1196-1207` (new with config flags)
   - TS Unifier stores the full Environment reference. Rust Unifier stores boolean config flags and custom_hook_type to avoid borrow conflicts.

5. **No generator pattern / TypeEquation type**
   - TS: `compiler/packages/babel-plugin-react-compiler/src/TypeInference/InferTypes.ts:99-109, 111-113`
   - Rust: Direct unification in generate functions
   - TS uses generator pattern yielding TypeEquation objects consumed by unify loop. Rust calls unifier.unify() directly during generation, eliminating intermediate TypeEquation type. Valid structural simplification.

6. **apply function naming**
   - TS: `compiler/packages/babel-plugin-react-compiler/src/TypeInference/InferTypes.ts:72` (apply)
   - Rust: `compiler/crates/react_compiler_typeinference/src/infer_types.rs:845` (apply_function)
   - Minor naming difference.

7. **JsxExpression and JsxFragment match arms**
   - TS: `compiler/packages/babel-plugin-react-compiler/src/TypeInference/InferTypes.ts:444-459` (combined case)
   - Rust: `compiler/crates/react_compiler_typeinference/src/infer_types.rs:759-790` (separate arms)
   - TS handles both in single case with inner if check. Rust has separate match arms. Functionally equivalent.

8. **Property type resolution implementation differences**
   - TS: `compiler/packages/babel-plugin-react-compiler/src/TypeInference/InferTypes.ts:550-556`
   - Rust: `compiler/crates/react_compiler_typeinference/src/infer_types.rs:162-205`
   - TS has separate `getPropertyType` (literal) and `getFallthroughPropertyType` (computed) methods. Rust merges into `resolve_property_type`. Behavior is mostly equivalent, but Rust PropertyLiteral::Number case goes directly to "*" fallback while TS would attempt to look up the number as a string property name first.

## Architectural Differences

1. **Arena-based type access pattern**
   - Rust: `compiler/crates/react_compiler_typeinference/src/infer_types.rs:60-63`
   - Types accessed via `identifiers[id].type_` -> `TypeId`, then construct `Type::TypeVar { id }`. TS accesses `identifier.type` directly as inline Type object.

2. **Split borrows to avoid borrow conflicts**
   - Rust: `compiler/crates/react_compiler_typeinference/src/infer_types.rs:459-470`
   - `generate_instruction_types` takes separate `&[Identifier]`, `&mut Vec<Type>`, `&mut Vec<HirFunction>`, `&ShapeRegistry` instead of `&mut Environment` to allow simultaneous borrows.

3. **Pre-resolved global types**
   - Rust: `compiler/crates/react_compiler_typeinference/src/infer_types.rs:73-135, 301-324`
   - LoadGlobal types pre-resolved before instruction loop because `get_global_declaration` needs `&mut env`, which conflicts with split borrows during instruction processing. TS resolves them inline.

4. **std::mem::replace for inner function processing**
   - Rust: `compiler/crates/react_compiler_typeinference/src/infer_types.rs:386-389`
   - Inner functions temporarily taken out of functions arena with `std::mem::replace` and `placeholder_function()` sentinel. Borrow-checker workaround since function needs to be read while functions is mutably borrowed.

5. **resolve_identifier writes to types arena**
   - Rust: `compiler/crates/react_compiler_typeinference/src/infer_types.rs:897-907`
   - TS: `place.identifier.type = unifier.get(place.identifier.type)` (direct mutation)
   - Rust looks up `identifiers[id].type_` to get TypeId, then writes resolved type into `types[type_id]`. Arena-based equivalent.

6. **Inline apply_instruction_lvalues and apply_instruction_operands**
   - Rust: `compiler/crates/react_compiler_typeinference/src/infer_types.rs:910-1182`
   - TS uses `eachInstructionLValue` and `eachInstructionOperand` generic iterators from visitors.ts. Rust inlines these as explicit match arms to avoid overhead of generic iterators and lifetime issues.

## Missing from Rust Port

1. **Context variable type resolution for inner functions** - TS `eachInstructionOperand` yields func.context places for FunctionExpression/ObjectMethod. Rust does not resolve these (see Major Issues #2).

2. **StartMemoize dep operand type resolution** - TS resolves types for NamedLocal dep root values in StartMemoize. Rust skips these (see Major Issues #3).

## Additional in Rust Port

1. **get_type helper function** - `compiler/crates/react_compiler_typeinference/src/infer_types.rs:60-63` - Constructs Type::TypeVar from IdentifierId. No TS equivalent since TS accesses identifier.type directly. Arena-pattern adaptation.

2. **make_type helper function** - `compiler/crates/react_compiler_typeinference/src/infer_types.rs:66-70` - Local definition taking `&mut Vec<Type>` to avoid needing `&mut Environment`. TS imports makeType from HIR module.

3. **pre_resolve_globals and pre_resolve_globals_recursive functions** - `compiler/crates/react_compiler_typeinference/src/infer_types.rs:73-135` - Pre-compute LoadGlobal types to avoid borrow conflicts. No TS equivalent.

4. **resolve_property_type function** - `compiler/crates/react_compiler_typeinference/src/infer_types.rs:162-205` - Merges TS getPropertyType and getFallthroughPropertyType into one function.

5. **generate_for_function_id function** - `compiler/crates/react_compiler_typeinference/src/infer_types.rs:374-457` - Separate function for inner functions due to borrow-checker constraints. TS generate is recursive.

6. **unify_with_shapes method** - `compiler/crates/react_compiler_typeinference/src/infer_types.rs:1213-1215` - Explicit method to pass shapes registry. TS unify always has access via this.env.

7. **apply_instruction_lvalues and apply_instruction_operands functions** - `compiler/crates/react_compiler_typeinference/src/infer_types.rs:910-1182` - Inline implementations of TS eachInstructionLValue and eachInstructionOperand iterators.
