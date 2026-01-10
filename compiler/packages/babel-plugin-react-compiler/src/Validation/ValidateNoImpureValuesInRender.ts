/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {CompilerDiagnostic, CompilerError, Effect} from '..';
import {
  areEqualSourceLocations,
  HIRFunction,
  IdentifierId,
  isUseRefType,
} from '../HIR';
import {
  eachInstructionLValue,
  eachInstructionValueOperand,
} from '../HIR/visitors';
import {AliasingEffect} from '../Inference/AliasingEffects';
import {createControlDominators} from '../Inference/ControlDominators';
import {isMutable} from '../ReactiveScopes/InferReactiveScopeVariables';
import {Err, Ok, Result} from '../Utils/Result';
import {assertExhaustive, getOrInsertWith} from '../Utils/utils';

type ImpureEffect = Extract<AliasingEffect, {kind: 'Impure'}>;
type FunctionCache = Map<HIRFunction, Map<string, ImpuritySignature>>;
type ImpuritySignature = {effects: Array<ImpureEffect>; error: CompilerError};

export function validateNoImpureValuesInRender(
  fn: HIRFunction,
): Result<void, CompilerError> {
  const impure = new Map<IdentifierId, ImpureEffect>();
  const result = inferImpureValues(fn, impure, new Map());

  if (result.error.hasAnyErrors()) {
    return Err(result.error);
  }
  return Ok(undefined);
}

function inferFunctionExpressionMemo(
  fn: HIRFunction,
  impure: Map<IdentifierId, ImpureEffect>,
  cache: FunctionCache,
): ImpuritySignature {
  const key = fn.context
    .map(place => `${place.identifier.id}:${impure.has(place.identifier.id)}`)
    .join(',');
  return getOrInsertWith(
    getOrInsertWith(cache, fn, () => new Map()),
    key,
    () => {
      return inferImpureValues(fn, impure, cache);
    },
  );
}

function inferImpureValues(
  fn: HIRFunction,
  impure: Map<IdentifierId, ImpureEffect>,
  cache: FunctionCache,
): ImpuritySignature {
  const getBlockControl = createControlDominators(fn, place => {
    return impure.has(place.identifier.id);
  });

  let hasChanges = false;
  do {
    hasChanges = false;

    for (const block of fn.body.blocks.values()) {
      const controlPlace = getBlockControl(block.id);
      const controlImpureEffect =
        controlPlace != null ? impure.get(controlPlace.identifier.id) : null;

      for (const phi of block.phis) {
        if (impure.has(phi.place.identifier.id)) {
          // Already marked impure on a previous pass
          continue;
        }
        let impureEffect = null;
        for (const [, operand] of phi.operands) {
          const operandEffect = impure.get(operand.identifier.id);
          if (operandEffect != null) {
            impureEffect = operandEffect;
            break;
          }
        }
        if (impureEffect != null) {
          impure.set(phi.place.identifier.id, impureEffect);
          hasChanges = true;
        } else {
          for (const [pred] of phi.operands) {
            const predControl = getBlockControl(pred);
            if (predControl != null) {
              const predEffect = impure.get(predControl.identifier.id);
              if (predEffect != null) {
                impure.set(phi.place.identifier.id, predEffect);
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
          if (impureEffect == null) {
            const result = inferFunctionExpressionMemo(
              instr.value.loweredFunc.func,
              impure,
              cache,
            );
            if (!result.error.hasAnyErrors()) {
              impureEffect = result.effects[0];
            }
          }
        }

        if (impureEffect == null) {
          for (const operand of eachInstructionValueOperand(instr.value)) {
            const operandEffect = impure.get(operand.identifier.id);
            if (operandEffect != null) {
              impureEffect = operandEffect;
              break;
            }
          }
        }

        if (impureEffect != null) {
          for (const lvalue of eachInstructionLValue(instr)) {
            if (isUseRefType(lvalue.identifier)) {
              continue;
            }
            if (!impure.has(lvalue.identifier.id)) {
              impure.set(lvalue.identifier.id, impureEffect);
              hasChanges = true;
            }
          }
        }
        if (impureEffect != null || controlImpureEffect != null) {
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
                  impure.set(
                    operand.identifier.id,
                    (impureEffect ?? controlImpureEffect)!,
                  );
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
        if (impureEffect == null) {
          const lvalueEffect = impure.get(instr.lvalue.identifier.id)!;
          if (lvalueEffect != null) {
            for (const operand of eachInstructionValueOperand(instr.value)) {
              if (
                isMutable(instr, operand) &&
                !impure.has(operand.identifier.id)
              ) {
                impure.set(operand.identifier.id, lvalueEffect);
                hasChanges = true;
              }
            }
          }
        }
      }

      if (block.terminal.kind === 'return') {
        const terminalEffect = impure.get(block.terminal.value.identifier.id);
        if (terminalEffect != null && !impure.has(fn.returns.identifier.id)) {
          impure.set(fn.returns.identifier.id, terminalEffect);
          hasChanges = true;
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
        const result = inferFunctionExpressionMemo(
          value.loweredFunc.func,
          impure,
          cache,
        );
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
        const impureEffect = impure.get(effect.place.identifier.id)!;
        const diagnostic = CompilerDiagnostic.create({
          category: impureEffect.category,
          reason: impureEffect.reason,
          description: impureEffect.description,
        }).withDetails({
          kind: 'error',
          loc: effect.place.loc,
          message: impureEffect.usageMessage,
        });
        if (!areEqualSourceLocations(effect.place.loc, impureEffect.into.loc)) {
          diagnostic.withDetails({
            kind: 'error',
            loc: impureEffect.into.loc,
            message: impureEffect.sourceMessage,
          });
        }
        error.pushDiagnostic(diagnostic);
      }
    }
  }
  const impureEffects: Array<ImpureEffect> = [];
  for (const param of [...fn.context, ...fn.params, fn.returns]) {
    const place = param.kind === 'Identifier' ? param : param.place;
    const impureEffect = impure.get(place.identifier.id);
    if (impureEffect != null) {
      impureEffects.push({
        kind: 'Impure',
        into: {...place},
        category: impureEffect.category,
        reason: impureEffect.reason,
        description: impureEffect.description,
        sourceMessage: impureEffect.sourceMessage,
        usageMessage: impureEffect.usageMessage,
      });
    }
  }
  return {effects: impureEffects, error};
}
