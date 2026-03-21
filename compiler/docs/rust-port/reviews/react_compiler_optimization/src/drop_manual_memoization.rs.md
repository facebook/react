# Review: compiler/crates/react_compiler_optimization/src/drop_manual_memoization.rs

## Corresponding TypeScript Source
`compiler/packages/babel-plugin-react-compiler/src/Inference/DropManualMemoization.ts`

## Summary
High-quality port of manual memoization removal (useMemo/useCallback) with appropriate architectural adaptations. The implementation correctly handles dependency tracking, marker insertion, and instruction replacement, with one major limitation around type-system-based hook detection that is explicitly documented.

## Issues

### Major Issues

1. **Lines 276-305: Missing type system integration for hook detection**
   - TS file: lines 138-145 use `env.getGlobalDeclaration(binding)` and `getHookKindForType()` to resolve hooks through the type system
   - Rust file: Lines 276-304 have explicit DIVERGENCE comment explaining the limitation
   - TS behavior: Correctly identifies renamed/aliased hooks like `import {useMemo as memo} from 'react'` or custom hooks
   - Rust behavior: Only matches on literal strings `"useMemo"`, `"useCallback"`, `"React"`
   - Impact: Misses manual memoization in code using renamed imports (`import {useMemo as memo}`) or wrapper hooks, leading to missed optimizations
   - The TODO comment explicitly notes this needs type system integration when available

### Moderate Issues
None found

### Minor/Stylistic Issues

1. **Line 498-499: Double Option wrapping**
   - The code wraps `deps_loc` (which is already `Option<SourceLocation>`) in `Some()`
   - Creates `deps_loc: Some(Option<SourceLocation>)`
   - Should likely be `deps_loc: deps_loc` or the type definition needs adjustment
   - Low impact as the value is likely unpacked correctly downstream

2. **Line 361-367: StoreLocal inserts into maybe_deps twice**
   - Lines 362-365 insert into `maybe_deps` for `lvalue.place.identifier`
   - Line 366 inserts the same value for `lvalue_id` (the instruction's lvalue)
   - This matches TS behavior where collectMaybeMemoDependencies inserts for the StoreLocal's target variable
   - The comment explains this but it's subtle

## Architectural Differences

1. **Two-phase instruction insertion**: Lines 99-170 collect queued insertions in HashMap, then apply in second phase. Necessary to avoid borrow conflicts when mutating `func.instructions` while iterating blocks. TS can insert immediately.

2. **Upfront block collection**: Lines 103-109 collect all block instruction lists to avoid borrowing `func` immutably while needing mutable access. Standard Rust port pattern.

3. **Public `collect_maybe_memo_dependencies`**: Line 376 marked `pub fn` for potential reuse. TS version is module-local.

4. **ManualMemoCallee stores InstructionId**: Line 40 stores `load_instr_id` to know where to insert StartMemoize marker. TS doesn't need this as it can insert relative to current position during iteration.

## Completeness

Correctly ported:
- useMemo/useCallback detection (name-based only, type system integration pending)
- React.useMemo/React.useCallback property access handling
- Inline function expression requirement validation with diagnostics
- Dependency list extraction and validation
- StartMemoize/FinishMemoize marker generation and insertion
- Instruction replacement (CallExpression for useMemo, LoadLocal for useCallback)
- Optional chain detection via `find_optional_places`
- Dependency tracking for named locals, globals, property loads
- All diagnostic messages match TS versions
- Context variable tracking through StoreLocal

Missing functionality:
1. Type system integration for hook detection (explicitly documented as TODO)

The implementation is otherwise complete and correct with the limitation well-documented.
