# Review: compiler/crates/react_compiler_optimization/src/outline_jsx.rs

## Corresponding TypeScript Source
`compiler/packages/babel-plugin-react-compiler/src/Optimization/OutlineJsx.ts`

## Summary
Complex port of JSX outlining that extracts JSX expressions in callbacks into separate component functions. The implementation handles props collection, dependency rewriting, and component generation with appropriate multi-phase processing for Rust's borrow checker.

## Issues

### Major Issues
None found

### Moderate Issues

1. **Line 261: Missing `env.programContext.addNewReference(newName)` call**
   - TS file: Calls `env.programContext.addNewReference(newName)` to track newly generated prop names
   - Rust file: Line 261 has comment "We don't have programContext in Rust, but this is needed for unique name tracking"
   - Impact: May miss tracking of generated names which could lead to name collisions if programContext is relied upon elsewhere
   - This is a known limitation documented in the code

### Minor/Stylistic Issues

1. **Lines 73-83: InstrAction enum for deferred processing**
   - Uses enum to defer action decisions to avoid borrow conflicts
   - TS can make decisions inline during iteration
   - Standard Rust pattern

2. **Line 124: Uses `placeholder_function()` with `std::mem::replace`**
   - Standard pattern for processing arena-stored functions
   - TS can recurse directly

3. **Line 185: Calls `super::dead_code_elimination(func, env)` after rewriting**
   - Uses relative module path
   - TS likely imports and calls DCE similarly

## Architectural Differences

1. **Two-phase instruction collection and processing**: Lines 73-154 first collect actions about what to do (LoadGlobal, FunctionExpr, JsxExpr), then process them in a second phase. Necessary to avoid borrow conflicts.

2. **Reverse iteration**: Line 86 iterates instructions in reverse (`(0..instr_ids.len()).rev()`). Matches TS reverse iteration pattern.

3. **props parameter creation**: Lines 387-396 create props object identifier with promoted name. Standard pattern for creating synthetic identifiers in Rust port.

4. **Destructure instruction generation**: Lines 399 calls `emit_destructure_props` which builds a full destructuring pattern. TS likely has similar logic.

5. **Complete function building**: Lines 421-473 manually construct an entire HirFunction with entry block, instructions, terminal, etc. TS likely uses similar construction but with more convenient builder patterns.

## Completeness

All functionality correctly ported:
- Recursive processing of inner functions
- JSX group detection and collection
- Children ID tracking to group related JSX
- Props collection from JSX attributes and children
- Name generation with collision avoidance
- LoadGlobal instruction emission for outlined component
- Replacement JSX instruction generation
- Outlined function creation with:
  - Props parameter destructuring
  - LoadGlobal instructions for JSX tags
  - Updated JSX instructions with remapped props
  - Return terminal
- Promotion of child identifiers to named temporaries
- Special handling of "key" prop (filtered out)
- Component-level filtering (only outlines in callbacks, not top-level components)
- Integration with dead code elimination
- Outlined function registration via `env.outline_function`

Known limitations (documented):
1. Missing `programContext.addNewReference` call for name tracking

The implementation is otherwise complete and handles the complex JSX outlining transformation correctly.
