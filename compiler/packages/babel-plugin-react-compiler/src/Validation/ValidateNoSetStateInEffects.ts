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
  isUseEffectEventType,
  isUseInsertionEffectHookType,
  isUseLayoutEffectHookType,
  isUseRefType,
  isRefValueType,
  Place,
  BlockId,
  Effect,
} from '../HIR';
import {
  eachInstructionLValue,
  eachInstructionValueOperand,
} from '../HIR/visitors';
import {createControlDominators} from '../Inference/ControlDominators';
import {isMutable} from '../ReactiveScopes/InferReactiveScopeVariables';
import {Result} from '../Utils/Result';
import {assertExhaustive, Iterable_some} from '../Utils/utils';

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

  function collectSetStateSetters(targetFn: HIRFunction): void {
    for (const [, block] of targetFn.body.blocks) {
      for (const instr of block.instructions) {
        switch (instr.value.kind) {
          case 'LoadLocal': {
            if (setStateFunctions.has(instr.value.place.identifier.id)) {
              setStateFunctions.set(instr.lvalue.identifier.id, instr.value.place);
            }
            break;
          }
          case 'StoreLocal': {
            if (setStateFunctions.has(instr.value.value.identifier.id)) {
              setStateFunctions.set(instr.value.lvalue.place.identifier.id, instr.value.value);
              setStateFunctions.set(instr.lvalue.identifier.id, instr.value.value);
            }
            break;
          }
          case 'FunctionExpression': {
            if (
              [...eachInstructionValueOperand(instr.value)].some(
                operand =>
                  isSetStateType(operand.identifier) ||
                  setStateFunctions.has(operand.identifier.id),
              )
            ) {
              const callee = getSetStateCall(instr.value.loweredFunc.func, setStateFunctions, env);
              if (callee !== null) {
                setStateFunctions.set(instr.lvalue.identifier.id, callee);
              }
            }
            break;
          }
        }
      }
    }
  }

  // First pass: main component body
  collectSetStateSetters(fn);

  // Second pass: any nested functions (fixes #35291 – useState after first useEffect)
  for (const [, block] of fn.body.blocks) {
    for (const instr of block.instructions) {
      if (instr.value.kind === 'FunctionExpression') {
        collectSetStateSetters(instr.value.loweredFunc.func);
      }
    }
  }

  // Validate effects using the complete set of known setters
  for (const [, block] of fn.body.blocks) {
    for (const instr of block.instructions) {
      if (instr.value.kind === 'MethodCall' || instr.value.kind === 'CallExpression') {
        const callee =
          instr.value.kind === 'MethodCall' ? instr.value.receiver : instr.value.callee;

        if (isUseEffectEventType(callee.identifier)) {
          const arg = instr.value.args[0];
          if (arg?.kind === 'Identifier') {
            const setState = setStateFunctions.get(arg.identifier.id);
            if (setState !== undefined) {
              setStateFunctions.set(instr.lvalue.identifier.id, setState);
            }
          }
        } else if (
          isUseEffectHookType(callee.identifier) ||
          isUseLayoutEffectHookType(callee.identifier) ||
          isUseInsertionEffectHookType(callee.identifier)
        ) {
          const arg = instr.value.args[0];
          if (arg?.kind === 'Identifier') {
            const setState = setStateFunctions.get(arg.identifier.id);
            if (setState !== undefined) {
              errors.pushDiagnostic(
                CompilerDiagnostic.create({
                  category: ErrorCategory.EffectSetState,
                  reason: 'Calling setState synchronously within an effect can trigger cascading renders',
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
                  message: 'Avoid calling setState() directly within an effect',
                }),
              );
            }
          }
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
  const enableAllowSetStateFromRefsInEffects = env.config.enableAllowSetStateFromRefsInEffects;
  const refDerivedValues: Set<IdentifierId> = new Set();

  const isDerivedFromRef = (place: Place): boolean =>
    refDerivedValues.has(place.identifier.id) ||
    isUseRefType(place.identifier) ||
    isRefValueType(place.identifier);

  const isRefControlledBlock: (id: BlockId) => boolean =
    enableAllowSetStateFromRefsInEffects
      ? createControlDominators(fn, place => isDerivedFromRef(place))
      : () => false;

  for (const [, block] of fn.body.blocks) {
    if (enableAllowSetStateFromRefsInEffects) {
      for (const phi of block.phis) {
        if (isDerivedFromRef(phi.place)) continue;
        let derived = false;
        for (const [, operand] of phi.operands) {
          if (isDerivedFromRef(operand)) {
            derived = true;
            break;
          }
        }
        if (derived) {
          refDerivedValues.add(phi.place.identifier.id);
        } else {
          for (const [pred] of phi.operands) {
            if (isRefControlledBlock(pred)) {
              refDerivedValues.add(phi.place.identifier.id);
              break;
            }
          }
        }
      }
    }

    for (const instr of block.instructions) {
      if (enableAllowSetStateFromRefsInEffects) {
        const hasRefOperand = Iterable_some(eachInstructionValueOperand(instr.value), isDerivedFromRef);
        if (hasRefOperand) {
          for (const lvalue of eachInstructionLValue(instr)) {
            refDerivedValues.add(lvalue.identifier.id);
          }
          for (const operand of eachInstructionValueOperand(instr.value)) {
            if (
              operand.effect === Effect.Capture ||
              operand.effect === Effect.Store ||
              operand.effect === Effect.ConditionallyMutate ||
              operand.effect === Effect.ConditionallyMutateIterator ||
              operand.effect === Effect.Mutate
            ) {
              if (isMutable(instr, operand)) {
                refDerivedValues.add(operand.identifier.id);
              }
            }
          }
        }

        if (
          instr.value.kind === 'PropertyLoad' &&
          instr.value.property === 'current' &&
          (isUseRefType(instr.value.object.identifier) || isRefValueType(instr.value.object.identifier))
        ) {
          refDerivedValues.add(instr.lvalue.identifier.id);
        }
      }

      switch (instr.value.kind) {
        case 'LoadLocal':
          if (setStateFunctions.has(instr.value.place.identifier.id)) {
            setStateFunctions.set(instr.lvalue.identifier.id, instr.value.place);
          }
          break;
        case 'StoreLocal':
          if (setStateFunctions.has(instr.value.value.identifier.id)) {
            setStateFunctions.set(instr.value.lvalue.place.identifier.id, instr.value.value);
            setStateFunctions.set(instr.lvalue.identifier.id, instr.value.value);
          }
          break;
        case 'CallExpression': {
          const callee = instr.value.callee;
          if (isSetStateType(callee.identifier) || setStateFunctions.has(callee.identifier.id)) {
            if (enableAllowSetStateFromRefsInEffects) {
              const arg = instr.value.args[0];
              if (arg?.kind === 'Identifier' && refDerivedValues.has(arg.identifier.id)) {
                return null;
              }
              if (isRefControlledBlock(block.id)) {
                continue;
              }
            }
            return callee;
          }
          break;
        }
      }
    }
  }
  return null;
}