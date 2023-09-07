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
  mergeConsecutiveBlocks,
} from "../HIR";

/**
 * This pass prunes `maybe-throw` terminals for blocks that can provably *never* throw.
 * For now this is very conservative, and only affects blocks with primitives or
 * array/object literals. Even a variable reference could throw bc of the TDZ.
 */
export function pruneMaybeThrows(fn: HIRFunction): void {
  const didPrune = pruneMaybeThrowsImpl(fn);
  if (didPrune) {
    mergeConsecutiveBlocks(fn);
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
