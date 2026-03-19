# Review: compiler/crates/react_compiler_validation/src/validate_hooks_usage.rs

## Corresponding TypeScript file(s)
- `compiler/packages/babel-plugin-react-compiler/src/Validation/ValidateHooksUsage.ts`

## Summary
The Rust port faithfully implements the hooks usage validation logic. The core algorithm -- tracking value kinds through a lattice (Error > KnownHook > PotentialHook > Global > Local), detecting conditional/dynamic/invalid hook usage, and checking hooks in nested function expressions -- is correctly ported. The main structural difference is that the Rust version manually enumerates instruction operands in `visit_all_operands` rather than using a generic `eachInstructionOperand` visitor, and handles function expression visiting with a two-phase collect/apply pattern. There are several divergences to note.

## Major Issues
None.

## Moderate Issues

1. **`recordConditionalHookError` duplicate-check logic differs**
   - Rust file: `compiler/crates/react_compiler_validation/src/validate_hooks_usage.rs`, line 107-130
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Validation/ValidateHooksUsage.ts`, line 102-127
   - The TS version checks `previousError === undefined || previousError.reason !== reason` before inserting/replacing the error. The Rust version at line 109 does `if previous.is_none() || previous.unwrap().reason != reason` which is equivalent. However, the TS version uses `trackError` which sets (overwrites) the entry in the map via `errorsByPlace.set(loc, errorDetail)`. The Rust version uses `errors_by_loc.insert(loc, ...)` which also overwrites. This is functionally equivalent.

2. **Default case: Rust visits operands then sets lvalue kind; TS visits operands AND sets lvalue kinds for ALL lvalues**
   - Rust file: `compiler/crates/react_compiler_validation/src/validate_hooks_usage.rs`, line 389-401
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Validation/ValidateHooksUsage.ts`, line 397-410
   - The TS default case iterates `eachInstructionOperand(instr)` (which includes ALL operands) and then iterates `eachInstructionLValue(instr)` to set kinds for ALL lvalues. The Rust version calls `visit_all_operands` (which visits operands) and then only sets the kind for `instr.lvalue` (the single instruction lvalue). For instructions that have additional lvalues (e.g., Destructure, StoreLocal lvalue.place), the Rust version would miss setting their kinds. However, since Destructure and StoreLocal are handled explicitly above the default case, this should not be an issue in practice. The conceptual difference is that `eachInstructionLValue` in TS can return multiple lvalues for some instruction kinds, while the Rust default only handles `instr.lvalue`.

3. **`visit_all_operands` does not visit `PropertyLoad.object`**
   - Rust file: `compiler/crates/react_compiler_validation/src/validate_hooks_usage.rs`, line 531 (the match in `visit_all_operands`)
   - The `PropertyLoad` case is listed under "handled in the main match" (line 693), so `visit_all_operands` skips it. But in the main match for `PropertyLoad` (line 262-297), the Rust code does NOT call `visit_place(object)` -- it only reads the kind. The TS version handles PropertyLoad specially too (line 253-309) and also does not call `visitPlace(object)` for PropertyLoad, so this is actually consistent.

4. **`visit_function_expression` uses `getHookKind` differently**
   - Rust file: `compiler/crates/react_compiler_validation/src/validate_hooks_usage.rs`, line 417-468
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Validation/ValidateHooksUsage.ts`, line 423-456
   - The TS version calls `getHookKind(fn.env, callee.identifier)` which looks up the hook kind from the **inner function's** environment. The Rust version calls `env.get_hook_kind_for_type(ty)` using the outer function's environment and looking up the type from the identifier's `type_` field. This should be functionally equivalent since hook kind resolution depends on global type information, but it's a subtle difference in how the lookup is routed.

5. **`visit_function_expression` error description format**
   - Rust file: `compiler/crates/react_compiler_validation/src/validate_hooks_usage.rs`, line 448-454
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Validation/ValidateHooksUsage.ts`, line 446
   - The TS version uses `hookKind === 'Custom' ? 'hook' : hookKind` where hookKind is a string like `'useState'`, `'Custom'`, etc. The Rust version uses `if hook_kind == HookKind::Custom { "hook" } else { hook_kind_display(&hook_kind) }`. The `hook_kind_display` function (line 471-489) maps enum variants to strings like `"useState"`, `"useContext"`, etc. This is functionally equivalent.

## Minor Issues

1. **`unconditionalBlocks` is a `HashSet` in Rust vs. `Set` in TS**
   - Rust file: `compiler/crates/react_compiler_validation/src/validate_hooks_usage.rs`, line 194
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Validation/ValidateHooksUsage.ts`, line 87
   - The Rust version passes `env.next_block_id_counter` to `compute_unconditional_blocks`. The TS version just passes `fn`. This is an architectural difference in how the dominator computation is invoked.

2. **`errors_by_loc` uses `IndexMap` for insertion-order iteration**
   - Rust file: `compiler/crates/react_compiler_validation/src/validate_hooks_usage.rs`, line 195
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Validation/ValidateHooksUsage.ts`, line 89
   - The TS uses `Map<t.SourceLocation, CompilerErrorDetail>` which preserves insertion order in JS. The Rust uses `IndexMap<SourceLocation, CompilerErrorDetail>` which preserves insertion order. This is correct.

3. **`trackError` abstraction not used in Rust**
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Validation/ValidateHooksUsage.ts`, line 91-100
   - The TS has a `trackError` helper that checks `typeof loc === 'symbol'` (for generated/synthetic locations) and routes to either `env.recordError` or the `errorsByPlace` map. The Rust version handles this in each `record_*_error` function by checking `if let Some(loc) = place.loc` (since Rust uses `Option<SourceLocation>` instead of `symbol | SourceLocation`). Functionally equivalent.

4. **`CallExpression` operand visiting approach**
   - Rust file: `compiler/crates/react_compiler_validation/src/validate_hooks_usage.rs`, line 314-320
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Validation/ValidateHooksUsage.ts`, line 324-329
   - The TS uses `eachInstructionOperand(instr)` and skips `callee` via identity comparison (`operand === instr.value.callee`). The Rust version directly iterates `args` only (skipping callee implicitly). This is functionally equivalent since `eachInstructionOperand` for `CallExpression` yields callee + args.

5. **`MethodCall` operand visiting: Rust visits `receiver` explicitly**
   - Rust file: `compiler/crates/react_compiler_validation/src/validate_hooks_usage.rs`, line 347
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Validation/ValidateHooksUsage.ts`, line 344-349
   - The TS iterates all operands via `eachInstructionOperand(instr)` and skips `property`. The Rust version explicitly visits `receiver` and iterates `args`. Both approaches should visit the same set of places (receiver + args, excluding property).

6. **No `setKind` helper in Rust**
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Validation/ValidateHooksUsage.ts`, line 183-185
   - The TS has a `setKind(place, kind)` helper that does `valueKinds.set(place.identifier.id, kind)`. The Rust version inlines `value_kinds.insert(...)` directly. Functionally identical.

7. **Comment from TS about phi operands and fixpoint iteration not present in Rust**
   - Rust file: `compiler/crates/react_compiler_validation/src/validate_hooks_usage.rs`, line 217-221
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Validation/ValidateHooksUsage.ts`, line 200-207
   - The TS has a detailed comment about skipping unknown phi operands and the need for fixpoint iteration. The Rust version does the same logic but without the comment.

8. **`hook_kind_display` is a standalone function rather than a method**
   - Rust file: `compiler/crates/react_compiler_validation/src/validate_hooks_usage.rs`, line 471-489
   - No direct TS equivalent; TS uses the string value of the `hookKind` enum directly.

## Architectural Differences

1. **Two-phase collect/apply in `visit_function_expression`**
   - Rust file: `compiler/crates/react_compiler_validation/src/validate_hooks_usage.rs`, line 417-468
   - The Rust version collects call sites and nested function IDs into vectors, then processes them after releasing the borrow on `env.functions`. The TS version accesses everything directly since JS has no borrow checker.

2. **Arena-based identifier/type/function access**
   - Throughout the file, identifiers are accessed via `env.identifiers[id.0 as usize]`, types via `env.types[id.0 as usize]`, functions via `env.functions[func_id.0 as usize]`.

3. **`visit_all_operands` manual enumeration vs. `eachInstructionOperand` visitor**
   - Rust file: `compiler/crates/react_compiler_validation/src/validate_hooks_usage.rs`, line 521-698
   - The Rust version manually enumerates every `InstructionValue` variant and visits their operands. The TS uses a generic `eachInstructionOperand` visitor generator. The Rust approach is more verbose but exhaustive via `match`.

4. **`each_terminal_operand_places` manual enumeration vs. `eachTerminalOperand`**
   - Rust file: `compiler/crates/react_compiler_validation/src/validate_hooks_usage.rs`, line 701-726
   - Same pattern as above -- manual enumeration instead of a shared visitor.

## Missing TypeScript Features

1. **`assertExhaustive` calls in PropertyLoad/Destructure switch cases**
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Validation/ValidateHooksUsage.ts`, line 306, 385
   - The TS uses `assertExhaustive(objectKind, ...)` in the `default` case of the Kind switch. The Rust version uses exhaustive `match` which achieves the same compile-time guarantee without a runtime assertion.
