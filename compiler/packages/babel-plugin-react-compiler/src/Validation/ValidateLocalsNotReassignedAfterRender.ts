/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { CompilerError, Effect } from "..";
import { HIRFunction, IdentifierId, Place } from "../HIR";
import {
  eachInstructionValueOperand,
  eachTerminalOperand,
} from "../HIR/visitors";

/**
 * Validates that local variables cannot be reassigned after render.
 * This prevents a category of bugs in which a closure captures a
 * binding from one render but does not update
 */
export function validateLocalsNotReassignedAfterRender(fn: HIRFunction): void {
  const contextVariables = new Set<IdentifierId>();
  const reassignment = getContextReassignment(
    fn,
    contextVariables,
    false,
    false
  );
  if (reassignment !== null) {
    CompilerError.throwInvalidReact({
      reason:
        "Reassigning a variable after render has completed can cause inconsistent behavior on subsequent renders. Consider using state instead",
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
  isFunctionExpression: boolean,
  isAsync: boolean
): Place | null {
  const reassigningFunctions = new Map<IdentifierId, Place>();
  for (const [, block] of fn.body.blocks) {
    for (const instr of block.instructions) {
      const { lvalue, value } = instr;
      switch (value.kind) {
        case "FunctionExpression":
        case "ObjectMethod": {
          let reassignment = getContextReassignment(
            value.loweredFunc.func,
            contextVariables,
            true,
            isAsync || value.loweredFunc.func.async
          );
          if (reassignment === null) {
            // If the function itself doesn't reassign, does one of its dependencies?
            for (const operand of eachInstructionValueOperand(value)) {
              const reassignmentFromOperand = reassigningFunctions.get(
                operand.identifier.id
              );
              if (reassignmentFromOperand !== undefined) {
                reassignment = reassignmentFromOperand;
                break;
              }
            }
          }
          // if the function or its depends reassign, propagate that fact on the lvalue
          if (reassignment !== null) {
            if (isAsync || value.loweredFunc.func.async) {
              CompilerError.throwInvalidReact({
                reason:
                  "Reassigning a variable in an async function can cause inconsistent behavior on subsequent renders. Consider using state instead",
                description:
                  reassignment.identifier.name !== null &&
                  reassignment.identifier.name.kind === "named"
                    ? `Variable \`${reassignment.identifier.name.value}\` cannot be reassigned after render`
                    : "",
                loc: reassignment.loc,
              });
            }
            reassigningFunctions.set(lvalue.identifier.id, reassignment);
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
            /*
             * We only track reassignments of variables defined in the outer
             * component or hook.
             */
            contextVariables.add(value.lvalue.place.identifier.id);
          }
          break;
        }
        default: {
          for (const operand of eachInstructionValueOperand(value)) {
            CompilerError.invariant(operand.effect !== Effect.Unknown, {
              reason: `Expected effects to be inferred prior to ValidateLocalsNotReassignedAfterRender`,
              loc: operand.loc,
            });
            const reassignment = reassigningFunctions.get(
              operand.identifier.id
            );
            if (
              reassignment !== undefined &&
              operand.effect === Effect.Freeze
            ) {
              /*
               * Functions that reassign local variables are inherently mutable and are unsafe to pass
               * to a place that expects a frozen value. Propagate the reassignment upward.
               */
              return reassignment;
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
