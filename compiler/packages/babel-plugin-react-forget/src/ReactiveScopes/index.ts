/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export { alignReactiveScopesToBlockScopes } from "./AlignReactiveScopesToBlockScopes";
export { assertScopeInstructionsWithinScopes } from "./AssertScopeInstructionsWithinScope";
export { buildReactiveBlocks } from "./BuildReactiveBlocks";
export { buildReactiveFunction } from "./BuildReactiveFunction";
export {
  codegenReactiveFunction,
  type CodegenFunction,
} from "./CodegenReactiveFunction";
export { extractScopeDeclarationsFromDestructuring } from "./ExtractScopeDeclarationsFromDestructuring";
export { flattenReactiveLoops } from "./FlattenReactiveLoops";
export { flattenScopesWithHooks } from "./FlattenScopesWithHooks";
export { flattenScopesWithObjectMethods } from "./FlattenScopesWithObjectMethods";
export { inferReactiveScopeVariables } from "./InferReactiveScopeVariables";
export { memoizeFbtOperandsInSameScope } from "./MemoizeFbtOperandsInSameScope";
export { mergeOverlappingReactiveScopes } from "./MergeOverlappingReactiveScopes";
export { mergeReactiveScopesThatInvalidateTogether } from "./MergeReactiveScopesThatInvalidateTogether";
export { printReactiveFunction } from "./PrintReactiveFunction";
export { promoteUsedTemporaries } from "./PromoteUsedTemporaries";
export { propagateScopeDependencies } from "./PropagateScopeDependencies";
export { pruneAllReactiveScopes } from "./PruneAllReactiveScopes";
export { pruneHoistedContexts } from "./PruneHoistedContexts";
export { pruneNonEscapingScopes } from "./PruneNonEscapingScopes";
export { pruneNonReactiveDependencies } from "./PruneNonReactiveDependencies";
export { pruneTemporaryLValues as pruneUnusedLValues } from "./PruneTemporaryLValues";
export { pruneUnusedLabels } from "./PruneUnusedLabels";
export { pruneUnusedScopes } from "./PruneUnusedScopes";
export { renameVariables } from "./RenameVariables";
export {
  ReactiveFunctionTransform,
  Transformed,
  eachReactiveValueOperand,
  visitReactiveFunction,
} from "./visitors";
