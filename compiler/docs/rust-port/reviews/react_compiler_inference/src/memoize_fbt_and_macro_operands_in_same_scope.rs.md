# Review: react_compiler_inference/src/memoize_fbt_and_macro_operands_in_same_scope.rs

## Corresponding TypeScript source
- `compiler/packages/babel-plugin-react-compiler/src/ReactiveScopes/MemoizeFbtAndMacroOperandsInSameScope.ts`

## Summary
The Rust port is comprehensive and accurate. The macro definition structure, FBT tag setup, and two-phase analysis (forward/reverse data-flow) are all correctly ported with appropriate architectural adaptations.

## Major Issues
None.

## Moderate Issues

### 1. Different handling of self-referential fbt.enum macro
**Location:** `memoize_fbt_and_macro_operands_in_same_scope.rs:54-78`
**TypeScript:** `MemoizeFbtAndMacroOperandsInSameScope.ts:41-45`
**Issue:** The TypeScript version creates a self-referential structure: `FBT_MACRO.properties!.set('enum', FBT_MACRO)` (line 45), where `fbt.enum` recursively points to the same macro definition. The Rust version manually reconstructs this in `fbt_macro()` by cloning the structure for `enum_macro` and explicitly adding an `"enum"` property with `transitive_macro()`. This may not fully replicate the recursive structure. However, given Rust's ownership model, the explicit approach may be necessary and correct.

## Minor Issues

### 1. Missing SINGLE_CHILD_FBT_TAGS export
**Location:** Missing in Rust
**TypeScript:** `MemoizeFbtAndMacroOperandsInSameScope.ts:107-110`
**Issue:** The TypeScript version exports `SINGLE_CHILD_FBT_TAGS` constant: `export const SINGLE_CHILD_FBT_TAGS: Set<string> = new Set(['fbt:param', 'fbs:param'])`. This is not present in the Rust port. If this constant is used elsewhere in the codebase, it should be added.

### 2. Return value naming inconsistency
**Location:** `memoize_fbt_and_macro_operands_in_same_scope.rs:95-114`
**TypeScript:** `MemoizeFbtAndMacroOperandsInSameScope.ts:73-95`
**Issue:** Both return `Set<IdentifierId>` / `macro_values`, but the Rust function signature explicitly names it in the doc comment while TypeScript just returns it. This is fine, just a minor documentation style difference.

### 3. PrefixUpdate and PostfixUpdate handling in collect_instruction_value_operand_ids
**Location:** `memoize_fbt_and_macro_operands_in_same_scope.rs:630-634`
**TypeScript:** `MemoizeFbtAndMacroOperandsInSameScope.ts` uses `eachInstructionValueOperand` from visitors
**Issue:** The Rust version collects both `lvalue` and `value` for Prefix/PostfixUpdate instructions (lines 630-634). Need to verify this matches the behavior of the TypeScript `eachInstructionValueOperand` helper function for these instruction types.

## Architectural Differences

### 1. Macro definition structure uses owned types
**Location:** `memoize_fbt_and_macro_operands_in_same_scope.rs:32-78`
**TypeScript:** `MemoizeFbtAndMacroOperandsInSameScope.ts:28-45`
**Reason:** Rust uses `HashMap<String, MacroDefinition>` and clones macro definitions where needed. TypeScript uses `Map<string, MacroDefinition>` with shared references. The Rust approach avoids reference cycles that would be difficult to manage with Rust's ownership model.

### 2. Scope range expansion via environment
**Location:** `memoize_fbt_and_macro_operands_in_same_scope.rs:360-366`
**TypeScript:** `MemoizeFbtAndMacroOperandsInSameScope.ts:276-285`
**Reason:** Rust accesses scopes via arena: `env.scopes[scope_id.0 as usize].range.start`. TypeScript directly mutates: `fbtRange.start = makeInstructionId(...)`. The `expand_fbt_scope_range_on_env` function reads from the identifier's `mutable_range` and updates the scope's range.

### 3. Three separate visit functions instead of one
**Location:** `memoize_fbt_and_macro_operands_in_same_scope.rs:369-437`
**TypeScript:** `MemoizeFbtAndMacroOperandsInSameScope.ts:287-304`
**Reason:** Rust has three separate functions: `visit_operands_call`, `visit_operands_method`, and `visit_operands_value`. TypeScript has one `visitOperands` function that uses `eachInstructionValueOperand(value)`. The Rust approach handles the different instruction types explicitly.

### 4. Inline implementation of instruction operand collection
**Location:** `memoize_fbt_and_macro_operands_in_same_scope.rs:458-649`
**TypeScript:** Uses `eachInstructionValueOperand` from visitors
**Reason:** The Rust version implements `collect_instruction_value_operand_ids` inline within this module. TypeScript imports the helper from `../HIR/visitors`. The logic should be identical.

## Missing from Rust Port

### 1. SINGLE_CHILD_FBT_TAGS constant
**TypeScript:** `MemoizeFbtAndMacroOperandsInSameScope.ts:107-110`
**Missing:** The Rust version does not export this constant, which is used elsewhere in the codebase.

### 2. Macro type alias
**TypeScript:** Uses `Macro` type from `Environment` (line 17)
**Rust:** Uses `String` directly for macro names in `HashMap<String, MacroDefinition>`
**Issue:** Should verify if there's a `Macro` type alias in the Rust environment module that should be used instead of `String`.

## Additional in Rust Port

### 1. Helper functions for macro creation
**Location:** `memoize_fbt_and_macro_operands_in_same_scope.rs:40-78`
**Addition:** Rust has standalone functions `shallow_macro()`, `transitive_macro()`, and `fbt_macro()` to construct macro definitions. TypeScript uses const declarations: `SHALLOW_MACRO`, `TRANSITIVE_MACRO`, `FBT_MACRO`.

### 2. Separate visitor functions
**Location:** `memoize_fbt_and_macro_operands_in_same_scope.rs:369-437`
**Addition:** Three separate visitor functions for different instruction types, rather than one generic function.

### 3. process_operand helper
**Location:** `memoize_fbt_and_macro_operands_in_same_scope.rs:440-454`
**Addition:** Extracted common logic for processing individual operands into a helper function. TypeScript inlines this in `visitOperands`.

### 4. Complete collect_instruction_value_operand_ids implementation
**Location:** `memoize_fbt_and_macro_operands_in_same_scope.rs:458-649`
**Addition:** Full inline implementation of operand collection, rather than importing from visitors module.
