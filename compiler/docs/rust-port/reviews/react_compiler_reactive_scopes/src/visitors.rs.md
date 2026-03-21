# Review: compiler/crates/react_compiler_reactive_scopes/src/visitors.rs

## Corresponding TypeScript Source
`compiler/packages/babel-plugin-react-compiler/src/ReactiveScopes/visitors.ts`

## Summary
The Rust port provides trait-based visitor and transform patterns for ReactiveFunction trees. The implementation is structurally faithful to the TypeScript version with adaptations for Rust's ownership model and trait system.

## Issues

### Major Issues
None found.

### Moderate Issues

1. **visitors.rs:386 - Missing visit_lvalue call in traverse_instruction**
   - **TS Behavior**: Line 441-442 in TS calls `for (const operand of eachInstructionLValue(instruction)) { this.visitLValue(instruction.id, operand, state); }`
   - **Rust Behavior**: Lines 382-390 - The Rust version visits lvalues from `each_instruction_value_lvalue` which only visits lvalues from within the value, but does NOT visit `instruction.lvalue` itself
   - **Impact**: The Rust visitor may miss top-level instruction lvalues, which could cause downstream passes that depend on visiting all lvalues to behave incorrectly
   - **Fix needed**: Add a visit to `instruction.lvalue` before visiting value lvalues:
     ```rust
     if let Some(lvalue) = &instruction.lvalue {
         self.visit_lvalue(instruction.id, lvalue, state);
     }
     for place in each_instruction_value_lvalue(&instruction.value) {
         self.visit_lvalue(instruction.id, place, state);
     }
     ```

### Minor/Stylistic Issues

1. **visitors.rs:29 - Missing visitParam method**
   - **TS Behavior**: Line 39 - `visitParam(_place: Place, _state: TState): void {}`
   - **Rust Behavior**: Not present in the trait
   - **Impact**: Minor - visitParam is never used in the TS codebase except in one place (`visitHirFunction` which visits HIR not ReactiveFunction). This may have been intentionally omitted but creates an inconsistency.

2. **visitors.rs:42 - Missing visitReactiveFunctionValue method**
   - **TS Behavior**: Lines 42-47 in TS define `visitReactiveFunctionValue`
   - **Rust Behavior**: Not present in either trait
   - **Impact**: Minor - This method is used for visiting inner reactive functions (from FunctionExpression/ObjectMethod after they've been converted to ReactiveFunction). Since the Rust port hasn't converted inner functions to ReactiveFunction yet (they use the HIR Function arena), this omission is consistent with current architecture.

3. **visitors.rs:288-293 - TransformedValue enum has unused dead_code attribute**
   - **Issue**: The enum is marked `#[allow(dead_code)]` but appears to be genuinely unused
   - **Impact**: Code cleanliness - should either be removed or the attribute removed if it's used somewhere
   - **Recommendation**: Remove the enum if truly unused, or document why it's kept for future use

4. **visitors.rs:586-598 - Temporary placeholder construction in traverse_block**
   - **Issue**: Lines 586-597 create a temporary `ReactiveStatement::Instruction` with placeholder values to satisfy Rust's ownership rules
   - **Contrast**: TypeScript can simply iterate and modify in place
   - **Impact**: Minor performance overhead and code complexity, but necessary for Rust's ownership model
   - **Note**: This is an acceptable architectural difference

5. **visitors.rs:171 - Missing handlerBinding visit in try terminal (visitor trait)**
   - **TS Behavior**: Line 559-561 in transform trait visits `handlerBinding`
   - **Rust Behavior**: Lines 208-211 visit `handler_binding` correctly
   - **Impact**: None - this is actually correct in Rust, the TS visitor just doesn't check for null before calling visitPlace

## Architectural Differences

1. **Trait-based vs Class-based**: Rust uses traits (`ReactiveFunctionVisitor`, `ReactiveFunctionTransform`) with associated State types, while TypeScript uses generic classes. This is idiomatic for each language.

2. **Borrowed vs Owned traversal**: Rust's visitor trait takes `&self` and `&Item` while the transform takes `&mut self` and `&mut Item`. TypeScript doesn't have this distinction.

3. **Return types for transforms**: Rust uses an enum `Transformed<T>` while TypeScript uses tagged unions like `{kind: 'keep'}`. Both represent the same concepts.

4. **Helper function placement**: The helper functions (`each_instruction_value_lvalue`, `each_instruction_value_operand`, etc.) are defined in the same file in Rust, while TypeScript imports them from `../HIR/visitors.ts`. This is fine as long as the logic is equivalent.

5. **Iteration strategy in traverse_block**: The Rust transform uses a two-phase approach (collecting into `next_block` when needed) due to borrowing rules, while TypeScript can mutate in place with slice/push operations. Both achieve the same result.

## Completeness

### Missing Functionality

1. **visitHirFunction method**: The TS visitor class has a `visitHirFunction` method (lines 233-252) that visits HIR functions and their nested functions. This is not present in the Rust traits. This is intentional since the Rust ReactiveFunction visitors are for ReactiveFunction only, not HIR.

2. **eachReactiveValueOperand function**: TS exports this (lines 575-605) but Rust doesn't have a public equivalent. The Rust version has `each_instruction_value_operand` which is similar but not exported for ReactiveValue.

3. **mapTerminalBlocks function**: TS exports this helper (lines 607-666) but Rust doesn't provide it. This could be useful for passes that need to transform blocks within terminals.

### Complete Functionality

The core visitor and transform patterns are complete and functional. The main traversal logic for all ReactiveStatement, ReactiveTerminal, ReactiveValue types is present and correct.
