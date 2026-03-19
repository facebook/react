# Status

HIR: complete (1653/1653)
PruneMaybeThrows: complete (1653/1653)
DropManualMemoization: complete (1652/1652)
InlineImmediatelyInvokedFunctionExpressions: complete (1652/1652)
MergeConsecutiveBlocks: partial (1651/1652)
SSA: partial (1613/1651)
EliminateRedundantPhi: complete (1613/1613)
ConstantPropagation: partial (1612/1613)
InferTypes: partial (916/1612)
OptimizePropsMethodCalls: complete (916/916)
AnalyseFunctions: todo
InferMutationAliasingEffects: todo
OptimizeForSSR: todo
DeadCodeElimination: todo
PruneMaybeThrows (2nd): todo
InferMutationAliasingRanges: todo
InferReactivePlaces: todo
RewriteInstructionKindsBasedOnReassignment: todo
InferReactiveScopeVariables: todo
MemoizeFbtAndMacroOperandsInSameScope: todo
outlineJSX: todo
NameAnonymousFunctions: todo
OutlineFunctions: todo
AlignMethodCallScopes: todo
AlignObjectMethodScopes: todo
PruneUnusedLabelsHIR: todo
AlignReactiveScopesToBlockScopesHIR: todo
MergeOverlappingReactiveScopesHIR: todo
BuildReactiveScopeTerminalsHIR: todo
FlattenReactiveLoopsHIR: todo
FlattenScopesWithHooksOrUseHIR: todo
PropagateScopeDependenciesHIR: todo

# Logs

## 20260318-111828 Initial orchestrator status

First run of orchestrator. 10 passes ported (HIR through OptimizePropsMethodCalls).
All passes have failures: HIR (1), PruneMaybeThrows (2), DropManualMemoization (17),
IIFE (153), MergeConsecutiveBlocks (153), SSA (198), EliminateRedundantPhi (198),
ConstantPropagation (199), InferTypes (727), OptimizePropsMethodCalls (745).

## 20260318-134746 Fix HIR reserved-words error

Fixed error.reserved-words.ts failure. The `BabelPlugin.ts` catch block was missing
the `details` array in the CompileError event for reserved word errors from scope serialization.
HIR now 1717/1717, frontier moved to PruneMaybeThrows.

## 20260318-160000 Print inner functions in debug HIR output

Changed debug HIR printer (TS + Rust) to print full inner function bodies inline
instead of `loweredFunc: <HIRFunction>` placeholder. Also removed `Function #N:` header.
HIR regressed to 775/1717 as inner function differences are now visible.

## 20260318-210850 Fix inner function lowering bugs in HIR pass

Fixed multiple bugs exposed by the new inner function debug printing:
- Removed extra `is_context_identifier` fallback in hir_builder.rs that incorrectly
  emitted LoadContext instead of LoadLocal for non-context captured variables.
- Fixed source locations in gather_captured_context using IdentifierLocIndex lookup
  instead of fabricated byte-offset-based locs.
- Changed ScopeInfo.reference_to_binding from HashMap to IndexMap for deterministic
  insertion-order iteration matching Babel's traversal order.
- Added JSXOpeningElement loc tracking in identifier_loc_index for JSX context vars.
- Added node_type to UnsupportedNode for UpdateExpression and YieldExpression.
HIR now 1717/1717, frontier back to PruneMaybeThrows.

## 20260318-220322 Fix PruneMaybeThrows and validation pass failures

Fixed 15 failures at the PruneMaybeThrows frontier:
- Fixed unreachable block predecessor tracking in hir_builder.rs (preds were empty instead of cloned).
- Implemented validateContextVariableLValues — errors were written to temp_errors and discarded.
- Fixed validateUseMemo VoidUseMemo event logging to include diagnostic details array.
- Fixed place formatting in invariant error descriptions to match TS printPlace() output.
PruneMaybeThrows now 1653/1653, DropManualMemoization 1652/1652, frontier moved to MergeConsecutiveBlocks.
