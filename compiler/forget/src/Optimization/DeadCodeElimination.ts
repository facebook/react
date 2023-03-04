/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { BlockId, HIRFunction, Identifier, InstructionValue } from "../HIR";
import {
  eachInstructionValueOperand,
  eachPatternOperand,
  eachTerminalOperand,
} from "../HIR/visitors";
import { assertExhaustive, retainWhere } from "../Utils/utils";

/**
 * Implements dead-code elimination, eliminating instructions whose values are unused.
 *
 * Note that unreachable blocks are already pruned during HIR construction.
 */
export function deadCodeElimination(fn: HIRFunction): void {
  const used = new Set<Identifier>();

  // If there are no back-edges the algorithm can terminate after a single iteration
  // of the blocks
  const hasLoop = hasBackEdge(fn);

  let size = used.size;
  do {
    size = used.size;

    // Iterate blocks in postorder (successors before predecessors, excepting loops)
    // to find usages before declarations
    const reversedBlocks = [...fn.body.blocks.values()].reverse();
    for (const block of reversedBlocks) {
      for (const operand of eachTerminalOperand(block.terminal)) {
        used.add(operand.identifier);
      }

      for (let i = block.instructions.length - 1; i >= 0; i--) {
        const instr = block.instructions[i]!;
        if (
          !used.has(instr.lvalue.identifier) &&
          pruneableValue(instr.value, used) &&
          // Can't prune the last value of a value block, that's its value!
          !(block.kind !== "block" && i === block.instructions.length - 1)
        ) {
          continue;
        }
        used.add(instr.lvalue.identifier);
        for (const operand of eachInstructionValueOperand(instr.value)) {
          used.add(operand.identifier);
        }
      }
      for (const phi of block.phis) {
        if (used.has(phi.id)) {
          for (const [pred, operand] of phi.operands) {
            used.add(operand);
          }
        }
      }
    }
  } while (used.size > size && hasLoop);
  for (const [, block] of fn.body.blocks) {
    for (const phi of block.phis) {
      if (!used.has(phi.id)) {
        block.phis.delete(phi);
      }
    }
    retainWhere(block.instructions, (instr) =>
      used.has(instr.lvalue.identifier)
    );
  }
}

/**
 * Returns true if it is safe to prune an instruction with the given value.
 * Functions which may have side-
 */
function pruneableValue(
  value: InstructionValue,
  used: Set<Identifier>
): boolean {
  switch (value.kind) {
    case "StoreLocal": {
      // Stores are pruneable only if the identifier being stored to is never read later
      return !used.has(value.lvalue.place.identifier);
    }
    case "Destructure": {
      // Destructure is pruneable only if none of the identifiers are read from later
      // TODO: as an optimization, prune unused properties where safe
      for (const place of eachPatternOperand(value.lvalue.pattern)) {
        if (used.has(place.identifier)) {
          return false;
        }
      }
      return true;
    }
    case "CallExpression":
    case "ComputedCall":
    case "ComputedStore":
    case "PropertyCall":
    case "PropertyStore": {
      // Mutating instructions are not safe to prune.
      // TODO: we could be more precise and make this conditional on whether
      // any arguments are actually modified
      return false;
    }
    case "NewExpression":
    case "UnsupportedNode":
    case "TaggedTemplateExpression": {
      // Potentially safe to prune, since they should just be creating new values
      return false;
    }
    case "LoadGlobal":
    case "ArrayExpression":
    case "BinaryExpression":
    case "ComputedLoad":
    case "ComputedStore":
    case "FunctionExpression":
    case "LoadLocal":
    case "JsxExpression":
    case "JsxFragment":
    case "JSXText":
    case "ObjectExpression":
    case "Primitive":
    case "PropertyLoad":
    case "TemplateLiteral":
    case "TypeCastExpression":
    case "UnaryExpression": {
      // Definitely safe to prune since they are read-only
      return true;
    }
    default: {
      assertExhaustive(value, `Unexepcted value kind '${(value as any).kind}'`);
    }
  }
}

function hasBackEdge(fn: HIRFunction): boolean {
  const visited = new Set<BlockId>();
  for (const [blockId, block] of fn.body.blocks) {
    for (const predId of block.preds) {
      if (!visited.has(predId)) {
        return true;
      }
    }
    visited.add(blockId);
  }
  return false;
}
