/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export { lower } from "./BuildHIR";
export { computeDominatorTree, computePostDominatorTree } from "./Dominator";
export { Environment, Hook } from "./Environment";
export * from "./HIR";
export {
  markInstructionIds,
  markPredecessors,
  removeUnreachableFallthroughs,
  reversePostorderBlocks,
} from "./HIRBuilder";
export { mergeConsecutiveBlocks } from "./MergeConsecutiveBlocks";
export { printFunction, printHIR } from "./PrintHIR";
export { validateConsistentIdentifiers } from "./ValidateConsistentIdentifiers";
export { validateFrozenLambdas } from "./ValidateFrozenLambdas";
export { validateHooksUsage } from "./ValidateHooksUsage";
export { validateNoRefAccessInRender } from "./ValidateNoRefAccesInRender";
export { validateTerminalSuccessors } from "./ValidateTerminalSuccessors";
export { validateUnconditionalHooks } from "./ValidateUnconditionalHooks";
