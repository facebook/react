# Review: react_compiler_ssa/src/rewrite_instruction_kinds_based_on_reassignment.rs

## Corresponding TypeScript source
- `compiler/packages/babel-plugin-react-compiler/src/SSA/RewriteInstructionKindsBasedOnReassignment.ts`

## Summary
The Rust implementation is a faithful port of the TypeScript pass. The algorithm correctly identifies first declarations vs reassignments and sets InstructionKind accordingly (Const/Let for first assignments, Reassign for subsequent ones). The main difference is the use of a two-phase collect/apply pattern in Rust to avoid borrow conflicts, versus direct mutation in TypeScript.

## Major Issues
None.

## Moderate Issues

1. **Error handling uses `eprintln!` instead of `CompilerError.invariant`**: rewrite_instruction_kinds_based_on_reassignment.rs:142-158, 174-177, 185-192
   - **TS**: Uses `CompilerError.invariant(condition, {...})` which throws an exception if the condition is false (RewriteInstructionKindsBasedOnReassignment.ts:98-107, 114-117, 119-128, 131-140).
   - **Rust**: Uses `eprintln!` to print error messages but continues execution.
   - **Impact**: The Rust version is more lenient and continues processing even when invariants are violated. The TS version would abort compilation.
   - **Lines**:
     - 142-148: Unnamed place inconsistency check
     - 153-158: Named reassigned place inconsistency check
     - 174-177: Value block TODO check
     - 185-192: New declaration place inconsistency check

2. **DeclareLocal invariant uses `debug_assert!` instead of throwing**: rewrite_instruction_kinds_based_on_reassignment.rs:94-97
   - **TS**: Uses `CompilerError.invariant` which always checks and throws (RewriteInstructionKindsBasedOnReassignment.ts:58-65).
   - **Rust**: Uses `debug_assert!` which only checks in debug builds, not release builds.
   - **Impact**: In release builds, this invariant is not checked. If a variable is defined prior to declaration, the Rust version might silently proceed while the TS version would abort.

3. **PostfixUpdate/PrefixUpdate invariant removed**: rewrite_instruction_kinds_based_on_reassignment.rs:203-206
   - **TS**: Uses `CompilerError.invariant(declaration !== undefined, {...})` to ensure the variable was defined (RewriteInstructionKindsBasedOnReassignment.ts:157-161).
   - **Rust**: Uses `let Some(existing) = declarations.get(&decl_id) else { continue; }` which silently skips if not found.
   - **Impact**: The Rust version is more lenient. If an update operation references an undefined variable, it's silently ignored instead of aborting compilation.

4. **StoreLocal invariant check removed**: rewrite_instruction_kinds_based_on_reassignment.rs:124
   - **TS**: Has an invariant check that `declaration === undefined` when storing a new declaration (RewriteInstructionKindsBasedOnReassignment.ts:76-82).
   - **Rust**: Uses `if let Some(existing) = declarations.get(&decl_id)` without the invariant check.
   - **Impact**: The TS would catch bugs where a variable is somehow already in the declarations map before its first StoreLocal. The Rust version would silently treat it as a reassignment.

## Minor Issues

1. **Pass documentation in header comment instead of doc comment**: rewrite_instruction_kinds_based_on_reassignment.rs:6-16
   - **TS**: Has a JSDoc comment on the function (RewriteInstructionKindsBasedOnReassignment.ts:21-30).
   - **Rust**: Has a file-level doc comment (`//!`) instead of a function-level doc comment (`///`).
   - The Rust documentation is more detailed and mentions the porting source.

2. **Function signature differs in parameter types**: rewrite_instruction_kinds_based_on_reassignment.rs:44-47
   - **TS**: `fn: HIRFunction` (RewriteInstructionKindsBasedOnReassignment.ts:31-33).
   - **Rust**: `func: &mut HirFunction, env: &Environment`.
   - The Rust version separates `env` from `func` following the architectural pattern, and takes `&Environment` (immutable) since it only reads identifier metadata.

3. **`DeclarationLoc` enum instead of storing LValue/LValuePattern references**: rewrite_instruction_kinds_based_on_reassignment.rs:34-42
   - **TS**: `declarations: Map<DeclarationId, LValue | LValuePattern>` stores references to the actual lvalue objects and mutates their `kind` field directly (RewriteInstructionKindsBasedOnReassignment.ts:34).
   - **Rust**: Uses a `DeclarationLoc` enum to track locations as `Instruction { block_index, instr_local_index }` or `ParamOrContext`.
   - This is necessary because Rust can't mutate through stored references while iterating. The two-phase collect/apply pattern is used instead.

4. **Separate tracking vectors for mutations**: rewrite_instruction_kinds_based_on_reassignment.rs:54-60
   - The Rust version uses separate `Vec`s to track which locations need which `InstructionKind` value:
     - `reassign_locs: Vec<(usize, usize)>`
     - `let_locs: Vec<(usize, usize)>`
     - `const_locs: Vec<(usize, usize)>`
     - `destructure_kind_locs: Vec<(usize, usize, InstructionKind)>`
   - The TS version mutates directly via stored references.
   - This is a necessary architectural difference for Rust's borrow checker.

5. **Block processing uses indexed iteration**: rewrite_instruction_kinds_based_on_reassignment.rs:83-84
   - **TS**: Iterates `for (const [, block] of fn.body.blocks)` (RewriteInstructionKindsBasedOnReassignment.ts:52).
   - **Rust**: Collects block keys, then iterates with `for (block_index, block_id) in block_keys.iter().enumerate()`.
   - This is needed to track block indices for the two-phase pattern.

6. **Instruction access via instruction table**: rewrite_instruction_kinds_based_on_reassignment.rs:88
   - **Rust**: `&func.instructions[instr_id.0 as usize]`
   - **TS**: Iterates `block.instructions` directly.

7. **Destructure kind logic uses `Option<InstructionKind>` instead of `InstructionKind | null`**: rewrite_instruction_kinds_based_on_reassignment.rs:138-196
   - Semantically equivalent, just idiomatic for each language.

8. **`each_pattern_operands` helper function**: rewrite_instruction_kinds_based_on_reassignment.rs:282-304
   - **Rust**: Defines a helper `each_pattern_operands` that returns `Vec<Place>`.
   - **TS**: Uses the shared visitor `eachPatternOperand` (RewriteInstructionKindsBasedOnReassignment.ts:19, 96) which is a generator function.

9. **Copyright header present in Rust**: rewrite_instruction_kinds_based_on_reassignment.rs:1-4
   - The Rust file has the Meta copyright header (unlike the other SSA files reviewed).

## Architectural Differences

1. **Two-phase collect/apply pattern**: rewrite_instruction_kinds_based_on_reassignment.rs:48-60, 224-278
   - **TS**: Mutates `lvalue.kind` directly through stored references as the pass runs.
   - **Rust**: Phase 1 collects which locations need updates in tracking vectors. Phase 2 applies all mutations.
   - This is necessary because Rust's borrow checker prevents mutating instructions while iterating blocks.

2. **`DeclarationLoc` enum to track locations**: rewrite_instruction_kinds_based_on_reassignment.rs:34-42
   - **TS**: Stores `LValue | LValuePattern` references directly.
   - **Rust**: Stores location information (block index, instruction index) or a marker for params/context.

3. **Separate `env` parameter**: rewrite_instruction_kinds_based_on_reassignment.rs:46
   - The Rust version takes `env: &Environment` to access identifier metadata.
   - The TS version accesses identifiers via `place.identifier` which has inline metadata.

4. **Indexed block iteration**: rewrite_instruction_kinds_based_on_reassignment.rs:83-84
   - Needed to track block indices for the location-based mutation pattern.

## Missing from Rust Port

1. **`eachPatternOperand` shared visitor**: RewriteInstructionKindsBasedOnReassignment.ts:19, 96
   - **TS**: Uses the shared visitor from `visitors.ts`.
   - **Rust**: Implements its own `each_pattern_operands` helper.
   - This is consistent with the pattern in other SSA passes where Rust implements its own visitors.

2. **Comprehensive invariant checking**: Multiple locations
   - The Rust version is more lenient, using `eprintln!`, `debug_assert!`, or early returns instead of throwing on invariant violations.
   - The TS version would abort compilation on invariant violations.

## Additional in Rust Port

1. **`DeclarationLoc` enum**: rewrite_instruction_kinds_based_on_reassignment.rs:34-42
   - Needed for the two-phase pattern.

2. **Tracking vectors for mutations**: rewrite_instruction_kinds_based_on_reassignment.rs:54-60
   - `reassign_locs`, `let_locs`, `const_locs`, `destructure_kind_locs`
   - Needed for the two-phase pattern.

3. **`each_pattern_operands` helper**: rewrite_instruction_kinds_based_on_reassignment.rs:282-304
   - Replaces the shared `eachPatternOperand` visitor.

4. **More detailed documentation**: rewrite_instruction_kinds_based_on_reassignment.rs:6-16
   - The file-level doc comment is more detailed than the TS function doc comment.
