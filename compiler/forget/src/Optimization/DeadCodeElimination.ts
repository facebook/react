/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  ArrayPattern,
  BlockId,
  HIRFunction,
  Identifier,
  Instruction,
  InstructionValue,
  ObjectPattern,
} from "../HIR";
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
  const state = new State();

  // If there are no back-edges the algorithm can terminate after a single iteration
  // of the blocks
  const hasLoop = hasBackEdge(fn);

  const reversedBlocks = [...fn.body.blocks.values()].reverse();
  let size = state.count;
  do {
    size = state.count;

    // Iterate blocks in postorder (successors before predecessors, excepting loops)
    // to find usages before declarations
    for (const block of reversedBlocks) {
      for (const operand of eachTerminalOperand(block.terminal)) {
        state.reference(operand.identifier);
      }

      for (let i = block.instructions.length - 1; i >= 0; i--) {
        const instr = block.instructions[i]!;
        if (
          !state.used(instr.lvalue.identifier) &&
          pruneableValue(instr.value, state) &&
          // Can't prune the last value of a value block, that's its value!
          !(block.kind !== "block" && i === block.instructions.length - 1)
        ) {
          continue;
        }
        state.reference(instr.lvalue.identifier);
        visitInstruction(instr, state);
      }
      for (const phi of block.phis) {
        if (state.used(phi.id)) {
          for (const [_pred, operand] of phi.operands) {
            state.reference(operand);
          }
        }
      }
    }
  } while (state.count > size && hasLoop);
  for (const [, block] of fn.body.blocks) {
    for (const phi of block.phis) {
      if (!state.used(phi.id)) {
        block.phis.delete(phi);
      }
    }
    retainWhere(block.instructions, (instr) =>
      state.used(instr.lvalue.identifier)
    );
  }
}

class State {
  identifiers: Set<Identifier> = new Set();

  reference(identifier: Identifier): void {
    this.identifiers.add(identifier);
  }

  used(identifier: Identifier): boolean {
    return this.identifiers.has(identifier);
  }

  get count(): number {
    return this.identifiers.size;
  }
}

function visitInstruction(instr: Instruction, state: State): void {
  if (instr.value.kind === "Destructure") {
    // Mark the value as used, not the lvalues
    state.reference(instr.value.value.identifier);
    // Remove unused lvalues
    switch (instr.value.lvalue.pattern.kind) {
      case "ArrayPattern": {
        // For arrays, we can only eliminate unused items from the end of the array,
        // so we iterate from the end and break once we find a used item. Note that
        // we already know at least one item is used, from the pruneableValue check.
        let nextItems: ArrayPattern["items"] | null = null;
        const originalItems = instr.value.lvalue.pattern.items;
        for (let i = originalItems.length - 1; i >= 0; i--) {
          const item = originalItems[i];
          if (item.kind === "Identifier") {
            if (state.used(item.identifier)) {
              nextItems = originalItems.slice(0, i + 1);
              break;
            }
          } else {
            if (state.used(item.place.identifier)) {
              nextItems = originalItems.slice(0, i + 1);
              break;
            }
          }
        }
        if (nextItems !== null) {
          instr.value.lvalue.pattern.items = nextItems;
        }
        break;
      }
      case "ObjectPattern": {
        // For objects we can prune any unused properties so long as there is no used rest element
        // (`const {x, ...y} = z`). If a rest element exists and is used, then nothing can be pruned
        // because it would change the set of properties which are copied into the rest value.
        // In the `const {x, ...y} = z` example, removing the `x` property would mean that `y` now
        // has an `x` property, changing the semantics.
        let nextProperties: ObjectPattern["properties"] | null = null;
        for (const property of instr.value.lvalue.pattern.properties) {
          if (property.kind === "ObjectProperty") {
            if (state.used(property.place.identifier)) {
              nextProperties ??= [];
              nextProperties.push(property);
            }
          } else {
            if (state.used(property.place.identifier)) {
              nextProperties = null;
              break;
            }
          }
        }
        if (nextProperties !== null) {
          instr.value.lvalue.pattern.properties = nextProperties;
        }
        break;
      }
      default: {
        assertExhaustive(
          instr.value.lvalue.pattern,
          `Unexpected pattern kind '${
            (instr.value.lvalue.pattern as any).kind
          }'`
        );
      }
    }
  } else {
    for (const operand of eachInstructionValueOperand(instr.value)) {
      state.reference(operand.identifier);
    }
  }
}

/**
 * Returns true if it is safe to prune an instruction with the given value.
 * Functions which may have side-
 */
function pruneableValue(value: InstructionValue, state: State): boolean {
  switch (value.kind) {
    case "DeclareLocal": {
      return !state.used(value.lvalue.place.identifier);
    }
    case "StoreLocal": {
      // Stores are pruneable only if the identifier being stored to is never read later
      return !state.used(value.lvalue.place.identifier);
    }
    case "Destructure": {
      // Destructure is pruneable only if none of the identifiers are read from later
      // TODO: as an optimization, prune unused properties where safe
      for (const place of eachPatternOperand(value.lvalue.pattern)) {
        if (state.used(place.identifier)) {
          return false;
        }
      }
      return true;
    }
    case "Debugger": {
      // explicitly retain debugger statements to not break debugging workflows
      return false;
    }
    case "ExpressionStatement": {
      // We create ExpressionStatements specifically for expressions that would otherwise
      // be dropped but which we don't want to eliminate.
      return false;
    }
    case "Await":
    case "CallExpression":
    case "ComputedDelete":
    case "ComputedStore":
    case "PropertyDelete":
    case "MethodCall":
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
    case "NextIterableOf": {
      // Technically a NextIterableOf will never be unused because it's always used later by
      // another StoreLocal or Destructure instruction, but conceptually we can't prune
      return false;
    }
    case "LoadContext":
    case "DeclareContext":
    case "StoreContext": {
      return false;
    }
    case "RegExpLiteral":
    case "LoadGlobal":
    case "ArrayExpression":
    case "BinaryExpression":
    case "ComputedLoad":
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

export function hasBackEdge(fn: HIRFunction): boolean {
  return findBlocksWithBackEdges(fn).size > 0;
}

export function findBlocksWithBackEdges(fn: HIRFunction): Set<BlockId> {
  const visited = new Set<BlockId>();
  const blocks = new Set<BlockId>();
  for (const [blockId, block] of fn.body.blocks) {
    for (const predId of block.preds) {
      if (!visited.has(predId)) {
        blocks.add(blockId);
      }
    }
    visited.add(blockId);
  }
  return blocks;
}
