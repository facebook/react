/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { CompilerError, ErrorSeverity } from "../CompilerError";
import {
  BlockId,
  HIRFunction,
  IdentifierId,
  Place,
  computePostDominatorTree,
  isSetStateType,
} from "../HIR";
import { PostDominator } from "../HIR/Dominator";
import { eachInstructionValueOperand } from "../HIR/visitors";
import { findBlocksWithBackEdges } from "../Optimization/DeadCodeElimination";
import { Err, Ok, Result } from "../Utils/Result";

/**
 * Validates that the given function does not have an infinite update loop
 * caused by unconditionally calling setState during render. This validation
 * is conservative and cannot catch all cases of unconditional setState in
 * render, but avoids false positives. Examples of cases that are caught:
 *
 * ```javascript
 * // Direct call of setState:
 * const [state, setState] = useState(false);
 * setState(true);
 *
 * // Indirect via a function:
 * const [state, setState] = useState(false);
 * const setTrue = () => setState(true);
 * setTrue();
 * ```
 *
 * However, storing setState inside another value and accessing it is not yet
 * validated:
 *
 * ```
 * // false negative, not detected but will cause an infinite render loop
 * const [state, setState] = useState(false);
 * const x = [setState];
 * const y = x.pop();
 * y();
 * ```
 */
export function validateNoSetStateInRender(
  fn: HIRFunction
): Result<PostDominator<BlockId>, CompilerError> {
  const unconditionalSetStateFunctions: Set<IdentifierId> = new Set();
  return validateNoSetStateInRenderImpl(fn, unconditionalSetStateFunctions);
}

function validateNoSetStateInRenderImpl(
  fn: HIRFunction,
  unconditionalSetStateFunctions: Set<IdentifierId>
): Result<PostDominator<BlockId>, CompilerError> {
  // Construct the set of blocks that is always reachable from the entry block.
  const unconditionalBlocks = new Set<BlockId>();
  const blocksWithBackEdges = findBlocksWithBackEdges(fn);
  const dominators = computePostDominatorTree(fn, {
    includeThrowsAsExitNode: false,
  });
  const exit = dominators.exit;
  let current: BlockId | null = fn.body.entry;
  while (
    current !== null &&
    current !== exit &&
    !blocksWithBackEdges.has(current)
  ) {
    unconditionalBlocks.add(current);
    current = dominators.get(current);
  }

  const errors = new CompilerError();
  for (const [, block] of fn.body.blocks) {
    if (unconditionalBlocks.has(block.id)) {
      for (const instr of block.instructions) {
        switch (instr.value.kind) {
          case "LoadLocal": {
            if (
              unconditionalSetStateFunctions.has(
                instr.value.place.identifier.id
              )
            ) {
              unconditionalSetStateFunctions.add(instr.lvalue.identifier.id);
            }
            break;
          }
          case "StoreLocal": {
            if (
              unconditionalSetStateFunctions.has(
                instr.value.value.identifier.id
              )
            ) {
              unconditionalSetStateFunctions.add(
                instr.value.lvalue.place.identifier.id
              );
              unconditionalSetStateFunctions.add(instr.lvalue.identifier.id);
            }
            break;
          }
          case "ObjectMethod":
          case "FunctionExpression": {
            if (fn.env.config.validateNoSetStateInRenderFunctionExpressions) {
              if (
                // faster-path to check if the function expression references a setState
                [...eachInstructionValueOperand(instr.value)].some(
                  (operand) =>
                    isSetStateType(operand.identifier) ||
                    unconditionalSetStateFunctions.has(operand.identifier.id)
                ) &&
                // if yes, does it unconditonally call it?
                validateNoSetStateInRenderImpl(
                  instr.value.loweredFunc.func,
                  unconditionalSetStateFunctions
                ).isErr()
              ) {
                // This function expression unconditionally calls a setState
                unconditionalSetStateFunctions.add(instr.lvalue.identifier.id);
              }
            }
            break;
          }
          case "CallExpression": {
            validateNonSetState(
              errors,
              unconditionalSetStateFunctions,
              instr.value.callee
            );
            break;
          }
        }
      }
    }
  }

  if (errors.hasErrors()) {
    return Err(errors);
  } else {
    return Ok(dominators);
  }
}

function validateNonSetState(
  errors: CompilerError,
  unconditionalSetStateFunctions: Set<IdentifierId>,
  operand: Place
): void {
  if (
    isSetStateType(operand.identifier) ||
    unconditionalSetStateFunctions.has(operand.identifier.id)
  ) {
    errors.push({
      reason:
        "This is an unconditional set state during render, which will trigger an infinite loop. (https://react.dev/reference/react/useState)",
      description: null,
      severity: ErrorSeverity.InvalidReact,
      loc: typeof operand.loc !== "symbol" ? operand.loc : null,
      suggestions: null,
    });
  }
}
