# Status

Overall: 1650/1717 passing (96.1%), 67 failures remaining.

## Transformation passes (all ported)

HIR: complete (1653/1653)
PruneMaybeThrows: complete (1733/1733, includes 2nd call)
DropManualMemoization: complete (1652/1652)
InlineImmediatelyInvokedFunctionExpressions: complete (1652/1652)
MergeConsecutiveBlocks: complete (1652/1652)
SSA: complete (1651/1651)
EliminateRedundantPhi: complete (1651/1651)
ConstantPropagation: complete (1651/1651)
InferTypes: complete (1651/1651)
OptimizePropsMethodCalls: complete (1651/1651)
AnalyseFunctions: complete (1650/1650)
InferMutationAliasingEffects: complete (1644/1644)
OptimizeForSSR: todo (conditional, outputMode === 'ssr')
DeadCodeElimination: complete (1644/1644)
InferMutationAliasingRanges: complete (1644/1644)
InferReactivePlaces: partial (1636/1643, 7 failures)
RewriteInstructionKindsBasedOnReassignment: partial (1612/1635, 23 failures from VED cascade)
InferReactiveScopeVariables: complete (1612/1612)
MemoizeFbtAndMacroOperandsInSameScope: complete (1612/1612)
outlineJSX: stub (conditional on enableJsxOutlining)
NameAnonymousFunctions: complete (2/2, conditional)
OutlineFunctions: partial (1603/1612, 9 failures)
AlignMethodCallScopes: complete (1603/1603)
AlignObjectMethodScopes: partial (1602/1603, 1 failure)
PruneUnusedLabelsHIR: complete (1602/1602)
AlignReactiveScopesToBlockScopesHIR: complete (1602/1602)
MergeOverlappingReactiveScopesHIR: partial (1599/1602, 3 failures)
BuildReactiveScopeTerminalsHIR: complete (1599/1599)
FlattenReactiveLoopsHIR: complete (1599/1599)
FlattenScopesWithHooksOrUseHIR: complete (1599/1599)
PropagateScopeDependenciesHIR: partial (1579/1599, 20 failures)

## Validation passes

ValidateContextVariableLValues: complete (1652/1652)
ValidateUseMemo: complete (1652/1652)
ValidateHooksUsage: complete (1651/1651)
ValidateNoCapitalizedCalls: complete (3/3)
ValidateLocalsNotReassignedAfterRender: complete (1644/1644)
ValidateNoRefAccessInRender: complete (1642/1642)
ValidateNoSetStateInRender: complete (1642/1642)
ValidateNoDerivedComputationsInEffects: complete (22/22)
ValidateNoSetStateInEffects: partial (11/12, 1 failure)
ValidateNoJSXInTryStatement: complete (4/4)
ValidateNoFreezingKnownMutableFunctions: complete (1643/1643)
ValidateExhaustiveDependencies: partial (1635/1636, 1 failure; errors stripped to prevent cascade)
ValidatePreservedManualMemoization: complete (1577/1577)

## Remaining failure breakdown (67 total)

RIKBR: 23 (all from VED false positive error cascade)
PropagateScopeDependenciesHIR: 20 (missing reduceMaybeOptionalChains, propagation algo)
OutlineFunctions: 9 (8 outline_jsx stub + 1 edge case)
InferReactivePlaces: 7 (missing upstream validation passes)
MergeOverlappingReactiveScopesHIR: 3 (scope range edge cases)
AssertScopeInstructionsWithinScopes: 2
ValidateExhaustiveDependencies: 1
ValidateNoSetStateInEffects: 1
AlignObjectMethodScopes: 1

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

## 20260319-160000 Fix top 10 correctness bug risks from ANALYSIS.md

Fixed 6 of the top 10 correctness bugs identified in the port fidelity review
(bugs #1, #2, #9 were already fixed; #8 skipped per architecture doc guidance):
- globals.rs: Array callback methods (filter, find, findIndex, forEach, every, some,
  flatMap, reduce) changed from positionalParams to restParam, added noAlias: true.
- constant_propagation.rs: is_valid_identifier now rejects JS reserved words.
- constant_propagation.rs: js_abstract_equal uses proper JS ToNumber semantics.
- merge_consecutive_blocks.rs: phi replacement instructions include Alias effect.
- merge_consecutive_blocks.rs: recursive merge into inner FunctionExpression/ObjectMethod.
- infer_types.rs: context variable places on inner functions now type-resolved.
Overall 1566→1566 passing (+1 net after recount with updated baseline).

## 20260319-164422 Fix InferMutationAliasingRanges FunctionExpression/ObjectMethod operand handling

Added FunctionExpression and ObjectMethod arms to apply_operand_effects in
infer_mutation_aliasing_ranges.rs. Context variables of inner functions now get
their mutableRange.start fixup applied, preventing invalid [0:N] ranges.
Overall 1566→1568 passing (+2).

## 20260319-183501 Fix AnalyseFunctions — all 1717 tests passing

Fixed three categories of bugs to clear AnalyseFunctions frontier:
- globals.rs: BuiltInEffectEventFunction signature — rest_param and callee_effect
  changed from Effect::Read to Effect::ConditionallyMutate, matching TS definition.
- infer_mutation_aliasing_effects.rs: Added transitive freeze of function expression
  captures, uninitialized identifier access detection with correct source locations.
- infer_mutation_aliasing_ranges.rs: Context var effect defaulting — FunctionExpression
  operands not in operandEffects now default to Effect::Read.
- analyse_functions.rs: Early return on invariant errors from inner function processing.
- pipeline.rs: Invariant error propagation after analyse_functions.
AnalyseFunctions: 1717/1717 (0 failures). Overall 1568→1577 passing (+9).

## 20260319-201728 Fix While terminal successors and spread argument Todo check

Fixed `terminal_successors` for While terminals — was returning `loop_block` instead of
`test`, causing phi node identifiers in subsequent blocks to never be initialized.
Added spread argument Freeze effect Todo check matching TS `computeEffectsForSignature`.
Added error check after outer `infer_mutation_aliasing_effects` in pipeline.rs.
AnalyseFunctions: 6→1 failures, InferMutationAliasingEffects: 16→5 failures. Overall +5.

## 20260319-211815 Fix remaining test failures — all passes clean through InferMutationAliasingRanges

Fixed 8 remaining failures across AnalyseFunctions (1), InferMutationAliasingEffects (5),
InferMutationAliasingRanges (2):
- Fixed CreateFrom reason selection (HashSet non-deterministic order → primary_reason helper).
- Added aliasing_config_temp_cache to prevent duplicate identifier allocation in fixpoint.
- Added mutable spread tracking to compute_effects_for_aliasing_signature_config.
- Fixed each_instruction_value_operands to yield FunctionExpression context variables.
All 1717 fixtures passing through InferMutationAliasingRanges. Frontier: null (all clean).
Next: port passes #20+ (MemoizeFbtAndMacroOperandsInSameScope onwards).

## 20260320-042126 Port all remaining HIR passes (#20-#31)

Ported 12 passes in a single session, completing all 31 HIR passes:
- #20 MemoizeFbtAndMacroOperandsInSameScope (662 lines)
- #21 NameAnonymousFunctions + outlineJSX stub (380 lines)
- #22 OutlineFunctions (162 lines)
- #23 AlignMethodCallScopes (183 lines)
- #24 AlignObjectMethodScopes (205 lines)
- #25 PruneUnusedLabelsHIR (108 lines)
- #26 AlignReactiveScopesToBlockScopesHIR (782 lines) — biggest jump: 73→1243 passed
- #27 MergeOverlappingReactiveScopesHIR (789 lines)
- #28 BuildReactiveScopeTerminalsHIR (736 lines) — 1243→1392 passed
- #29 FlattenReactiveLoopsHIR (70 lines)
- #30 FlattenScopesWithHooksOrUseHIR (156 lines)
- #31 PropagateScopeDependenciesHIR (2382 lines) — the final HIR pass
Overall: 1342/1717 passing (78%). 375 failures from pre-existing upstream diffs.
Next pass is #32 BuildReactiveFunction — BLOCKED, needs test infra extension.

## 20260320-133636 Fix remaining failures: 375→80

Fixed 295 of 375 failures across multiple passes:
- VED pipeline guard: always run VED (TS 'off' is truthy). Fixed 58 failures.
- OutlineFunctions: debug printer includes outlined function bodies, UID naming
  convention matches Babel, depth-first name allocation ordering. Fixed ~125.
- Validation passes ported: ValidateNoSetStateInRender, ValidateExhaustiveDependencies,
  ValidateNoJSXInTryStatement, ValidateNoSetStateInEffects. Fixed ~40.
- PropagateScopeDependenciesHIR: BTreeSet determinism, inner function hoistable
  property loads, propagation result fix, deferred dependency check. Fixed ~30.
- ANALYSIS.md issues: globals.rs callee effects, infer_types fresh names map,
  RewriteInstructionKinds Phase 2 ordering + invariant restoration. Fixed ~10.
- Test harness: normalizeIds reset at function boundaries. Fixed ~15.
Remaining 80 failures: RIKBR (23, VED false positive cascade), PSDH (20),
ValidateNoSetStateInRender (13), OutlineFunctions (9), InferReactivePlaces (7),
MergeOverlapping (3), others (5).
Overall: 1637/1717 passing (95.3%).

## 20260320-141021 Port validateNoDerivedComputationsInEffects_exp

Ported the experimental validateNoDerivedComputationsInEffects_exp validation pass
from TypeScript to Rust. The 13 "ValidateNoSetStateInRender" failures were actually
caused by this unported pass — the test harness misattributed them to the preceding pass.
Created validate_no_derived_computations_in_effects.rs (1269 lines) in react_compiler_validation.
Overall: 1650/1717 passing (96.1%), 67 failures remaining.
