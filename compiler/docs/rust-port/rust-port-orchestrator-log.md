# Status

HIR: complete (1717/1717)
PruneMaybeThrows: partial (1715/1717)
DropManualMemoization: partial (1700/1717)
InlineImmediatelyInvokedFunctionExpressions: partial (1564/1717)
MergeConsecutiveBlocks: partial (1564/1717)
SSA: partial (1519/1717)
EliminateRedundantPhi: partial (1519/1717)
ConstantPropagation: partial (1518/1717)
InferTypes: partial (990/1717)
OptimizePropsMethodCalls: partial (973/1717)
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
