/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {HIRFunction, IdentifierId, Place} from '../HIR';
import {getOrInsertDefault} from '../Utils/utils';
import {AliasingEffect} from './InferMutationAliasingEffects';

export function inferMutationAliasingFunctionEffects(
  fn: HIRFunction,
): Array<AliasingEffect> | null {
  const effects: Array<AliasingEffect> = [];
  /*
   * Quick hack to infer "mutation" of context vars and params. The problem is that we really want
   * to figure out more precisely what changed. Is there a known mutation, or just a conditional
   * mutation?
   * once we assign scope ids, we can just look through all the effects in the entire body
   * and find the maximum level of mutation on each scope (for scopes that are on context refs/params)
   */
  const tracked = new Map<IdentifierId, Place>();
  tracked.set(fn.returns.identifier.id, fn.returns);
  for (const operand of fn.context) {
    tracked.set(operand.identifier.id, operand);
    if (operand.identifier.mutableRange.end > 0) {
      effects.push({kind: 'MutateTransitiveConditionally', value: operand});
    }
  }
  for (const param of fn.params) {
    const place = param.kind === 'Identifier' ? param : param.place;
    tracked.set(place.identifier.id, place);
    if (place.identifier.mutableRange.end > 0) {
      effects.push({kind: 'MutateTransitiveConditionally', value: place});
    }
  }
  type AliasedIdentifier = {
    kind: 'Capture' | 'Alias' | 'CreateFrom';
    place: Place;
  };
  const dataFlow = new Map<IdentifierId, Array<AliasedIdentifier>>();

  function lookup(
    place: Place,
    kind: AliasedIdentifier['kind'],
  ): Array<AliasedIdentifier> | null {
    if (tracked.has(place.identifier.id)) {
      return [{kind, place}];
    }
    return (
      dataFlow.get(place.identifier.id)?.map(aliased => ({
        kind: joinEffects(aliased.kind, kind),
        place: aliased.place,
      })) ?? null
    );
  }

  // todo: fixpoint
  for (const block of fn.body.blocks.values()) {
    for (const phi of block.phis) {
      const operands: Array<AliasedIdentifier> = [];
      for (const operand of phi.operands.values()) {
        const inputs = lookup(operand, 'Alias');
        if (inputs != null) {
          operands.push(...inputs);
        }
      }
      if (operands.length !== 0) {
        dataFlow.set(phi.place.identifier.id, operands);
      }
    }
    for (const instr of block.instructions) {
      if (instr.effects == null) continue;
      for (const effect of instr.effects) {
        if (
          effect.kind === 'Capture' ||
          effect.kind === 'Alias' ||
          effect.kind === 'CreateFrom'
        ) {
          const from = lookup(effect.from, effect.kind);
          if (from == null) {
            continue;
          }
          const into = lookup(effect.into, 'Alias');
          if (into == null) {
            getOrInsertDefault(dataFlow, effect.into.identifier.id, []).push(
              ...from,
            );
          } else {
            for (const aliased of into) {
              getOrInsertDefault(
                dataFlow,
                aliased.place.identifier.id,
                [],
              ).push(...from);
            }
          }
        }
      }
    }
    if (block.terminal.kind === 'return') {
      const from = lookup(block.terminal.value, 'Alias');
      if (from != null) {
        getOrInsertDefault(dataFlow, fn.returns.identifier.id, []).push(
          ...from,
        );
      }
    }
  }

  for (const [into, from] of dataFlow) {
    const input = tracked.get(into);
    if (input == null) {
      continue;
    }
    for (const aliased of from) {
      const effect = {kind: aliased.kind, from: aliased.place, into: input};
      effects.push(effect);
    }
  }

  return effects;
}

type AliasingKind = 'Alias' | 'Capture' | 'CreateFrom';
function joinEffects(
  effect1: AliasingKind,
  effect2: AliasingKind,
): AliasingKind {
  if (effect1 === 'Capture' || effect2 === 'Capture') {
    return 'Capture';
  } else {
    return 'Alias';
  }
}
