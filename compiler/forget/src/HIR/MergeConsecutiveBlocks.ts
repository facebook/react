/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import invariant from "invariant";
import {
  BlockId,
  Effect,
  GeneratedSource,
  HIRFunction,
  Instruction,
  InstructionKind,
} from "./HIR";

/**
 * Merges sequences of blocks that will always execute consecutively —
 * ie where the predecessor always transfers control to the successor
 * (ie ends in a goto) and where the predecessor is the only predecessor
 * for that successor (ie, there is no other way to reach the successor).
 *
 * Note that this pass leaves value/loop blocks alone because they cannot
 * be merged without breaking the structure of the high-level terminals
 * that reference them.
 *
 * TODO @josephsavona make value blocks explicit (eg a `kind` on Block).
 */
export function mergeConsecutiveBlocks(fn: HIRFunction): void {
  const merged = new MergedBlocks();
  for (const [, block] of fn.body.blocks) {
    // Can only merge blocks with a single predecessor, can't merge
    // value blocks
    if (block.kind !== "block" || block.preds.size !== 1) {
      continue;
    }
    const originalPredecessorId = Array.from(block.preds)[0]!;
    const predecessorId = merged.get(originalPredecessorId);
    const predecessor = fn.body.blocks.get(predecessorId);
    invariant(
      predecessor !== undefined,
      "Expected predecessor %s to exist",
      predecessorId
    );
    if (predecessor.terminal.kind !== "goto") {
      // The predecessor is not guaranteed to transfer control to this block,
      // they aren't consecutive.
      continue;
    }

    // Replace phis in the merged block with canonical assignments to the single operand value
    for (const phi of block.phis) {
      invariant(
        phi.operands.size === 1,
        "Found a block with a single predecessor but where a phi has multiple (%s) operands",
        phi.operands.size
      );
      const operand = Array.from(phi.operands.values())[0]!;
      const instr: Instruction = {
        id: predecessor.terminal.id,
        lvalue: {
          place: {
            kind: "Identifier",
            identifier: phi.id,
            effect: Effect.Mutate,
            loc: GeneratedSource,
          },
          kind: InstructionKind.Const,
        },
        value: {
          kind: "LoadLocal",
          place: {
            kind: "Identifier",
            identifier: operand,
            effect: Effect.Read,
            loc: GeneratedSource,
          },
          loc: GeneratedSource,
        },
        loc: GeneratedSource,
      };
      predecessor.instructions.push(instr);
    }

    predecessor.instructions.push(...block.instructions);
    predecessor.terminal = block.terminal;
    merged.merge(block.id, predecessorId);
    fn.body.blocks.delete(block.id);
  }
}

class MergedBlocks {
  #map: Map<BlockId, BlockId> = new Map();

  /**
   * Record that @param block was merged into @param into.
   */
  merge(block: BlockId, into: BlockId): void {
    const target = this.get(into);
    this.#map.set(block, target);
  }

  /**
   * Get the id of the block that @param block has been merged into.
   * This is transitive, in the case that eg @param block was merged
   * into a block which later merged into another block.
   */
  get(block: BlockId): BlockId {
    let current = block;
    while (this.#map.has(current)) {
      current = this.#map.get(current) ?? current;
    }
    return current;
  }
}
