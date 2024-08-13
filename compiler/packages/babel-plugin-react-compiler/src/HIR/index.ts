/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export {assertConsistentIdentifiers} from './AssertConsistentIdentifiers';
export {
  assertTerminalSuccessorsExist,
  assertTerminalPredsExist,
} from './AssertTerminalBlocksExist';
export {assertValidBlockNesting} from './AssertValidBlockNesting';
export {assertValidMutableRanges} from './AssertValidMutableRanges';
export {lower} from './BuildHIR';
export {buildReactiveScopeTerminalsHIR} from './BuildReactiveScopeTerminalsHIR';
export {computeDominatorTree, computePostDominatorTree} from './Dominator';
export {
  Environment,
  parseConfigPragma,
  validateEnvironmentConfig,
  type EnvironmentConfig,
  type ExternalFunction,
  type Hook,
} from './Environment';
export * from './HIR';
export {
  markInstructionIds,
  markPredecessors,
  removeUnnecessaryTryCatch,
  reversePostorderBlocks,
} from './HIRBuilder';
export {mergeConsecutiveBlocks} from './MergeConsecutiveBlocks';
export {mergeOverlappingReactiveScopesHIR} from './MergeOverlappingReactiveScopesHIR';
export {printFunction, printHIR} from './PrintHIR';
export {pruneUnusedLabelsHIR} from './PruneUnusedLabelsHIR';
