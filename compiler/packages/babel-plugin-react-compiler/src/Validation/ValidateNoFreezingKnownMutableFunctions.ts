/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {CompilerError, Effect, ErrorSeverity} from '..';
import {
  FunctionEffect,
  HIRFunction,
  IdentifierId,
  isMutableEffect,
  isRefOrRefLikeMutableType,
  Place,
} from '../HIR';
import {
  eachInstructionValueOperand,
  eachTerminalOperand,
} from '../HIR/visitors';
import {Result} from '../Utils/Result';
import {Iterable_some} from '../Utils/utils';

/**
 * Validates that functions with known mutations (ie due to types) cannot be passed
 * where a frozen value is expected. Example:
 *
 * ```
 * function Component() {
 *   const cache = new Map();
 *   const onClick = () => {
 *     cache.set(...);
 *   }
 *   useHook(onClick); // ERROR: cannot pass a mutable value
 *   return <Foo onClick={onClick} /> // ERROR: cannot pass a mutable value
 * }
 * ```
 *
 * Because `onClick` function mutates `cache` when called, `onClick` is equivalent to a mutable
 * variables. But unlike other mutables values like an array, the receiver of the function has
 * no way to avoid mutation — for example, a function can receive an array and choose not to mutate
 * it, but there's no way to know that a function is mutable and avoid calling it.
 *
 * This pass detects functions with *known* mutations (Store or Mutate, not ConditionallyMutate)
 * that are passed where a frozen value is expected and rejects them.
 */
export function validateNoFreezingKnownMutableFunctions(
  fn: HIRFunction,
): Result<void, CompilerError> {
  const errors = new CompilerError();
  const contextMutationEffects: Map<
    IdentifierId,
    Extract<FunctionEffect, {kind: 'ContextMutation'}>
  > = new Map();

  function visitOperand(operand: Place): void {
    if (operand.effect === Effect.Freeze) {
      const effect = contextMutationEffects.get(operand.identifier.id);
      if (effect != null) {
        errors.push({
          reason: `This argument is a function which modifies local variables when called, which can bypass memoization and cause the UI not to update`,
          description: `Functions that are returned from hooks, passed as arguments to hooks, or passed as props to components may not mutate local variables`,
          loc: operand.loc,
          severity: ErrorSeverity.InvalidReact,
        });
        errors.push({
          reason: `The function modifies a local variable here`,
          loc: effect.loc,
          severity: ErrorSeverity.InvalidReact,
        });
      }
    }
  }

  for (const block of fn.body.blocks.values()) {
    for (const instr of block.instructions) {
      const {lvalue, value} = instr;
      switch (value.kind) {
        case 'LoadLocal': {
          const effect = contextMutationEffects.get(value.place.identifier.id);
          if (effect != null) {
            contextMutationEffects.set(lvalue.identifier.id, effect);
          }
          break;
        }
        case 'StoreLocal': {
          const effect = contextMutationEffects.get(value.value.identifier.id);
          if (effect != null) {
            contextMutationEffects.set(lvalue.identifier.id, effect);
            contextMutationEffects.set(
              value.lvalue.place.identifier.id,
              effect,
            );
          }
          break;
        }
        case 'FunctionExpression': {
          const knownMutation = (value.loweredFunc.func.effects ?? []).find(
            effect => {
              return (
                effect.kind === 'ContextMutation' &&
                (effect.effect === Effect.Store ||
                  effect.effect === Effect.Mutate) &&
                Iterable_some(effect.places, place => {
                  return (
                    isMutableEffect(place.effect, place.loc) &&
                    !isRefOrRefLikeMutableType(place.identifier.type)
                  );
                })
              );
            },
          );
          if (knownMutation && knownMutation.kind === 'ContextMutation') {
            contextMutationEffects.set(lvalue.identifier.id, knownMutation);
          }
          break;
        }
        default: {
          for (const operand of eachInstructionValueOperand(value)) {
            visitOperand(operand);
          }
        }
      }
    }
    for (const operand of eachTerminalOperand(block.terminal)) {
      visitOperand(operand);
    }
  }
  return errors.asResult();
}
