/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  BlockId,
  GotoVariant,
  HIRFunction,
  IdentifierId,
  InstructionValue,
  markInstructionIds,
  markPredecessors,
  mergeConsecutiveBlocks,
  Place,
  Primitive,
  removeUnreachableFallthroughs,
  reversePostorderBlocks,
  shrink,
} from "../HIR";
import { eliminateRedundantPhi } from "../SSA";

/**
 * Applies constant propagation and constant folding to the given function.
 * Note that because HIR operands are always a Place, constants cannot be directly
 * propagated into the HIR itself (the closest option would be to copy constants to
 * new temporaries just before each use, and update usage sites to reference those
 * new temporaries).
 *
 * Instead this pass implements constant folding, in which constant values are
 * propagated internally to the pass and subsequent operations are removed/folded where
 * possible.
 *
 * Note that this pass may prune control flow blocks that are unreachable, for example
 * a consequent or alternate branch if an `if` test is provably truthy or falsey.
 * If (and only if) terminals change, the pass re-runs various stages to ensure the
 * CFG is in minimal form. This means instruction ids *may* change as a result of this
 * pass.
 */
export function constantPropagation(fn: HIRFunction): void {
  const haveTerminalsChanged = applyConstantPropagation(fn);
  if (haveTerminalsChanged) {
    // If terminals have changed then blocks may have become newly unreachable.
    // Re-run minification of the graph (incl reordering instruction ids)
    shrink(fn.body);
    reversePostorderBlocks(fn.body);
    removeUnreachableFallthroughs(fn.body);
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
  }
}

function applyConstantPropagation(fn: HIRFunction): boolean {
  let hasChanges = false;

  // A set of blocks whose terminals can't (yet) be safely rewritten
  const valueBlocks = new Set<BlockId>();

  const constants: Constants = new Map();
  for (const [, block] of fn.body.blocks) {
    // Initialize phi values if all operands have the same known constant value.
    // Note that this analysis uses a single-pass only, so it will never fill in
    // phi values for blocks that have a back-edge.
    for (const phi of block.phis) {
      let value: Primitive | null = null;
      for (const [, operand] of phi.operands) {
        const operandValue = constants.get(operand.id) ?? null;
        if (operandValue === null) {
          value = null;
          break;
        }
        if (value === null) {
          value = operandValue;
        } else if (operandValue.value !== value.value) {
          value = null;
          break;
        }
      }
      if (value !== null) {
        constants.set(phi.id.id, value);
      }
    }

    for (const instr of block.instructions) {
      const value = evaluateInstruction(constants, instr.value);
      if (value !== null) {
        instr.value = value;
        constants.set(instr.lvalue.place.identifier.id, value);
      }
    }

    if (valueBlocks.has(block.id)) {
      // can't rewrite terminals in value blocks yet
      continue;
    }
    const terminal = block.terminal;
    switch (terminal.kind) {
      case "if": {
        const testValue = read(constants, terminal.test);
        if (testValue !== null && testValue.kind === "Primitive") {
          hasChanges = true;
          const targetBlockId = Boolean(testValue.value)
            ? terminal.consequent
            : terminal.alternate;
          block.terminal = {
            kind: "goto",
            variant: GotoVariant.Break,
            block: targetBlockId,
            id: terminal.id,
          };
        }
        break;
      }
      case "while": {
        valueBlocks.add(terminal.test);
        break;
      }
      case "for": {
        valueBlocks.add(terminal.init);
        valueBlocks.add(terminal.test);
        valueBlocks.add(terminal.update);
        break;
      }
      default: {
        // no-op
      }
    }
  }

  return hasChanges;
}

function evaluateInstruction(
  constants: Constants,
  instr: InstructionValue
): Constant | null {
  switch (instr.kind) {
    case "Primitive": {
      return instr;
    }
    case "BinaryExpression": {
      const lhsValue = read(constants, instr.left);
      const rhsValue = read(constants, instr.right);
      if (lhsValue !== null && rhsValue !== null) {
        const lhs = lhsValue.value;
        const rhs = rhsValue.value;
        switch (instr.operator) {
          case "+": {
            if (typeof lhs === "number" && typeof rhs === "number") {
              return { kind: "Primitive", value: lhs + rhs, loc: instr.loc };
            }
            return null;
          }
          case "-": {
            if (typeof lhs === "number" && typeof rhs === "number") {
              return { kind: "Primitive", value: lhs - rhs, loc: instr.loc };
            }
            return null;
          }
          case "*": {
            if (typeof lhs === "number" && typeof rhs === "number") {
              return { kind: "Primitive", value: lhs * rhs, loc: instr.loc };
            }
            return null;
          }
          case "/": {
            if (typeof lhs === "number" && typeof rhs === "number") {
              return { kind: "Primitive", value: lhs / rhs, loc: instr.loc };
            }
            return null;
          }
          case "<": {
            if (typeof lhs === "number" && typeof rhs === "number") {
              return { kind: "Primitive", value: lhs < rhs, loc: instr.loc };
            }
            return null;
          }
          case "<=": {
            if (typeof lhs === "number" && typeof rhs === "number") {
              return { kind: "Primitive", value: lhs <= rhs, loc: instr.loc };
            }
            return null;
          }
          case ">": {
            if (typeof lhs === "number" && typeof rhs === "number") {
              return { kind: "Primitive", value: lhs > rhs, loc: instr.loc };
            }
            return null;
          }
          case ">=": {
            if (typeof lhs === "number" && typeof rhs === "number") {
              return { kind: "Primitive", value: lhs >= rhs, loc: instr.loc };
            }
            return null;
          }
          case "==": {
            return { kind: "Primitive", value: lhs == rhs, loc: instr.loc };
          }
          case "===": {
            return { kind: "Primitive", value: lhs === rhs, loc: instr.loc };
          }
          case "!=": {
            return { kind: "Primitive", value: lhs != rhs, loc: instr.loc };
          }
          case "!==": {
            return { kind: "Primitive", value: lhs !== rhs, loc: instr.loc };
          }
          default: {
            // TODO: handle more cases
            return null;
          }
        }
      }
      return null;
    }
    case "PropertyLoad": {
      const objectValue = read(constants, instr.object);
      if (objectValue !== null) {
        if (
          typeof objectValue.value === "string" &&
          instr.property === "length"
        ) {
          return {
            kind: "Primitive",
            value: objectValue.value.length,
            loc: instr.loc,
          };
        }
      }
      return null;
    }
    case "Identifier": {
      return read(constants, instr);
    }
    default: {
      // TODO: handle more cases
      return null;
    }
  }
}

/**
 * Recursively read the value of a place: if it is a constant place, attempt to read
 * from that place until reaching a primitive or finding a value that is unset.
 */
function read(constants: Constants, place: Place): Constant | null {
  return constants.get(place.identifier.id) ?? null;
}

type Constant = Primitive;
type Constants = Map<IdentifierId, Constant>;
