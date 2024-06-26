/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import prettyFormat from "pretty-format";
import { CompilerError } from "..";
import {
  HIRFunction,
  IdentifierId,
  Place,
  getHookKind,
  isUseOperator,
} from "../HIR";
import {
  eachInstructionValueOperand,
  eachTerminalOperand,
} from "../HIR/visitors";
import { isEffectHook } from "./ValidateMemoizedEffectDependencies";

/**
 * Validates that local variables cannot be reassigned after render.
 * This prevents a category of bugs in which a closure captures a
 * binding from one render but does not update
 */
export function validateLocalsNotReassignedAfterRender(fn: HIRFunction): void {
  const contextVariables = new Set<IdentifierId>();
  const reassignment = getContextReassignment(fn, contextVariables, false);
  if (reassignment !== null) {
    CompilerError.throwInvalidJS({
      reason:
        "This potentially reassigns a local variable after render has completed. Local variables may not be changed after render. ",
      description:
        reassignment.identifier.name !== null &&
        reassignment.identifier.name.kind === "named"
          ? `Variable \`${reassignment.identifier.name.value}\` cannot be reassigned after render`
          : "",
      loc: reassignment.loc,
    });
  }
}

function getContextReassignment(
  fn: HIRFunction,
  contextVariables: Set<IdentifierId>,
  isFunctionExpression: boolean
): Place | null {
  const reassigningFunctions = new Map<IdentifierId, Place>();
  for (const [, block] of fn.body.blocks) {
    for (const instr of block.instructions) {
      const { lvalue, value } = instr;
      switch (value.kind) {
        case "FunctionExpression":
        case "ObjectMethod": {
          const reassignment = getContextReassignment(
            value.loweredFunc.func,
            contextVariables,
            true
          );
          if (reassignment !== null) {
            reassigningFunctions.set(lvalue.identifier.id, reassignment);
          }
          for (const operand of eachInstructionValueOperand(value)) {
            const reassignment = reassigningFunctions.get(
              operand.identifier.id
            );
            if (reassignment !== undefined) {
              reassigningFunctions.set(lvalue.identifier.id, reassignment);
              break;
            }
          }
          break;
        }
        case "StoreLocal": {
          const reassignment = reassigningFunctions.get(
            value.value.identifier.id
          );
          if (reassignment !== undefined) {
            reassigningFunctions.set(
              value.lvalue.place.identifier.id,
              reassignment
            );
            reassigningFunctions.set(lvalue.identifier.id, reassignment);
          }
          break;
        }
        case "LoadLocal": {
          const reassignment = reassigningFunctions.get(
            value.place.identifier.id
          );
          if (reassignment !== undefined) {
            reassigningFunctions.set(lvalue.identifier.id, reassignment);
          }
          break;
        }
        case "ArrayExpression":
        case "ObjectExpression": {
          for (const operand of eachInstructionValueOperand(value)) {
            const reassignment = reassigningFunctions.get(
              operand.identifier.id
            );
            if (reassignment !== undefined) {
              reassigningFunctions.set(lvalue.identifier.id, reassignment);
              break;
            }
          }
          break;
        }
        case "DeclareContext": {
          if (!isFunctionExpression) {
            contextVariables.add(value.lvalue.place.identifier.id);
          }
          break;
        }
        case "StoreContext": {
          if (isFunctionExpression) {
            if (contextVariables.has(value.lvalue.place.identifier.id)) {
              return value.lvalue.place;
            }
          } else {
            contextVariables.add(value.lvalue.place.identifier.id);
          }
          break;
        }
        case "MethodCall":
        case "CallExpression": {
          const callee =
            value.kind === "MethodCall" ? value.property : value.callee;
          const isHook =
            getHookKind(fn.env, callee.identifier) != null ||
            isUseOperator(callee.identifier);
          for (const operand of eachInstructionValueOperand(value)) {
            const reassignment = reassigningFunctions.get(
              operand.identifier.id
            );
            if (reassignment !== undefined) {
              if (isHook) {
                return reassignment;
              } else {
                // reassigningFunctions.set(lvalue.identifier.id, reassignment);
              }
            }
          }
          break;
        }
        case "JsxFragment":
        case "JsxExpression": {
          for (const operand of eachInstructionValueOperand(value)) {
            const reassignment = reassigningFunctions.get(
              operand.identifier.id
            );
            if (reassignment !== undefined) {
              reassigningFunctions.set(lvalue.identifier.id, reassignment);
            }
          }
          break;
        }
        default: {
          for (const operand of eachInstructionValueOperand(value)) {
            const reassignment = reassigningFunctions.get(
              operand.identifier.id
            );
            if (reassignment !== undefined) {
              reassigningFunctions.set(lvalue.identifier.id, reassignment);
              break;
            }
          }
          break;
        }
      }
    }
    for (const operand of eachTerminalOperand(block.terminal)) {
      const reassignment = reassigningFunctions.get(operand.identifier.id);
      if (reassignment !== undefined) {
        return reassignment;
      }
    }
  }
  return null;
}
