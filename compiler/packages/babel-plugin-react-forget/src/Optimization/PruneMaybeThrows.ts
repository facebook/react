/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  GotoVariant,
  HIRFunction,
  Instruction,
  assertConsistentIdentifiers,
  assertTerminalSuccessorsExist,
  mergeConsecutiveBlocks,
  removeUnreachableFallthroughs,
  reversePostorderBlocks,
} from "../HIR";
import {
  markInstructionIds,
  markPredecessors,
  removeDeadDoWhileStatements,
  removeUnnecessaryTryCatch,
  removeUnreachableForUpdates,
} from "../HIR/HIRBuilder";
import { eliminateRedundantPhi } from "../SSA";

/**
 * This pass prunes `maybe-throw` terminals for blocks that can provably *never* throw.
 * For now this is very conservative, and only affects blocks with primitives or
 * array/object literals. Even a variable reference could throw bc of the TDZ.
 */
export function pruneMaybeThrows(fn: HIRFunction): void {
  const didPrune = pruneMaybeThrowsImpl(fn);
  if (didPrune) {
    // If terminals have changed then blocks may have become newly unreachable.
    // Re-run minification of the graph (incl reordering instruction ids)
    reversePostorderBlocks(fn.body);
    removeUnreachableFallthroughs(fn.body);
    removeUnreachableForUpdates(fn.body);
    removeDeadDoWhileStatements(fn.body);
    removeUnnecessaryTryCatch(fn.body);
    markInstructionIds(fn.body);
    markPredecessors(fn.body);

    // Now that predecessors are updated, prune phi operands that can never be reached
    for (const [, block] of fn.body.blocks) {
      for (const phi of block.phis) {
        for (const [predecessor] of phi.operands) {
          if (!block.preds.has(predecessor)) {
            phi.operands.delete(predecessor);
          }
        }
      }
    }
    // By removing some phi operands, there may be phis that were not previously
    // redundant but now are
    eliminateRedundantPhi(fn);
    // Finally, merge together any blocks that are now guaranteed to execute
    // consecutively
    mergeConsecutiveBlocks(fn);

    assertConsistentIdentifiers(fn);
    assertTerminalSuccessorsExist(fn);
  }
}

function pruneMaybeThrowsImpl(fn: HIRFunction): boolean {
  let hasChanges = false;
  for (const [_, block] of fn.body.blocks) {
    const terminal = block.terminal;
    if (terminal.kind !== "maybe-throw") {
      continue;
    }
    const canThrow = block.instructions.some((instr) =>
      instructionMayThrow(instr)
    );
    if (!canThrow) {
      hasChanges = true;
      block.terminal = {
        kind: "goto",
        block: terminal.continuation,
        variant: GotoVariant.Break,
        id: terminal.id,
        loc: terminal.loc,
      };
    }
  }
  return hasChanges;
}

function instructionMayThrow(instr: Instruction): boolean {
  switch (instr.value.kind) {
    case "Primitive":
    case "ArrayExpression":
    case "ObjectExpression": {
      return false;
    }
    default: {
      return true;
    }
  }
}
