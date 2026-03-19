# Review: compiler/crates/react_compiler_optimization/src/drop_manual_memoization.rs

## Corresponding TypeScript file(s)
- compiler/packages/babel-plugin-react-compiler/src/Inference/DropManualMemoization.ts

## Summary
The Rust port is a reasonable translation of the TypeScript pass. The overall structure -- two-phase approach (identify and rewrite manual memo calls, then insert markers) -- is preserved. The most significant divergence is in how `useMemo`/`useCallback` callees are identified: the Rust version matches on binding names directly instead of using `getGlobalDeclaration` + `getHookKindForType`. There are also differences in the `FinishMemoize` instruction (missing `pruned` field in TS), differences in how the `functions` sidemap stores data, and the `deps_loc` wrapping in `StartMemoize`.

## Major Issues

1. **Hook detection uses name matching instead of type system resolution**
   - Rust file: `compiler/crates/react_compiler_optimization/src/drop_manual_memoization.rs:276-304`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Inference/DropManualMemoization.ts:141-151`
   - The TS version uses `env.getGlobalDeclaration(value.binding, value.loc)` followed by `getHookKindForType(env, global)` to resolve the binding through the type system. The Rust version matches on the binding name string directly (`"useMemo"`, `"useCallback"`, `"React"`). This means:
     - Custom hooks aliased to useMemo/useCallback won't be detected
     - Re-exports or renamed imports won't be detected
   - The Rust code has a documented TODO for this.

2. **`FinishMemoize` includes `pruned: false` field not present in TS**
   - Rust file: `compiler/crates/react_compiler_optimization/src/drop_manual_memoization.rs:511`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Inference/DropManualMemoization.ts:218-224`
   - The Rust `FinishMemoize` instruction value includes `pruned: false`. The TS version does not have a `pruned` field on `FinishMemoize` at this point in the pipeline. This may be a field that's added later in TS (e.g., during scope pruning) or it may be a Rust-specific addition. If the TS `FinishMemoize` type does not include `pruned`, this could indicate a data model divergence.

## Moderate Issues

1. **`collectMaybeMemoDependencies` takes `env: &Environment` parameter; TS version does not**
   - Rust file: `compiler/crates/react_compiler_optimization/src/drop_manual_memoization.rs:376-381`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Inference/DropManualMemoization.ts:54-58`
   - The Rust version needs `env` to look up `identifier.name` from the arena. The TS version accesses `value.place.identifier.name` directly from the shared object reference. This changes the public API of `collectMaybeMemoDependencies`.

2. **`functions` sidemap stores `HashSet<IdentifierId>` vs `Map<IdentifierId, TInstruction<FunctionExpression>>`**
   - Rust file: `compiler/crates/react_compiler_optimization/src/drop_manual_memoization.rs:45`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Inference/DropManualMemoization.ts:42`
   - The TS version stores the entire `TInstruction<FunctionExpression>` in the sidemap, while the Rust version only stores the identifier IDs in a `HashSet`. This means the Rust version loses access to the full instruction data. Currently only the existence check (`sidemap.functions.has(fnPlace.identifier.id)`) is used, so this is functionally equivalent, but it limits future extensibility.

3. **`deps_loc` in `StartMemoize` is wrapped in `Some()` in Rust, nullable in TS**
   - Rust file: `compiler/crates/react_compiler_optimization/src/drop_manual_memoization.rs:499`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Inference/DropManualMemoization.ts:206`
   - The Rust version wraps `deps_loc` in `Some(deps_loc)` making it `Option<Option<SourceLocation>>` (since `deps_loc` itself is already `Option<SourceLocation>`). The TS version uses `depsLoc` directly which is `SourceLocation | null`. This double-wrapping seems unintentional and may cause downstream issues where a `Some(None)` is treated differently from `None`.

4. **Phase 2 queued inserts: TS uses `instr.id` (EvaluationOrder), Rust uses `InstructionId` (table index)**
   - Rust file: `compiler/crates/react_compiler_optimization/src/drop_manual_memoization.rs:100,147,257-258`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Inference/DropManualMemoization.ts:416,513-514,532`
   - The TS version keys `queuedInserts` by `InstructionId` (which is the TS evaluation order / `instr.id`). The Rust version keys by `InstructionId` (which is the instruction table index). The TS `queuedInserts.get(instr.id)` matches on the evaluation order. The Rust `queued_inserts.get(&instr_id)` matches on the table index. The Rust approach uses `manualMemo.load_instr_id` and `instr_id` as keys, which should work correctly since these are unique per instruction.

5. **`ManualMemoCallee` stores `load_instr_id: InstructionId` (table index) vs TS storing the entire instruction**
   - Rust file: `compiler/crates/react_compiler_optimization/src/drop_manual_memoization.rs:38-41`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Inference/DropManualMemoization.ts:36-38`
   - TS stores `loadInstr: TInstruction<LoadGlobal> | TInstruction<PropertyLoad>` (the whole instruction reference). Rust stores `load_instr_id: InstructionId`. In the TS version, `queuedInserts.set(manualMemo.loadInstr.id, startMarker)` uses the instruction's evaluation order ID. In the Rust version, `queued_inserts.insert(manual_memo.load_instr_id, start_marker)` uses the table index. The Rust Phase 2 loop iterates `block.instructions` which contains `InstructionId` table indices, so this should match correctly.

6. **`collectTemporaries` for `StoreLocal`: Rust inserts both lvalue and instruction lvalue into `maybe_deps`**
   - Rust file: `compiler/crates/react_compiler_optimization/src/drop_manual_memoization.rs:361-367`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Inference/DropManualMemoization.ts:113-119,176-184`
   - In the TS version, `collectMaybeMemoDependencies` handles the StoreLocal case internally by inserting into `maybeDeps` directly: `maybeDeps.set(lvalue.id, aliased)`. Then `collectTemporaries` also inserts the result under the instruction's lvalue. In the Rust version, `collectMaybeMemoDependencies` cannot mutate `maybe_deps` (it takes a shared ref), so the caller `collect_temporaries` handles both insertions. The logic is split differently but the end result should be the same.

7. **`collect_maybe_memo_dependencies` for `LoadLocal`/`LoadContext`: identifier name lookup uses arena**
   - Rust file: `compiler/crates/react_compiler_optimization/src/drop_manual_memoization.rs:417-432`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Inference/DropManualMemoization.ts:86-104`
   - The TS accesses `value.place.identifier.name` directly. The Rust version accesses `env.identifiers[place.identifier.0 as usize].name` and checks for `Some(IdentifierName::Named(_))`. The TS checks `value.place.identifier.name.kind === 'named'`. These are equivalent given the arena architecture.

8. **`ArrayExpression` element check: Rust checks `ArrayElement::Place` vs TS checks `e.kind === 'Identifier'`**
   - Rust file: `compiler/crates/react_compiler_optimization/src/drop_manual_memoization.rs:331-349`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Inference/DropManualMemoization.ts:167-174`
   - The TS version checks `value.elements.every(e => e.kind === 'Identifier')` which filters out spreads and holes. The Rust version checks `ArrayElement::Place(p)` which does the same (spreads are `ArrayElement::Spread`, holes are `ArrayElement::Hole`). Functionally equivalent.

## Minor Issues

1. **Return type: Rust returns `Result<(), CompilerDiagnostic>`, TS returns `void`**
   - Rust file: `compiler/crates/react_compiler_optimization/src/drop_manual_memoization.rs:78`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Inference/DropManualMemoization.ts:391`
   - The Rust version returns a `Result` type even though it always returns `Ok(())`. The TS version returns `void`. The Rust signature allows for future error propagation but currently no errors are returned via `?`.

2. **Error diagnostic construction differs slightly**
   - Rust file: `compiler/crates/react_compiler_optimization/src/drop_manual_memoization.rs:213-229`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Inference/DropManualMemoization.ts:466-477`
   - The Rust version uses `CompilerDiagnostic::new(...).with_detail(...)`. The TS version uses `CompilerDiagnostic.create({...}).withDetails({...})`. The structure is similar but the API shapes differ.

3. **Missing `suggestions` field in diagnostic creation**
   - Rust file: `compiler/crates/react_compiler_optimization/src/drop_manual_memoization.rs:213-229`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Inference/DropManualMemoization.ts:469`
   - The TS version includes `suggestions: []` in some diagnostics. The Rust version does not include suggestions. This is a minor omission.

4. **Block iteration: Rust collects all block instructions up front**
   - Rust file: `compiler/crates/react_compiler_optimization/src/drop_manual_memoization.rs:104-109`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Inference/DropManualMemoization.ts:420`
   - The Rust version collects all block instruction lists into a Vec of Vecs to avoid borrow conflicts. The TS version iterates blocks directly.

5. **`Place` in `get_manual_memoization_replacement` for `useCallback` case**
   - Rust file: `compiler/crates/react_compiler_optimization/src/drop_manual_memoization.rs:473-482`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Inference/DropManualMemoization.ts:278-289`
   - The TS version includes `kind: 'Identifier'` in the Place construction. The Rust version does not have a `kind` field on Place (the Rust `Place` struct doesn't have this discriminator). Expected difference.

## Architectural Differences

1. **Identifier name access via arena**
   - Rust file: `compiler/crates/react_compiler_optimization/src/drop_manual_memoization.rs:418`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Inference/DropManualMemoization.ts:92-94`
   - Access pattern `env.identifiers[place.identifier.0 as usize].name` vs `value.place.identifier.name`.

2. **Environment accessed as separate parameter**
   - Rust file: `compiler/crates/react_compiler_optimization/src/drop_manual_memoization.rs:78`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Inference/DropManualMemoization.ts:391` (uses `func.env`)
   - Expected per architecture doc.

3. **Config flags accessed as `env.validate_preserve_existing_memoization_guarantees` vs `func.env.config.validatePreserveExistingMemoizationGuarantees`**
   - Rust file: `compiler/crates/react_compiler_optimization/src/drop_manual_memoization.rs:80-82`
   - TS file: `compiler/packages/babel-plugin-react-compiler/src/Inference/DropManualMemoization.ts:392-395`
   - The Rust version accesses config flags directly on `env` (they appear to be flattened out). The TS version accesses them via `func.env.config`.

4. **`InstructionId` type represents table index in Rust vs evaluation order in TS**
   - This affects all instruction references throughout the file. The Rust `InstructionId` is an index into `func.instructions`. The TS `InstructionId` is the evaluation order (`instr.id`).

## Missing TypeScript Features

1. **Type system integration for hook detection**
   - The TS version uses `env.getGlobalDeclaration()` and `getHookKindForType()` which leverages the type system to identify hooks. The Rust version falls back to name-based matching. This is documented with a TODO.
