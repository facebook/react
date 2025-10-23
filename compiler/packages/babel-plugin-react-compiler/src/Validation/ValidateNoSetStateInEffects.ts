/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  CompilerDiagnostic,
  CompilerError,
  ErrorCategory,
} from '../CompilerError';
import {
  Environment,
  HIRFunction,
  IdentifierId,
  isSetStateType,
  isUseEffectHookType,
  isUseInsertionEffectHookType,
  isUseLayoutEffectHookType,
  isUseRefType,
  isRefValueType,
  Place,
} from '../HIR';
import {
  eachInstructionLValue,
  eachInstructionValueOperand,
} from '../HIR/visitors';
import {Result} from '../Utils/Result';
import {Iterable_some} from '../Utils/utils';

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
  env: Environment,
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
              env,
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
                    category: ErrorCategory.EffectSetState,
                    reason:
                      'Calling setState synchronously within an effect can trigger cascading renders',
                    description:
                      'Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. ' +
                      'In general, the body of an effect should do one or both of the following:\n' +
                      '* Update external systems with the latest state from React.\n' +
                      '* Subscribe for updates from some external system, calling setState in a callback function when external state changes.\n\n' +
                      'Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. ' +
                      '(https://react.dev/learn/you-might-not-need-an-effect)',
                    suggestions: null,
                  }).withDetails({
                    kind: 'error',
                    loc: setState.loc,
                    message:
                      'Avoid calling setState() directly within an effect',
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
  env: Environment,
): Place | null {
  const refDerivedValues: Set<IdentifierId> = new Set();

  const isDerivedFromRef = (place: Place): boolean => {
    return (
      refDerivedValues.has(place.identifier.id) ||
      isUseRefType(place.identifier) ||
      isRefValueType(place.identifier)
    );
  };

  for (const [, block] of fn.body.blocks) {
    for (const instr of block.instructions) {
      if (env.config.enableAllowSetStateFromRefsInEffects) {
        const hasRefOperand = Iterable_some(
          eachInstructionValueOperand(instr.value),
          isDerivedFromRef,
        );

        if (hasRefOperand) {
          for (const lvalue of eachInstructionLValue(instr)) {
            refDerivedValues.add(lvalue.identifier.id);
          }
        }

        if (
          instr.value.kind === 'PropertyLoad' &&
          instr.value.property === 'current' &&
          (isUseRefType(instr.value.object.identifier) ||
            isRefValueType(instr.value.object.identifier))
        ) {
          refDerivedValues.add(instr.lvalue.identifier.id);
        }
      }

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
            if (env.config.enableAllowSetStateFromRefsInEffects) {
              const arg = instr.value.args.at(0);
              if (
                arg !== undefined &&
                arg.kind === 'Identifier' &&
                refDerivedValues.has(arg.identifier.id)
              ) {
                /**
                 * The one special case where we allow setStates in effects is in the very specific
                 * scenario where the value being set is derived from a ref. For example this may
                 * be needed when initial layout measurements from refs need to be stored in state.
                 */
                return null;
              }
            }
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
