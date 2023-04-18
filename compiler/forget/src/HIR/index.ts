/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export { lower } from "./BuildHIR";
export { Environment } from "./Environment";
export * from "./HIR";
export {
  markInstructionIds,
  markPredecessors,
  removeUnreachableFallthroughs,
  reversePostorderBlocks,
  shrink,
} from "./HIRBuilder";
export { Hook } from "./Hooks";
export { mergeConsecutiveBlocks } from "./MergeConsecutiveBlocks";
export { printFunction, printHIR } from "./PrintHIR";
export { validateConsistentIdentifiers } from "./ValidateConsistentIdentifiers";
export { validateTerminalSuccessors } from "./ValidateTerminalSuccessors";
