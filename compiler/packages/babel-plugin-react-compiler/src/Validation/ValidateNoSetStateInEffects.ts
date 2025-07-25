/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  CompilerDiagnostic,
  CompilerError,
  ErrorSeverity,
} from '../CompilerError';
import {
  HIRFunction,
  IdentifierId,
  isSetStateType,
  isUseEffectHookType,
  isUseInsertionEffectHookType,
  isUseLayoutEffectHookType,
  Place,
} from '../HIR';
import {eachInstructionValueOperand} from '../HIR/visitors';
import {Result} from '../Utils/Result';

/**
 * Validates against calling setState in the body of an effect (useEffect and friends),
 * while allowing calling setState in callbacks scheduled by the effect.
 *
 * Calling setState during execution of a useEffect triggers a re-render, which is
 * often bad for performance and frequently has more efficient and straightforward
 * alternatives. See https://react.dev/learn/you-might-not-need-an-effect for examples.
 */
export function validateNoSetStateInEffects(
  fn: HIRFunction,
): Result<void, CompilerError> {
  const setStateFunctions: Map<IdentifierId, Place> = new Map();
  const errors = new CompilerError();
  for (const [, block] of fn.body.blocks) {
    for (const instr of block.instructions) {
      switch (instr.value.kind) {
        case 'LoadLocal': {
          if (setStateFunctions.has(instr.value.place.identifier.id)) {
            setStateFunctions.set(
              instr.lvalue.identifier.id,
              instr.value.place,
            );
          }
          break;
        }
        case 'StoreLocal': {
          if (setStateFunctions.has(instr.value.value.identifier.id)) {
            setStateFunctions.set(
              instr.value.lvalue.place.identifier.id,
              instr.value.value,
            );
            setStateFunctions.set(
              instr.lvalue.identifier.id,
              instr.value.value,
            );
          }
          break;
        }
        case 'FunctionExpression': {
          if (
            // faster-path to check if the function expression references a setState
            [...eachInstructionValueOperand(instr.value)].some(
              operand =>
                isSetStateType(operand.identifier) ||
                setStateFunctions.has(operand.identifier.id),
            )
          ) {
            const callee = getSetStateCall(
              instr.value.loweredFunc.func,
              setStateFunctions,
            );
            if (callee !== null) {
              setStateFunctions.set(instr.lvalue.identifier.id, callee);
            }
          }
          break;
        }
        case 'MethodCall':
        case 'CallExpression': {
          const callee =
            instr.value.kind === 'MethodCall'
              ? instr.value.receiver
              : instr.value.callee;
          if (
            isUseEffectHookType(callee.identifier) ||
            isUseLayoutEffectHookType(callee.identifier) ||
            isUseInsertionEffectHookType(callee.identifier)
          ) {
            const arg = instr.value.args[0];
            if (arg !== undefined && arg.kind === 'Identifier') {
              const setState = setStateFunctions.get(arg.identifier.id);
              if (setState !== undefined) {
                errors.pushDiagnostic(
                  CompilerDiagnostic.create({
                    category:
                      'Calling setState within an effect can trigger cascading renders',
                    description:
                      'Calling setState directly within a useEffect causes cascading renders that can hurt performance, and is not recommended. Consider alternatives to useEffect. (https://react.dev/learn/you-might-not-need-an-effect)',
                    severity: ErrorSeverity.InvalidReact,
                    suggestions: null,
                  }).withDetail({
                    kind: 'error',
                    loc: setState.loc,
                    message:
                      'Avoid calling setState() in the top-level of an effect',
                  }),
                );
              }
            }
          }
          break;
        }
      }
    }
  }

  return errors.asResult();
}

function getSetStateCall(
  fn: HIRFunction,
  setStateFunctions: Map<IdentifierId, Place>,
): Place | null {
  for (const [, block] of fn.body.blocks) {
    for (const instr of block.instructions) {
      switch (instr.value.kind) {
        case 'LoadLocal': {
          if (setStateFunctions.has(instr.value.place.identifier.id)) {
            setStateFunctions.set(
              instr.lvalue.identifier.id,
              instr.value.place,
            );
          }
          break;
        }
        case 'StoreLocal': {
          if (setStateFunctions.has(instr.value.value.identifier.id)) {
            setStateFunctions.set(
              instr.value.lvalue.place.identifier.id,
              instr.value.value,
            );
            setStateFunctions.set(
              instr.lvalue.identifier.id,
              instr.value.value,
            );
          }
          break;
        }
        case 'CallExpression': {
          const callee = instr.value.callee;
          if (
            isSetStateType(callee.identifier) ||
            setStateFunctions.has(callee.identifier.id)
          ) {
            /*
             * TODO: once we support multiple locations per error, we should link to the
             * original Place in the case that setStateFunction.has(callee)
             */
            return callee;
          }
        }
      }
    }
  }
  return null;
}
