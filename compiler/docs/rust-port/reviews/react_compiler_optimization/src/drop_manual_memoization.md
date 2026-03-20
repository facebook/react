# Review: react_compiler_optimization/src/drop_manual_memoization.rs

## Corresponding TypeScript source
- `compiler/packages/babel-plugin-react-compiler/src/Inference/DropManualMemoization.ts`

## Summary
The Rust port accurately implements DropManualMemoization, including manual memo detection, deps list extraction, validation markers, and optional chain tracking. Contains a documented divergence regarding type system usage.

## Major Issues
None

## Moderate Issues
None

## Minor Issues

### Documented Divergence: Type System Not Yet Ported
- **Rust (lines 276-286)**: Contains explicit DIVERGENCE comment explaining that the type/globals system is not yet ported, so the implementation matches on binding names directly instead of using `getGlobalDeclaration()` + `getHookKindForType()`
- **TS (lines 141-142)**: Uses `env.getGlobalDeclaration(value.binding, value.loc)` and `getHookKindForType(env, global)` to resolve hook kinds through the type system
- **Impact**: Custom hooks aliased to useMemo/useCallback won't be detected in Rust. Re-exports or renamed imports won't be detected. Behavior is equivalent for direct `useMemo`/`useCallback` imports and `React.useMemo`/`React.useCallback` member accesses.
- **Resolution**: TODO comment at line 285 indicates this should use `getGlobalDeclaration + getHookKindForType` once the type system is ported

## Architectural Differences
- **Rust (line 44)**: `IdentifierSidemap` uses `HashSet<IdentifierId>` for functions instead of `Map<IdentifierId, TInstruction<FunctionExpression>>`
- **TS (line 41)**: Stores full instruction references
- **Rust reasoning**: Only need to track presence, not full instruction
- **Rust (line 102-109)**: Two-phase collection of block instructions to avoid borrow conflicts
- **TS (line 420-421)**: Direct iteration `for (const [_, block] of func.body.blocks)`
- **Rust (line 155-157)**: Adds new instruction to flat `func.instructions` table and gets `InstructionId`
- **TS (line 533-536)**: Pushes instruction directly to `nextInstructions` array
- **Rust (line 360-367)**: For `StoreLocal`, inserts dependency into `sidemap.maybe_deps` for both the instruction lvalue and the StoreLocal's target
- **TS (line 117-118)**: Only inserts for the lvalue, relies on side effect in `collectMaybeMemoDependencies`
- **Rust (line 686-688)**: `panic!()` for unexpected terminal in optional
- **TS (line 588-591)**: Uses `CompilerError.invariant(false, ...)`

## Missing from Rust Port
None. All TS functionality is present, including:
- findOptionalPlaces helper
- collectMaybeMemoDependencies
- StartMemoize/FinishMemoize marker creation
- All validation logic
- Error recording for various edge cases

## Additional in Rust Port
None. No additional logic beyond the TS version.
