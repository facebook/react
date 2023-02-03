/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  BlockId,
  HIRFunction,
  Identifier,
  Instruction,
  InstructionValue,
} from "../HIR";
import {
  eachInstructionValueOperand,
  eachTerminalOperand,
} from "../HIR/visitors";
import { assertExhaustive } from "../Utils/utils";

/**
 * Implements dead-code elimination, eliminating instructions whose values are unused.
 *
 * Note that unreachable blocks are already pruned during HIR construction.
 */
export function deadCodeElimination(fn: HIRFunction): void {
  const used = new Set<Identifier>();

  // Find any phi operands involved in a loop, which might otherwise appear as dead
  // code when using a reverse iteration.
  //
  // A more advanced algorithm could still prune some of these operands
  // let's keep it simple for now
  const seen = new Set<BlockId>();
  for (const [, block] of fn.body.blocks) {
    for (const phi of block.phis) {
      for (const [pred, operand] of phi.operands) {
        if (!seen.has(pred)) {
          used.add(operand);
        }
      }
    }
    seen.add(block.id);
  }

  // Iterate blocks in postorder (successors before predecessors, excepting loops)
  // to find usages before declarations
  const reversedBlocks = [...fn.body.blocks.values()].reverse();
  for (const block of reversedBlocks) {
    for (const operand of eachTerminalOperand(block.terminal)) {
      used.add(operand.identifier);
    }

    let nextInstructions: Array<Instruction> | null = null;
    for (let i = block.instructions.length - 1; i >= 0; i--) {
      const instr = block.instructions[i]!;
      if (
        !used.has(instr.lvalue.place.identifier) &&
        pruneableValue(instr.value) &&
        // Can't prune the last value of a value block, that's its value!
        !(block.kind !== "block" && i === block.instructions.length - 1)
      ) {
        continue;
      }
      used.add(instr.lvalue.place.identifier);
      nextInstructions ??= [];
      nextInstructions.push(instr);
      for (const operand of eachInstructionValueOperand(instr.value)) {
        used.add(operand.identifier);
      }
    }
    if (nextInstructions !== null) {
      nextInstructions.reverse();
      block.instructions = nextInstructions;
    }
    for (const phi of block.phis) {
      if (used.has(phi.id)) {
        for (const [, operand] of phi.operands) {
          used.add(operand);
        }
      } else {
        for (const [, operand] of phi.operands) {
          if (used.has(operand)) {
            used.add(phi.id);
            for (const [, operand] of phi.operands) {
              used.add(operand);
            }
            break;
          }
        }
      }
    }
  }
}

/**
 * Returns true if it is safe to prune an instruction with the given value.
 * Functions which may have side-
 */
function pruneableValue(value: InstructionValue): boolean {
  switch (value.kind) {
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
    case "ArrayExpression":
    case "BinaryExpression":
    case "ComputedLoad":
    case "ComputedStore":
    case "FunctionExpression":
    case "Identifier":
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
