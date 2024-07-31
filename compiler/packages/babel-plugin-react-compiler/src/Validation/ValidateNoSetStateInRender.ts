/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {CompilerError, ErrorSeverity} from '../CompilerError';
import {HIRFunction, IdentifierId, isSetStateType} from '../HIR';
import {computeUnconditionalBlocks} from '../HIR/ComputeUnconditionalBlocks';
import {eachInstructionValueOperand} from '../HIR/visitors';
import {Err, Ok, Result} from '../Utils/Result';

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
export function validateNoSetStateInRender(fn: HIRFunction): void {
  const unconditionalSetStateFunctions: Set<IdentifierId> = new Set();
  validateNoSetStateInRenderImpl(fn, unconditionalSetStateFunctions).unwrap();
}

function validateNoSetStateInRenderImpl(
  fn: HIRFunction,
  unconditionalSetStateFunctions: Set<IdentifierId>,
): Result<void, CompilerError> {
  const unconditionalBlocks = computeUnconditionalBlocks(fn);
  let activeManualMemoId: number | null = null;
  const errors = new CompilerError();
  for (const [, block] of fn.body.blocks) {
    for (const instr of block.instructions) {
      switch (instr.value.kind) {
        case 'LoadLocal': {
          if (
            unconditionalSetStateFunctions.has(instr.value.place.identifier.id)
          ) {
            unconditionalSetStateFunctions.add(instr.lvalue.identifier.id);
          }
          break;
        }
        case 'StoreLocal': {
          if (
            unconditionalSetStateFunctions.has(instr.value.value.identifier.id)
          ) {
            unconditionalSetStateFunctions.add(
              instr.value.lvalue.place.identifier.id,
            );
            unconditionalSetStateFunctions.add(instr.lvalue.identifier.id);
          }
          break;
        }
        case 'ObjectMethod':
        case 'FunctionExpression': {
          if (
            // faster-path to check if the function expression references a setState
            [...eachInstructionValueOperand(instr.value)].some(
              operand =>
                isSetStateType(operand.identifier) ||
                unconditionalSetStateFunctions.has(operand.identifier.id),
            ) &&
            // if yes, does it unconditonally call it?
            validateNoSetStateInRenderImpl(
              instr.value.loweredFunc.func,
              unconditionalSetStateFunctions,
            ).isErr()
          ) {
            // This function expression unconditionally calls a setState
            unconditionalSetStateFunctions.add(instr.lvalue.identifier.id);
          }
          break;
        }
        case 'StartMemoize': {
          CompilerError.invariant(activeManualMemoId === null, {
            reason: 'Unexpected nested StartMemoize instructions',
            loc: instr.value.loc,
          });
          activeManualMemoId = instr.value.manualMemoId;
          break;
        }
        case 'FinishMemoize': {
          CompilerError.invariant(
            activeManualMemoId === instr.value.manualMemoId,
            {
              reason:
                'Expected FinishMemoize to align with previous StartMemoize instruction',
              loc: instr.value.loc,
            },
          );
          activeManualMemoId = null;
          break;
        }
        case 'CallExpression': {
          const callee = instr.value.callee;
          if (
            isSetStateType(callee.identifier) ||
            unconditionalSetStateFunctions.has(callee.identifier.id)
          ) {
            if (activeManualMemoId !== null) {
              errors.push({
                reason:
                  'Calling setState from useMemo may trigger an infinite loop. (https://react.dev/reference/react/useState)',
                description: null,
                severity: ErrorSeverity.InvalidReact,
                loc: callee.loc,
                suggestions: null,
              });
            } else if (unconditionalBlocks.has(block.id)) {
              errors.push({
                reason:
                  'This is an unconditional set state during render, which will trigger an infinite loop. (https://react.dev/reference/react/useState)',
                description: null,
                severity: ErrorSeverity.InvalidReact,
                loc: callee.loc,
                suggestions: null,
              });
            }
          }
          break;
        }
      }
    }
  }

  if (errors.hasErrors()) {
    return Err(errors);
  } else {
    return Ok(undefined);
  }
}
