/*
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
import { HIRFunction, Place, getHookKind } from "../HIR/HIR";
import {
  eachInstructionValueOperand,
  eachTerminalOperand,
} from "../HIR/visitors";

/*
 * Validates that the function honors the [Rules of Hooks](https://react.dev/warnings/invalid-hook-call-warning)
 * rule that hooks may only be called and not otherwise referenced as first-class values.
 */
export function validateHooksUsage(fn: HIRFunction): void {
  const errors = new CompilerError();
  const pushError = (place: Place): void => {
    errors.pushErrorDetail(
      new CompilerErrorDetail({
        description: null,
        reason:
          "Hooks may not be referenced as normal values, they must be called. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning)",
        loc: typeof place.loc !== "symbol" ? place.loc : null,
        severity: ErrorSeverity.InvalidReact,
        suggestions: null,
      })
    );
  };

  for (const [, block] of fn.body.blocks) {
    for (const instr of block.instructions) {
      if (instr.value.kind === "CallExpression") {
        for (const operand of eachInstructionValueOperand(instr.value)) {
          if (operand === instr.value.callee) {
            continue;
          }
          if (getHookKind(fn.env, operand.identifier) != null) {
            pushError(operand);
          }
        }
      } else if (instr.value.kind === "MethodCall") {
        for (const operand of eachInstructionValueOperand(instr.value)) {
          if (operand === instr.value.property) {
            continue;
          }
          if (getHookKind(fn.env, operand.identifier) != null) {
            pushError(operand);
          }
        }
      } else {
        for (const operand of eachInstructionValueOperand(instr.value)) {
          if (getHookKind(fn.env, operand.identifier) != null) {
            pushError(operand);
          }
        }
      }
    }
    for (const operand of eachTerminalOperand(block.terminal)) {
      if (getHookKind(fn.env, operand.identifier) != null) {
        pushError(operand);
      }
    }
  }

  if (errors.hasErrors()) {
    throw errors;
  }
}
