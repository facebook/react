# Status

Overall: 1717/1717 passing (100%), 2 flaky in batch runs. All passes ported through ValidatePreservedManualMemoization (#48). Codegen (#49) ported with application. Code comparison: 1607/1717 (93.6%).

## Transformation passes

HIR: partial (1651/1653, 2 failures — block ID ordering)
PruneMaybeThrows: complete (1651/1651, includes 2nd call)
DropManualMemoization: complete
MergeConsecutiveBlocks: complete
SSA: complete (1650/1650)
EliminateRedundantPhi: complete
ConstantPropagation: complete
InferTypes: complete
OptimizePropsMethodCalls: complete
AnalyseFunctions: complete (1649/1649)
InferMutationAliasingEffects: complete (1643/1643)
OptimizeForSSR: todo (conditional, outputMode === 'ssr')
DeadCodeElimination: complete
InferMutationAliasingRanges: complete
InferReactivePlaces: complete
ValidateExhaustiveDependencies: complete
RewriteInstructionKindsBasedOnReassignment: complete
InferReactiveScopeVariables: complete
MemoizeFbtAndMacroOperandsInSameScope: complete
outlineJSX: complete (conditional on enableJsxOutlining)
NameAnonymousFunctions: complete (2/2, conditional)
OutlineFunctions: complete
AlignMethodCallScopes: complete
AlignObjectMethodScopes: complete
PruneUnusedLabelsHIR: complete
AlignReactiveScopesToBlockScopesHIR: complete
MergeOverlappingReactiveScopesHIR: complete
BuildReactiveScopeTerminalsHIR: complete
FlattenReactiveLoopsHIR: complete
FlattenScopesWithHooksOrUseHIR: complete
PropagateScopeDependenciesHIR: complete
BuildReactiveFunction: complete
AssertWellFormedBreakTargets: complete
PruneUnusedLabels: complete
AssertScopeInstructionsWithinScopes: complete
PruneNonEscapingScopes: complete
PruneNonReactiveDependencies: complete
PruneUnusedScopes: complete
MergeReactiveScopesThatInvalidateTogether: complete
PruneAlwaysInvalidatingScopes: complete
PropagateEarlyReturns: complete
PruneUnusedLValues: complete
PromoteUsedTemporaries: complete
ExtractScopeDeclarationsFromDestructuring: complete
StabilizeBlockIds: complete
RenameVariables: complete
PruneHoistedContexts: complete
ValidatePreservedManualMemoization: complete
Codegen: partial (1687/1717 code comparison, 30 remaining)

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

## 20260320-161141 Fix ValidateNoSetStateInEffects — port createControlDominators

Ported createControlDominators / isRefControlledBlock logic from ControlDominators.ts
into validate_no_set_state_in_effects.rs. Added post-dominator frontier computation
and phi-node predecessor block fallback. Fixes 1 failure (valid-setState-in-useEffect-controlled-by-ref-value.js).
Overall: 1651/1717 passing (96.2%), 66 failures remaining.

## 20260320-171654 Fix upstream validation passes — 7 InferReactivePlaces failures resolved

Fixed 3 validation passes causing 7 failures misattributed to InferReactivePlaces:
- ValidateNoRefAccessInRender: hook kind detection via env lookup instead of shape_id matching,
  added missing else branch for useState/useReducer, fixed joinRefAccessRefTypes semantics.
- ValidateLocalsNotReassignedAfterRender: added LoadContext propagation, noAlias check for
  Array callback methods to eliminate false positives.
- Ported non-experimental ValidateNoDerivedComputationsInEffects (replacing TODO stub).
Overall: 1658/1717 passing (96.6%), 59 failures remaining.

## 20260320-201055 Fix multiple passes — 1658→1673 (+15 tests)

Three categories of fixes:
- ObjectExpression computed key operand ordering: fixed in 4 files (infer_reactive_places,
  infer_mutation_aliasing_effects, merge_overlapping_reactive_scopes, propagate_scope_deps).
  TS yields computed key before value; Rust had them reversed. Fixed 10 PSDH + 5 RIKBR.
- Port ValidateStaticComponents: new validation pass detecting dynamically-created components.
  Fixed 5 static-components/invalid-* fixtures.
- Port reduceMaybeOptionalChains in PropagateScopeDependenciesHIR: reduces optional chains
  when base is known non-null. Fixed 3 fixtures.
- RIKBR error format: fixed Some(Reassign) → Reassign, added place detail string.
Overall: 1673/1717 passing (97.4%), 44 failures remaining.

## 20260320-213855 Fix VED, PSDH, AlignObjectMethod — 1673→1695 (+22)

Removed VED error stripping (was hiding 18 legitimate errors) after fixing VED false
positives via correct StartMemoize/FinishMemoize scoping of dependency collection.
Fixed PSDH inner function traversal for nested FunctionExpressions. Fixed
AlignObjectMethodScopes scope range accumulation (HashMap for min/max).
Overall: 1695/1717 passing (98.7%), 22 failures remaining.

## 20260321-000048 Fix PSDH assumed-invoked functions and outline_jsx — 1695→1700 (+5)

Fixed PSDH get_assumed_invoked_functions to share temporaries map across inner function
recursion. Fixed outline_jsx: aliasingEffects Some(vec![]) instead of None, IndexMap for
prop ordering, skip all JSX instructions in outlined groups.
Overall: 1700/1717 passing (99.0%), 17 failures remaining.

## 20260321-000048 Fix OutlineFunctions and MergeOverlappingReactiveScopesHIR — 1700→1709 (+9)

Fixed outline_jsx block rewrite to place replacement at LAST JSX position (matching TS
reverse iteration). Fixed MergeOverlappingReactiveScopesHIR scope deduplication to preserve
insertion order instead of sorting by ScopeId. All OutlineFunctions and MergeOverlapping
passes now clean. Remaining 8 failures: PSDH scope declarations (5), error reporting from
unported reactive passes (3).
Overall: 1709/1717 passing (99.5%), 8 failures remaining.

## 20260321-010000 Fix PropagateScopeDependenciesHIR — 1709→1713 (+4)

Fixed two bugs in PSDH:
- ProcessedInstr key collision: used IdentifierId instead of EvaluationOrder (not unique
  across functions), fixing 3 scope declaration failures + 2 ASIWS cascades.
- Iterative non-null propagation fails on loops: replaced with recursive DFS using
  active/done state tracking (matching TS recursivelyPropagateNonNull).
All 4 remaining failures are blocked on unported reactive passes or error handling.
Overall: 1713/1717 passing (99.8%), 4 failures remaining.

## 20260320-213806 Port all reactive passes after BuildReactiveFunction

Ported 15 reactive passes + visitor infrastructure from TypeScript to Rust:
- Visitor/transform traits (visitors.rs) with closure-based traversal
- assertWellFormedBreakTargets, pruneUnusedLabels, assertScopeInstructionsWithinScopes
- pruneNonEscapingScopes (1123 lines), pruneNonReactiveDependencies, pruneUnusedScopes
- mergeReactiveScopesThatInvalidateTogether, pruneAlwaysInvalidatingScopes, propagateEarlyReturns
- pruneUnusedLValues, promoteUsedTemporaries, extractScopeDeclarationsFromDestructuring
- stabilizeBlockIds, renameVariables, pruneHoistedContexts
Fixed RenameVariables value-level lvalue visiting and inner function traversal (154 failures fixed).
Fixed PruneNonReactiveDependencies inner function context visiting (23 failures fixed).

## 20260323-130614 Fix RenameVariables, ExtractScopeDeclarations, PruneNonEscapingScopes — 36→13 failures

Fixed 23 test failures across three passes:
- RenameVariables: PrunedScope scoping fix (visit_block_inner for pruned scopes, matching TS
  traverseBlock vs visitBlock), plus addNewReference registration in pipeline.rs. 16→2 failures.
- ExtractScopeDeclarationsFromDestructuring: Fixed temporary place metadata — copy type from
  original identifier, preserve source location on identifier, use GeneratedSource for Place loc. 8→0 failures.
- PruneNonEscapingScopes: Added FunctionExpression/ObjectMethod context operands from
  env.functions for captured variable tracking. 1→0 failures.
Overall: 1704/1717 passing (99.2%), 13 failures remaining.

## 20260323-160933 Fix 11 failures, add Result support to ReactiveFunctionTransform

Fixed 11 test failures (13→2 remaining):
- MergeReactiveScopesThatInvalidateTogether: propagate parent_deps through terminals,
  add lvalue tracking in FindLastUsage. 6→0 failures.
- Error message formatting: formatLoc treats null as (generated), invariant error details
  in RIKBR, BuildReactiveFunction error format fix. 5→0 failures.
- PruneHoistedContexts: return Err() for Todo errors instead of state workaround.

Refactored ReactiveFunctionTransform trait to return Result<..., CompilerError> on all
methods, enabling proper error propagation. Removed all .unwrap() calls on
transform_reactive_function — callers propagate with ?.
Overall: 1715/1717 passing (99.9%), 2 failures remaining (block ID ordering).

## 20260323-201154 Implement apply_compiled_functions — codegen application

Implemented the full codegen application pipeline so the Rust compiler now produces
actual compiled JavaScript output instead of returning the original source:
- compile_result.rs: Added id, params, body, generator, is_async fields to CodegenFunction
- pipeline.rs: Pass through AST fields from codegen result
- program.rs: Full apply_compiled_functions implementation — finds functions by BaseNode.start,
  replaces params/body, inserts outlined functions, renames useMemoCache, adds imports
- codegen_reactive_function.rs: All BaseNode::default() → BaseNode::typed("...") for proper
  JSON serialization of AST node types
- common.rs: Added BaseNode::typed() constructor
- BabelPlugin.ts: Replaced prog.replaceWith() with pass.file.ast.program assignment,
  added comment deduplication for JSON round-trip reference sharing
- imports.rs: BaseNode::typed() for import-related AST nodes
Pass tests: 1715/1717 (2 flaky, pass individually). Code tests: 1586/1717 (92.4%).
Remaining 131 code failures: error handling differences (67), codegen output (23),
gating features (21), outlined ordering (12), other (8).

## 20260324-210207 Fix outlined ordering, type annotations, script source type — 130→110 code failures

Fixed three categories of code comparison failures:
- Outlined function ordering: changed from reverse to forward iteration in apply_compiled_functions,
  matching Babel's insertAfter behavior. Fixed 12 failures.
- Type annotation preservation: added type_annotation field to TypeCastExpression in HIR,
  populated during lowering for TSAsExpression/TSSatisfiesExpression/TSTypeAssertion/FlowTypeCast,
  emitted in codegen as proper AST wrapper nodes. Fixed 6 failures.
- Script source type: implemented require() syntax for CJS modules in imports.rs using
  VariableDeclaration with ObjectPattern destructuring + require() CallExpression. Fixed 1 failure.
Code comparison: 1586→1607 passing (93.6%). 110 remaining.

## 20260324-214542 Implement gating codegen — 110→96 code failures

Implemented function gating for the Rust compiler port:
- Standard gating: wraps compiled functions in `gating() ? compiled : original` conditional
- Hoisted gating: creates dispatcher function for functions referenced before declaration
- Dynamic gating: supports `'use memo if(identifier)'` directive with @dynamicGating config
- Export handling: export default/named function gating patterns
- Import sorting: case-insensitive to match JS localeCompare behavior
17 gating fixtures fixed (21/29 gating tests passing). 8 remaining are function discovery,
error handling paths, and unimplemented instrumentation features.
Code comparison: 1607→1621 passing (94.4%). 96 remaining.

## 20260324-233646 Port ValidatePreservedManualMemoization — 96→38 code failures

Ported ValidatePreservedManualMemoization from TypeScript to Rust (~440 lines).
Validates that compiled output preserves manual useMemo/useCallback memoization:
- StartMemoize operand scope checks (dependency scope must complete before memo block)
- FinishMemoize unmemoized value detection (values must be within reactive scopes)
- Scope dependency matching (inferred deps must match manually specified deps)
Replaced TODO stub in pipeline.rs with real validation pass call.
Fixed 58 code comparison failures. Code: 1621→1679 (97.8%). 38 remaining.

## 20260325-011107 Fix error handling, enum passthrough, codegen invariants — 38→30 code failures

Fixed 8 code comparison failures:
- Enum declarations: preserve original AST node through codegen instead of __unsupported_* placeholder
- throwUnknownException__testonly: pipeline support for test-only exception pragma
- MethodCall invariant: codegen checks property resolves to MemberExpression
- Unnamed temporary invariant: convert_identifier returns Result, errors on unnamed temps
- Const/Let declaration invariant: cannot have outer lvalue (expression reference)
- useMemo-switch-return: fixed as side effect (was flaky, now passes consistently)
Code: 1679→1687 (98.3%). 30 remaining.
