/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export {alignObjectMethodScopes} from './AlignObjectMethodScopes';
export {alignReactiveScopesToBlockScopes} from './AlignReactiveScopesToBlockScopes';
export {assertScopeInstructionsWithinScopes} from './AssertScopeInstructionsWithinScope';
export {assertWellFormedBreakTargets} from './AssertWellFormedBreakTargets';
export {buildReactiveBlocks} from './BuildReactiveBlocks';
export {buildReactiveFunction} from './BuildReactiveFunction';
export {codegenFunction, type CodegenFunction} from './CodegenReactiveFunction';
export {extractScopeDeclarationsFromDestructuring} from './ExtractScopeDeclarationsFromDestructuring';
export {flattenReactiveLoops} from './FlattenReactiveLoops';
export {flattenScopesWithHooksOrUse} from './FlattenScopesWithHooksOrUse';
export {inferReactiveScopeVariables} from './InferReactiveScopeVariables';
export {memoizeFbtAndMacroOperandsInSameScope} from './MemoizeFbtAndMacroOperandsInSameScope';
export {mergeOverlappingReactiveScopes} from './MergeOverlappingReactiveScopes';
export {mergeReactiveScopesThatInvalidateTogether} from './MergeReactiveScopesThatInvalidateTogether';
export {printReactiveFunction} from './PrintReactiveFunction';
export {promoteUsedTemporaries} from './PromoteUsedTemporaries';
export {propagateEarlyReturns} from './PropagateEarlyReturns';
export {propagateScopeDependencies} from './PropagateScopeDependencies';
export {pruneAllReactiveScopes} from './PruneAllReactiveScopes';
export {pruneHoistedContexts} from './PruneHoistedContexts';
export {pruneNonEscapingScopes} from './PruneNonEscapingScopes';
export {pruneNonReactiveDependencies} from './PruneNonReactiveDependencies';
export {pruneUnusedLValues} from './PruneTemporaryLValues';
export {pruneUnusedLabels} from './PruneUnusedLabels';
export {pruneUnusedScopes} from './PruneUnusedScopes';
export {renameVariables} from './RenameVariables';
export {stabilizeBlockIds} from './StabilizeBlockIds';
export {
  ReactiveFunctionTransform,
  eachReactiveValueOperand,
  visitReactiveFunction,
  type Transformed,
} from './visitors';
