# Status

HIR: complete (1653/1653)
PruneMaybeThrows: complete (1793/1793)
DropManualMemoization: complete (1652/1652)
InlineImmediatelyInvokedFunctionExpressions: complete (1652/1652)
MergeConsecutiveBlocks: complete (1652/1652)
SSA: complete (1651/1651)
EliminateRedundantPhi: complete (1651/1651)
ConstantPropagation: complete (1651/1651)
InferTypes: complete (1651/1651)
OptimizePropsMethodCalls: complete (1651/1651)
AnalyseFunctions: partial (1630/1636)
InferMutationAliasingEffects: partial (1609/1630)
OptimizeForSSR: todo
DeadCodeElimination: complete (1609/1609)
PruneMaybeThrows (2nd): complete (1762/1762)
InferMutationAliasingRanges: partial (1591/1609)
InferReactivePlaces: partial (1526/1591)
RewriteInstructionKindsBasedOnReassignment: partial (1500/1526)
InferReactiveScopeVariables: complete (1500/1500)
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

## 20260318-223712 Fix MergeConsecutiveBlocks and SSA failures

Fixed 39 failures (1 MergeConsecutiveBlocks + 38 SSA):
- Moved env.has_errors() bailout from before SSA to end of pipeline, matching TS behavior.
- Fixed SSA error event format (CompileUnexpectedThrow filtering, CompilerErrorDetail format).
- Fixed identifier formatting in SSA error descriptions to match TS printIdentifier() output.
- Added name$N normalization to test harness.
MergeConsecutiveBlocks 1652/1652, SSA 1651/1651, frontier moved to ConstantPropagation.

## 20260318-224340 Fix ConstantPropagation source location

Fixed PostfixUpdate constant propagation using the instruction loc instead of the
previous constant's loc. Now uses prev_loc from the matched constant.
ConstantPropagation 1651/1651, frontier moved to InferTypes (708 failures).

## 20260318-235832 Fix InferTypes pass — 708 failures resolved

Fixed all 708 InferTypes failures plus 1 OptimizePropsMethodCalls failure:
- Added `<generated_N>` shape ID normalization to test harness.
- Fixed built-in hook shape definitions (useState, useReducer, etc.) to use specific
  indexed properties instead of wildcard-only shapes.
- Fixed React namespace to reuse built-in hook types instead of auto-generating new ones.
- Added console/global/globalThis typed properties to shape definitions.
- Implemented Reanimated module type provider.
- Fixed inner function global type pre-resolution and hook property name fallback.
- Implemented enableTreatSetIdentifiersAsStateSetters config support.
- Fixed validateHooksUsage error ordering for nested functions.
All 1717 tests passing, 0 failures. Next pass to port: #11 AnalyseFunctions.

## 20260318-235832 Port AnalyseFunctions pass skeleton

Ported AnalyseFunctions pass (#11) from TypeScript. Created react_compiler_inference crate.
Pass skeleton is correct but inner function analysis depends on sub-passes not yet ported.
1108/1651 passing (543 crash during inner function analysis).
Commit: 92cc807a9f

## 20260319-014600 Fix InferMutationAliasingEffects effect inference bugs

Fixed legacy signature effects, inner function aliasingEffects population (Phase 2/3),
context variable effect classification, and built-in method calleeEffects in globals.rs.
Added mutableOnlyIfOperandsAreMutable optimization for Array methods.
968 passed (+12), AnalyseFunctions 1104/1108, InferMutationAliasingEffects 902/1104.
Remaining failures need inferMutationAliasingRanges and aliasing config porting.

## 20260319-023425 Add aliasing signature configs and fix Apply effects

Added aliasing configs for Array.push, Array.map, Set.add, Object.entries/keys/values.
Fixed spread argument self-capture and NewExpression callee mutation check.
InferMutationAliasingEffects: 202→2 failures. 1168/1717 passing overall.
Remaining 549 failures mostly from inner function analysis needing sub-passes.

## 20260319-025540 Port DeadCodeElimination pass

Ported DeadCodeElimination (#14) from TypeScript into react_compiler_optimization crate.
Wired into pipeline and inner function analysis (lower_with_mutation_aliasing).
DCE 1102/1102, 0 failures. Overall 1168/1717.

## 20260319-041553 Port PruneMaybeThrows (2nd) and InferMutationAliasingRanges

Added second PruneMaybeThrows call (#15) to pipeline.
Ported InferMutationAliasingRanges (#16) — computes mutable ranges, Place effects,
and function-level effects. Wired into pipeline and inner function analysis.
InferMutationAliasingRanges 1181/1218 (37 failures from unported inferReactiveScopeVariables).
Overall 1247/1717 (+79).

## 20260319-092045 Port InferReactivePlaces, RewriteInstructionKinds, InferReactiveScopeVariables

Ported three passes in parallel:
- InferReactivePlaces (#17): 951/1169 (81.3%) — post-dominator frontier differences
- RewriteInstructionKindsBasedOnReassignment (#18): 943/951 (98.7%)
- InferReactiveScopeVariables (#19): 112/943 (11.9%) — major issues with scope assignment
Overall 179/1717. InferReactiveScopeVariables needs significant fixing.

## 20260319-093515 Fix InferReactiveScopeVariables scope output

Added missing ReactiveScope fields (dependencies, declarations, reassignments, etc.).
Fixed debug printer to output all scope fields matching TS format.
Fixed DisjointSet ordering (HashMap→IndexMap) and scope loc computation.
InferReactiveScopeVariables: 1033/1033 (100%). Overall 1099/1717.
Remaining 618 failures in upstream passes, mainly InferReactivePlaces (397).

## 20260319-103726 Fix InferReactivePlaces — 397→173 failures

Fixed three bugs in InferReactivePlaces:
- Added FunctionExpression/ObjectMethod context variables as operands for reactivity propagation.
- Fixed useRef stable type detection (Object type, not just Function).
- Separated value operand vs lvalue flag setting to avoid over-marking.
InferReactivePlaces 1270/1443 (173 failures). Overall 1316/1717 (+217).

## 20260319-111719 Fix InferMutationAliasingEffects function expression Apply effects

Added function expression value tracking for Apply effects — when a callee is a
locally-declared function expression with known aliasing effects, use its signature
instead of falling through to the default "no signature" path.
InferMutationAliasingEffects: 110→21 failures. Overall 1401/1717 (+84).

## 20260319-141741 Fix InferMutationAliasingEffects and InferMutationAliasingRanges bugs

Fixed MutationReason formatting (AssignCurrentProperty), PropertyStore type check
(Type::Poly→Type::TypeVar), context/params effect ordering, and Switch/Try terminal
operand effects. Overall 1518→1566 passing (+48).
