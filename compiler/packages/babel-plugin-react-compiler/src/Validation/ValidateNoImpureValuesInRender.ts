/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import prettyFormat from 'pretty-format';
import {CompilerDiagnostic, CompilerError, Effect} from '..';
import {
  areEqualSourceLocations,
  HIRFunction,
  IdentifierId,
  InstructionId,
  isJsxType,
  isRefValueType,
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
import {
  assertExhaustive,
  getOrInsertWith,
  Set_filter,
  Set_subtract,
} from '../Utils/utils';
import {printInstruction} from '../HIR/PrintHIR';

type ImpureEffect = Extract<AliasingEffect, {kind: 'Impure'}>;
type RenderEffect = Extract<AliasingEffect, {kind: 'Render'}>;
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
    () => inferImpureValues(fn, impure, cache),
  );
}

function processEffects(
  id: InstructionId,
  effects: Array<AliasingEffect>,
  impure: Map<IdentifierId, ImpureEffect>,
  cache: FunctionCache,
): boolean {
  let hasChanges = false;
  const rendered: Set<IdentifierId> = new Set();
  for (const effect of effects) {
    if (effect.kind === 'Render') {
      rendered.add(effect.place.identifier.id);
    }
  }
  for (const effect of effects) {
    switch (effect.kind) {
      case 'Alias':
      case 'Assign':
      case 'Capture':
      case 'CreateFrom':
      case 'ImmutableCapture': {
        const sourceEffect = impure.get(effect.from.identifier.id);
        if (
          sourceEffect != null &&
          !impure.has(effect.into.identifier.id) &&
          !rendered.has(effect.from.identifier.id) &&
          !isUseRefType(effect.into.identifier) &&
          !isJsxType(effect.into.identifier.type)
        ) {
          impure.set(effect.into.identifier.id, sourceEffect);
          hasChanges = true;
        }
        if (
          sourceEffect == null &&
          (effect.kind === 'Assign' || effect.kind === 'Capture') &&
          !impure.has(effect.from.identifier.id) &&
          !rendered.has(effect.from.identifier.id) &&
          !isUseRefType(effect.from.identifier) &&
          isMutable({id}, effect.into)
        ) {
          const destinationEffect = impure.get(effect.into.identifier.id);
          if (destinationEffect != null) {
            impure.set(effect.from.identifier.id, destinationEffect);
            hasChanges = true;
          }
        }
        break;
      }
      case 'Impure': {
        if (!impure.has(effect.into.identifier.id)) {
          impure.set(effect.into.identifier.id, effect);
          hasChanges = true;
        }
        break;
      }
      case 'Render': {
        break;
      }
      case 'CreateFunction': {
        const result = inferFunctionExpressionMemo(
          effect.function.loweredFunc.func,
          impure,
          cache,
        );
        if (result.error.hasAnyErrors()) {
          break;
        }
        const impureEffect: ImpureEffect | null =
          result.effects.find(
            (functionEffect: AliasingEffect): functionEffect is ImpureEffect =>
              functionEffect.kind === 'Impure' &&
              functionEffect.into.identifier.id ===
                effect.function.loweredFunc.func.returns.identifier.id,
          ) ?? null;
        if (impureEffect != null) {
          impure.set(effect.into.identifier.id, impureEffect);
          hasChanges = true;
        }
        break;
      }
      case 'MaybeAlias':
      case 'Apply':
      case 'Create':
      case 'Freeze':
      case 'Mutate':
      case 'MutateConditionally':
      case 'MutateFrozen':
      case 'MutateGlobal':
      case 'MutateTransitive':
      case 'MutateTransitiveConditionally': {
        break;
      }
    }
  }
  return hasChanges;
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
        const _impure = new Set(impure.keys());
        hasChanges =
          processEffects(instr.id, instr.effects ?? [], impure, cache) ||
          hasChanges;
      }
      if (block.terminal.kind === 'return' && block.terminal.effects != null) {
        hasChanges =
          processEffects(
            block.terminal.id,
            block.terminal.effects,
            impure,
            cache,
          ) || hasChanges;
      }
    }
  } while (hasChanges);

  fn.env.logger?.debugLogIRs?.({
    kind: 'debug',
    name: 'ValidateNoImpureValuesInRender',
    value: JSON.stringify(Array.from(impure.keys()).sort(), null, 2),
  });

  const error = new CompilerError();
  function validateRenderEffect(effect: RenderEffect): void {
    const impureEffect = impure.get(effect.place.identifier.id);
    if (impureEffect == null) {
      return;
    }
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
        if (effect.kind === 'Render') {
          validateRenderEffect(effect);
        }
      }
    }
    if (block.terminal.kind === 'return' && block.terminal.effects != null) {
      for (const effect of block.terminal.effects) {
        if (effect.kind === 'Render') {
          validateRenderEffect(effect);
        }
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
        into: impureEffect.into,
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
