/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export { alignReactiveScopesToBlockScopes } from "./AlignReactiveScopesToBlockScopes";
export { buildReactiveBlocks } from "./BuildReactiveBlocks";
export { buildReactiveFunction } from "./BuildReactiveFunction";
export { codegenReactiveFunction } from "./CodegenReactiveFunction";
export { extractScopeDeclarationsFromDestructuring } from "./ExtractScopeDeclarationsFromDestructuring";
export { flattenReactiveLoops } from "./FlattenReactiveLoops";
export { flattenScopesWithHooks } from "./FlattenScopesWithHooks";
export { inferReactiveScopeVariables } from "./InferReactiveScopeVariables";
export { memoizeFbtOperandsInSameScope } from "./MemoizeFbtOperandsInSameScope";
export { mergeOverlappingReactiveScopes } from "./MergeOverlappingReactiveScopes";
export { printReactiveFunction } from "./PrintReactiveFunction";
export { promoteUsedTemporaries } from "./PromoteUsedTemporaries";
export { propagateScopeDependencies } from "./PropagateScopeDependencies";
export { pruneAllReactiveScopes } from "./PruneAllReactiveScopes";
export { pruneNonEscapingScopes } from "./PruneNonEscapingScopes";
export { pruneNonReactiveDependencies } from "./PruneNonReactiveDependencies";
export { pruneTemporaryLValues as pruneUnusedLValues } from "./PruneTemporaryLValues";
export { pruneUnusedLabels } from "./PruneUnusedLabels";
export { pruneUnusedScopes } from "./PruneUnusedScopes";
export { renameVariables } from "./RenameVariables";
