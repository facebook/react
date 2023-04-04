/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { isValidIdentifier } from "@babel/types";
import invariant from "invariant";
import {
  GotoVariant,
  HIRFunction,
  IdentifierId,
  Instruction,
  InstructionValue,
  markInstructionIds,
  markPredecessors,
  mergeConsecutiveBlocks,
  Place,
  Primitive,
  removeUnreachableFallthroughs,
  reversePostorderBlocks,
  shrink,
  validateConsistentIdentifiers,
  validateTerminalSuccessors,
} from "../HIR";
import {
  removeDeadDoWhileStatements,
  removeUnreachableForUpdates,
} from "../HIR/HIRBuilder";
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
    removeUnreachableForUpdates(fn.body);
    removeDeadDoWhileStatements(fn.body);
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

    validateConsistentIdentifiers(fn);
    validateTerminalSuccessors(fn);
  }
}

function applyConstantPropagation(fn: HIRFunction): boolean {
  let hasChanges = false;

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
      const value = evaluateInstruction(constants, instr);
      if (value !== null) {
        constants.set(instr.lvalue.identifier.id, value);
      }
    }

    if (block.kind !== "block") {
      // can't rewrite terminals in value blocks yet
      continue;
    }
    const terminal = block.terminal;
    switch (terminal.kind) {
      case "if": {
        const testValue = read(constants, terminal.test);
        if (testValue !== null) {
          hasChanges = true;
          const targetBlockId = testValue.value
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
      default: {
        // no-op
      }
    }
  }

  return hasChanges;
}

function evaluateInstruction(
  constants: Constants,
  instr: Instruction
): Constant | null {
  const value = instr.value;
  switch (value.kind) {
    case "Primitive": {
      return value;
    }
    case "ComputedLoad": {
      const property = read(constants, value.property);
      if (
        property !== null &&
        typeof property.value === "string" &&
        isValidIdentifier(property.value)
      ) {
        const nextValue: InstructionValue = {
          kind: "PropertyLoad",
          loc: value.loc,
          property: property.value,
          object: value.object,
          optional: value.optional,
        };
        // Future-proofing: when we add support for optional computed properties,
        // we'll need to copy the value here
        if ((value as any).optional) {
          invariant(
            false,
            "TODO: translate optional computed load to optional property load"
          );
        }
        instr.value = nextValue;
      }
      return null;
    }
    case "ComputedStore": {
      const property = read(constants, value.property);
      if (
        property !== null &&
        typeof property.value === "string" &&
        isValidIdentifier(property.value)
      ) {
        const nextValue: InstructionValue = {
          kind: "PropertyStore",
          loc: value.loc,
          property: property.value,
          object: value.object,
          value: value.value,
        };
        instr.value = nextValue;
      }
      return null;
    }
    case "BinaryExpression": {
      const lhsValue = read(constants, value.left);
      const rhsValue = read(constants, value.right);
      if (lhsValue !== null && rhsValue !== null) {
        const lhs = lhsValue.value;
        const rhs = rhsValue.value;
        let result: Primitive | null = null;
        switch (value.operator) {
          case "+": {
            if (typeof lhs === "number" && typeof rhs === "number") {
              result = { kind: "Primitive", value: lhs + rhs, loc: value.loc };
            }
            break;
          }
          case "-": {
            if (typeof lhs === "number" && typeof rhs === "number") {
              result = { kind: "Primitive", value: lhs - rhs, loc: value.loc };
            }
            break;
          }
          case "*": {
            if (typeof lhs === "number" && typeof rhs === "number") {
              result = { kind: "Primitive", value: lhs * rhs, loc: value.loc };
            }
            break;
          }
          case "/": {
            if (typeof lhs === "number" && typeof rhs === "number") {
              result = { kind: "Primitive", value: lhs / rhs, loc: value.loc };
            }
            break;
          }
          case "<": {
            if (typeof lhs === "number" && typeof rhs === "number") {
              result = { kind: "Primitive", value: lhs < rhs, loc: value.loc };
            }
            break;
          }
          case "<=": {
            if (typeof lhs === "number" && typeof rhs === "number") {
              result = { kind: "Primitive", value: lhs <= rhs, loc: value.loc };
            }
            break;
          }
          case ">": {
            if (typeof lhs === "number" && typeof rhs === "number") {
              result = { kind: "Primitive", value: lhs > rhs, loc: value.loc };
            }
            break;
          }
          case ">=": {
            if (typeof lhs === "number" && typeof rhs === "number") {
              result = { kind: "Primitive", value: lhs >= rhs, loc: value.loc };
            }
            break;
          }
          case "==": {
            result = { kind: "Primitive", value: lhs == rhs, loc: value.loc };
            break;
          }
          case "===": {
            result = { kind: "Primitive", value: lhs === rhs, loc: value.loc };
            break;
          }
          case "!=": {
            result = { kind: "Primitive", value: lhs != rhs, loc: value.loc };
            break;
          }
          case "!==": {
            result = { kind: "Primitive", value: lhs !== rhs, loc: value.loc };
            break;
          }
          default: {
            break;
          }
        }
        if (result !== null) {
          instr.value = result;
          return result;
        }
      }
      return null;
    }
    case "PropertyLoad": {
      const objectValue = read(constants, value.object);
      if (objectValue !== null) {
        if (
          typeof objectValue.value === "string" &&
          value.property === "length"
        ) {
          const result: InstructionValue = {
            kind: "Primitive",
            value: objectValue.value.length,
            loc: value.loc,
          };
          instr.value = result;
          return result;
        }
      }
      return null;
    }
    case "LoadLocal": {
      const placeValue = read(constants, value.place);
      if (placeValue !== null) {
        instr.value = placeValue;
      }
      return placeValue;
    }
    case "StoreLocal": {
      const placeValue = read(constants, value.value);
      if (placeValue !== null) {
        constants.set(value.lvalue.place.identifier.id, placeValue);
      }
      return placeValue;
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
