/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  CompilerDiagnostic,
  CompilerError,
  Effect,
  ErrorCategory,
  SourceLocation,
} from '..';
import {GeneratedSource, HIRFunction, IdentifierId, isUseRefType} from '../HIR';
import {printInstruction} from '../HIR/PrintHIR';
import {
  eachInstructionLValue,
  eachInstructionValueOperand,
} from '../HIR/visitors';
import {AliasingEffect} from '../Inference/AliasingEffects';
import {createControlDominators} from '../Inference/ControlDominators';
import {isMutable} from '../ReactiveScopes/InferReactiveScopeVariables';
import {Err, Ok, Result} from '../Utils/Result';
import {assertExhaustive} from '../Utils/utils';

type ImpureEffect = Extract<AliasingEffect, {kind: 'Impure'}>;
type ImpureInstance = {loc: SourceLocation; effect: ImpureEffect};

export function validateNoImpureValuesInRender(
  fn: HIRFunction,
): Result<Array<ImpureEffect>, CompilerError> {
  const impure = new Map<IdentifierId, ImpureInstance>();
  const result = inferImpureValues(fn, impure);
  if (result.error.hasAnyErrors()) {
    return Err(result.error);
  }
  return Ok(result.effects);
}

function inferImpureValues(
  fn: HIRFunction,
  impure: Map<IdentifierId, ImpureInstance>,
): {effects: Array<ImpureEffect>; error: CompilerError} {
  const getBlockControl = createControlDominators(fn, place => {
    return impure.has(place.identifier.id);
  });

  let hasChanges = false;
  do {
    hasChanges = false;

    for (const block of fn.body.blocks.values()) {
      const controlTest =
        getBlockControl(block.id) != null
          ? impure.get(getBlockControl(block.id)!.identifier.id)
          : null;

      for (const phi of block.phis) {
        if (impure.has(phi.place.identifier.id)) {
          // Already marked reactive on a previous pass
          continue;
        }
        let impurePhiSource = null;
        for (const [, operand] of phi.operands) {
          const operandSource = impure.get(operand.identifier.id);
          if (operandSource != null) {
            impurePhiSource = operandSource;
            break;
          }
        }
        if (impurePhiSource != null) {
          impure.set(phi.place.identifier.id, impurePhiSource);
          hasChanges = true;
        } else {
          for (const [pred] of phi.operands) {
            const predControl = getBlockControl(pred);
            if (predControl != null) {
              const predSource = impure.get(predControl.identifier.id);
              if (predSource != null) {
                impure.set(phi.place.identifier.id, {
                  loc: predControl.loc,
                  effect: predSource.effect,
                });
                hasChanges = true;
                break;
              }
            }
          }
        }
      }

      for (const instr of block.instructions) {
        let impureEffect: ImpureEffect | undefined = instr.effects?.find(
          (effect: AliasingEffect): effect is ImpureEffect =>
            effect.kind === 'Impure',
        );

        if (
          impureEffect == null &&
          (instr.value.kind === 'FunctionExpression' ||
            instr.value.kind === 'ObjectMethod')
        ) {
          impureEffect = instr.value.loweredFunc.func.aliasingEffects?.find(
            (effect: AliasingEffect): effect is ImpureEffect =>
              effect.kind === 'Impure',
          );
          if (
            impureEffect == null &&
            instr.value.loweredFunc.func.context.some(place =>
              impure.has(place.identifier.id),
            )
          ) {
            const result = inferImpureValues(
              instr.value.loweredFunc.func,
              impure,
            );
            instr.effects ??= [];
            instr.effects.push(...result.effects);
            impureEffect = result.effects[0];
          }
        }

        if (impureEffect == null) {
          for (const operand of eachInstructionValueOperand(instr.value)) {
            const effect = impure.get(operand.identifier.id);
            if (effect != null) {
              impureEffect = effect.effect;
            }
          }
        }

        if (impureEffect != null) {
          for (const lvalue of eachInstructionLValue(instr)) {
            if (isUseRefType(lvalue.identifier)) {
              continue;
            }
            if (!impure.has(lvalue.identifier.id)) {
              impure.set(lvalue.identifier.id, {
                loc: impureEffect.into.loc,
                effect: impureEffect,
              });
              hasChanges = true;
            }
          }
        }
        if (impureEffect != null || controlTest != null) {
          for (const operand of eachInstructionValueOperand(instr.value)) {
            switch (operand.effect) {
              case Effect.Capture:
              case Effect.Store:
              case Effect.ConditionallyMutate:
              case Effect.ConditionallyMutateIterator:
              case Effect.Mutate: {
                if (
                  !impure.has(operand.identifier.id) &&
                  isMutable(instr, operand)
                ) {
                  impure.set(operand.identifier.id, {
                    loc:
                      impureEffect?.into.loc ??
                      controlTest?.loc ??
                      GeneratedSource,
                    effect: (impureEffect ?? controlTest?.effect)!,
                  });
                  hasChanges = true;
                }
                break;
              }
              case Effect.Freeze:
              case Effect.Read: {
                // no-op
                break;
              }
              case Effect.Unknown: {
                CompilerError.invariant(false, {
                  reason: 'Unexpected unknown effect',
                  description: null,
                  details: [
                    {
                      kind: 'error',
                      loc: operand.loc,
                      message: null,
                    },
                  ],
                  suggestions: null,
                });
              }
              default: {
                assertExhaustive(
                  operand.effect,
                  `Unexpected effect kind \`${operand.effect}\``,
                );
              }
            }
          }
        }
      }
    }
  } while (hasChanges);

  const error = new CompilerError();
  for (const block of fn.body.blocks.values()) {
    for (const instr of block.instructions) {
      const value = instr.value;
      if (
        value.kind === 'FunctionExpression' ||
        value.kind === 'ObjectMethod'
      ) {
        const result = inferImpureValues(value.loweredFunc.func, impure);
        if (result.error.hasAnyErrors()) {
          error.merge(result.error);
        }
      }
      for (const effect of instr.effects ?? []) {
        if (
          effect.kind !== 'Render' ||
          !impure.has(effect.place.identifier.id)
        ) {
          continue;
        }
        const impureInst = impure.get(effect.place.identifier.id)!;
        error.pushDiagnostic(
          CompilerDiagnostic.create({
            category: ErrorCategory.Purity,
            reason: 'Cannot access impure value during render',
            description:
              'Calling an impure function can produce unstable results that update unpredictably when the component happens to re-render. (https://react.dev/reference/rules/components-and-hooks-must-be-pure#components-and-hooks-must-be-idempotent)',
          })
            .withDetails({
              kind: 'error',
              loc: effect.place.loc,
              message: 'Cannot access impure value during render',
            })
            .withDetails({
              kind: 'error',
              loc: impureInst.loc,
              message: impureInst.effect.error.description,
            }),
        );
      }
    }
  }
  const impureEffects: Array<ImpureEffect> = [];
  for (const param of [...fn.context, ...fn.params, fn.returns]) {
    const place = param.kind === 'Identifier' ? param : param.place;
    const inst = impure.get(place.identifier.id);
    if (inst != null) {
      impureEffects.push({
        kind: 'Impure',
        error: inst.effect.error,
        into: {...place},
      });
    }
  }
  return {effects: impureEffects, error};
}
