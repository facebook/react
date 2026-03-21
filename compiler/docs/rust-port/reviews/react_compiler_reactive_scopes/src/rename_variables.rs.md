# Review: compiler/crates/react_compiler_reactive_scopes/src/rename_variables.rs

## Corresponding TypeScript Source
compiler/packages/babel-plugin-react-compiler/src/ReactiveScopes/RenameVariables.ts

## Summary
The Rust port correctly implements the core variable renaming logic with good structural correspondence to TypeScript. However, it lacks support for reactive functions (nested components/hooks), is missing ProgramContext integration, and has some type safety differences. The overall algorithm and collision detection logic are correct.

## Issues

### Major Issues

1. **compiler/crates/react_compiler_reactive_scopes/src/rename_variables.rs:264-346** — Missing visitReactiveFunctionValue implementation
   - TypeScript line 115-122 has `visitReactiveFunctionValue` that recursively calls `renameVariablesImpl` for nested reactive functions
   - Rust has the signature at lines 264-268 but only visits params and HIR functions, not reactive functions
   - The Rust visitor in visit_value (lines 400-457) recursively visits `FunctionExpression`/`ObjectMethod` via `visit_hir_function` at line 433
   - But there's no equivalent to TypeScript's `visitReactiveFunctionValue` callback
   - **Impact**: Nested reactive functions (components defined inside components, or hooks inside hooks) won't have their variables renamed
   - **Note**: The architecture doc doesn't clarify if reactive functions are fully supported yet

2. **compiler/crates/react_compiler_reactive_scopes/src/rename_variables.rs:84** — Missing ProgramContext.addNewReference call
   - TypeScript line 163 calls `this.#programContext.addNewReference(name)` to track new variable names
   - Rust has no equivalent call
   - Verified: ProgramContext exists in Rust (react_compiler/src/entrypoint/imports.rs:36) with add_new_reference method (line 176)
   - However, Environment in Rust HIR doesn't have a program_context field (TypeScript Environment.ts:545 has it)
   - **Impact**: HIGH - The ProgramContext won't know about renamed variables, which may affect module import optimization or name conflict detection
   - **Required**: Add program_context field to Environment and call env.program_context.add_new_reference(name.clone()) after line 84

### Moderate Issues

3. **compiler/crates/react_compiler_reactive_scopes/src/rename_variables.rs:84** — IdentifierName::Named is correct
   - Rust creates `IdentifierName::Named(name.clone())` at line 84
   - TypeScript uses `makeIdentifierName(name)` at line 164
   - Verified: TypeScript `makeIdentifierName` returns `{kind: 'named', value: name}` (HIR.ts:1352-1355)
   - Both create a Named variant, which is correct for renamed identifiers
   - The original Promoted status is only used to determine the initial name pattern (t0/T0), then the result is always Named
   - **Impact**: None - this is correct behavior

4. **compiler/crates/react_compiler_reactive_scopes/src/rename_variables.rs:125-127** — Returns HashSet<String> instead of HashSet<ValidIdentifierName>
   - TypeScript returns `Set<ValidIdentifierName>` (line 130)
   - Rust returns `HashSet<String>` (line 119)
   - The result includes both `scopes.names` (which is `HashSet<String>`) and `globals` (also `HashSet<String>`)
   - TypeScript's `scopes.names` is `Set<ValidIdentifierName>` (line 130)
   - **Impact**: Type safety loss - callers can't rely on the strings being valid identifier names
   - **Note**: This may be intentional if `ValidIdentifierName` is not yet defined in Rust HIR

5. **compiler/crates/react_compiler_reactive_scopes/src/rename_variables.rs:136-144** — Params use different pattern matching
   - Rust matches on `ParamPattern::Place` vs `ParamPattern::Spread` (lines 137-140)
   - TypeScript checks `param.kind === 'Identifier'` vs `param.place.identifier` (lines 63-68)
   - The semantics should be equivalent, but the Rust version extracts identifiers from spreads directly
   - **Impact**: None if both patterns are semantically equivalent, but worth verifying

### Minor/Stylistic Issues

6. **compiler/crates/react_compiler_reactive_scopes/src/rename_variables.rs:61-82** — Temporary name generation logic verified correct
   - Rust initializes `id=0`, formats name, then increments: `name = format!("t{}", id); id += 1;` (lines 62-63)
   - TypeScript uses post-increment: `name = \`t${id++}\`` (line 150)
   - Both produce the same result: first temp is `t0`, second is `t1`, etc.
   - In the collision while loop (lines 71-82), Rust re-formats with the current `id` value
   - Since `id` was already incremented after the initial format, the while loop starts checking from `t1`
   - TypeScript's while loop (lines 154-158) also uses `id++`, producing the same sequence
   - **Impact**: None - both implementations produce identical naming sequences despite different code structure
   - **Note**: The Rust version is slightly less clear but functionally equivalent

7. **compiler/crates/react_compiler_reactive_scopes/src/rename_variables.rs:41-46** — Mutates environment identifiers directly
   - Rust: `env.identifiers[identifier_id.0 as usize].name = ...`
   - This is consistent with the arena pattern described in the architecture doc
   - However, it's verbose compared to TypeScript's `identifier.name = ...`
   - **Suggestion**: Consider a helper method on Environment like `env.set_identifier_name(id, name)` for clarity

8. **compiler/crates/react_compiler_reactive_scopes/src/rename_variables.rs:54** — Clones original_name unnecessarily
   - `let original_value = original_name.value().to_string();` allocates a new String
   - Could use `original_name.value()` (which returns `&str`) directly in most comparisons
   - **Impact**: Minor performance - one extra allocation per identifier

8. **compiler/crates/react_compiler_reactive_scopes/src/rename_variables.rs:161-167** — Collects scope declarations into Vec unnecessarily
   - Lines 161-164 collect declaration identifiers into a Vec, then iterate over them
   - Could iterate directly over `scope_data.declarations.iter()` if there are no borrow conflicts
   - **Impact**: Minor performance and clarity

9. **compiler/crates/react_compiler_reactive_scopes/src/rename_variables.rs:531-535** — Missing whitespace in function names
    - Functions like `collect_referenced_globals`, `collect_globals_block` use underscores (Rust convention)
    - TypeScript equivalents are `collectReferencedGlobals`, `collectReferencedGlobalsImpl` (camelCase)
    - This is correct for Rust but makes side-by-side comparison slightly harder
    - **Suggestion**: None - this is correct Rust style

10. **compiler/crates/react_compiler_reactive_scopes/src/rename_variables.rs:269-279** — Collects params into Vec unnecessarily
    - Similar to issue #9, collects params into `param_ids` Vec (lines 271-276) then iterates
    - Could potentially visit directly, but the borrow checker may require this pattern
    - **Impact**: Minor

11. **compiler/crates/react_compiler_reactive_scopes/src/rename_variables.rs:24-39** — Scopes struct fields are private
    - All fields are private with no public accessors
    - TypeScript uses `#` private fields (lines 126-130)
    - Both are equally encapsulated - this is good practice
    - **Note**: No issue, just documenting the difference

## Architectural Differences

1. **Arena-based identifiers**: The Rust version mutates `env.identifiers[id]` throughout instead of `identifier.name = ...`. This follows the architecture doc's arena pattern correctly.

2. **Separate env parameter**: `rename_variables` takes `env: &mut Environment` separately from `func: &mut ReactiveFunction`, matching the architectural guidance.

3. **Direct recursion instead of visitor pattern for collect_globals**: The TypeScript version uses the visitor infrastructure for collecting globals, while Rust implements direct recursive functions (`collect_globals_block`, `collect_globals_value`, etc.). This is simpler and more direct for a pure read-only traversal.

4. **Two-phase borrow pattern**: Lines 161-166 and 269-276 collect identifiers into a Vec before visiting them, likely to avoid borrowing conflicts with the environment. This is a common Rust pattern when mutating through an arena.

5. **Function arena access**: Lines 270, 282, 286, 294, 309 access inner functions via `&env.functions[func_id.0 as usize]` repeatedly. TypeScript has direct access to the inline function object. The Rust approach requires multiple arena lookups but is necessary for the arena architecture.

## Completeness

### Missing Functionality

1. **ReactiveFunction renaming**: No implementation of reactive function variable renaming (TypeScript's `visitReactiveFunctionValue` at lines 115-122). This would be needed for nested components/hooks.

2. **ProgramContext integration**: No call to `programContext.addNewReference(name)` which TypeScript does at line 163. This may be deferred until ProgramContext is ported.

3. **ValidIdentifierName type**: Returns `HashSet<String>` instead of `HashSet<ValidIdentifierName>`. May indicate ValidIdentifierName is not yet defined in the Rust HIR.

4. **makeIdentifierName helper**: Uses `IdentifierName::Named(name)` directly instead of a helper that might preserve Promoted status. The TypeScript `makeIdentifierName` may have special logic for handling different name types.

### Deviations from TypeScript Structure

1. **visitor.rs dependency**: The TypeScript visitor imports and extends `ReactiveFunctionVisitor` from `./visitors`. The Rust version imports `each_instruction_value_operand_public` from `crate::visitors` but doesn't seem to use the visitor pattern in the same way. The `Scopes` struct and helper functions implement the logic directly rather than through visitor callbacks.

2. **Visitor pattern implementation**: TypeScript uses a class-based visitor (`class Visitor extends ReactiveFunctionVisitor`) with method overrides. Rust implements the traversal logic directly in helper functions (`visit_block`, `visit_instruction`, etc.) rather than using a trait-based visitor pattern. This is actually simpler and more idiomatic for Rust when state mutation is needed.

3. **Error handling**: No error handling or Result types. TypeScript also doesn't throw errors in this pass, so this is consistent.

### Additional Notes

- The core renaming logic (collision detection, name generation for temporaries vs regular variables) appears correct
- The globals collection is complete and matches the TypeScript implementation
- The HIR function traversal (for nested function expressions) is implemented correctly
- Overall structural correspondence is high (~85-90%) despite the visitor pattern difference
