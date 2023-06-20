/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  CompilerError,
  CompilerErrorDetail,
  ErrorSeverity,
} from "../CompilerError";
import { HIRFunction, IdentifierId, Place, getHookKind } from "../HIR/HIR";
import {
  eachInstructionValueOperand,
  eachTerminalOperand,
} from "../HIR/visitors";
import { hasBackEdge } from "../Optimization/DeadCodeElimination";

/**
 * Validates that the function honors the [Rules of Hooks](https://react.dev/warnings/invalid-hook-call-warning)
 * rule that hooks may only be called and not otherwise referenced as first-class values.
 */
export function validateHooksUsage(fn: HIRFunction): void {
  const errors = new CompilerError();
  const pushError = (place: Place): void => {
    errors.pushErrorDetail(
      new CompilerErrorDetail({
        codeframe: null,
        description: null,
        reason:
          "Hooks may not be referenced as normal values, they must be called. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning)",
        loc: typeof place.loc !== "symbol" ? place.loc : null,
        severity: ErrorSeverity.InvalidInput,
      })
    );
  };

  const hooks: Set<IdentifierId> = new Set();
  const hasLoop = hasBackEdge(fn);

  let size = hooks.size;
  do {
    size = hooks.size;
    for (const [, block] of fn.body.blocks) {
      for (const phi of block.phis) {
        let possibleHook = false;
        for (const [, predecessor] of phi.operands) {
          if (hooks.has(predecessor.id)) {
            possibleHook = true;
            break;
          }
        }
        if (possibleHook) {
          hooks.add(phi.id.id);
        }
      }

      for (const instr of block.instructions) {
        if (
          instr.value.kind === "LoadGlobal" &&
          getHookKind(fn.env, instr.lvalue.identifier) != null
        ) {
          hooks.add(instr.lvalue.identifier.id);
        } else if (instr.value.kind === "CallExpression") {
          for (const operand of eachInstructionValueOperand(instr.value)) {
            if (operand === instr.value.callee) {
              continue;
            }
            if (hooks.has(operand.identifier.id)) {
              pushError(operand);
            }
          }
        } else {
          for (const operand of eachInstructionValueOperand(instr.value)) {
            if (hooks.has(operand.identifier.id)) {
              pushError(operand);
            }
          }
        }
      }
      for (const operand of eachTerminalOperand(block.terminal)) {
        if (hooks.has(operand.identifier.id)) {
          pushError(operand);
        }
      }
    }
  } while (hooks.size > size && hasLoop);

  if (errors.hasErrors()) {
    throw errors;
  }
}
