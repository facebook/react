/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {HIRFunction, IdentifierId, Place, ScopeId, ValueKind} from '../HIR';
import {getOrInsertDefault} from '../Utils/utils';
import {AliasingEffect} from './InferMutationAliasingEffects';

export function inferMutationAliasingFunctionEffects(
  fn: HIRFunction,
): Array<AliasingEffect> | null {
  const effects: Array<AliasingEffect> = [];

  /**
   * Map used to identify tracked variables: params, context vars, return value
   * This is used to detect mutation/capturing/aliasing of params/context vars
   */
  const tracked = new Map<IdentifierId, Place>();
  tracked.set(fn.returns.identifier.id, fn.returns);

  /**
   * Track capturing/aliasing of context vars and params into each other and into the return.
   * We don't need to track locals and intermediate values, since we're only concerned with effects
   * as they relate to arguments visible outside the function.
   *
   * For each aliased identifier we track capture/alias/createfrom and then merge this with how
   * the value is used. Eg capturing an alias => capture. See joinEffects() helper.
   */
  type AliasedIdentifier = {
    kind: AliasingKind;
    place: Place;
  };
  const dataFlow = new Map<IdentifierId, Array<AliasedIdentifier>>();

  /*
   * Check for aliasing of tracked values. Also joins the effects of how the value is
   * used (@param kind) with the aliasing type of each value
   */
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
          effect.kind === 'Assign' ||
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
        } else if (
          effect.kind === 'MutateFrozen' ||
          effect.kind === 'MutateGlobal'
        ) {
          effects.push(effect);
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

  // Create aliasing effects based on observed data flow
  let hasReturn = false;
  for (const [into, from] of dataFlow) {
    const input = tracked.get(into);
    if (input == null) {
      continue;
    }
    for (const aliased of from) {
      const effect = {kind: aliased.kind, from: aliased.place, into: input};
      effects.push(effect);
      if (
        into === fn.returns.identifier.id &&
        (aliased.kind === 'Assign' || aliased.kind === 'CreateFrom')
      ) {
        hasReturn = true;
      }
    }
  }
  // TODO: more precise return effect inference
  if (!hasReturn) {
    effects.push({
      kind: 'Create',
      into: fn.returns,
      value:
        fn.returnType.kind === 'Primitive'
          ? ValueKind.Primitive
          : ValueKind.Mutable,
    });
  }

  return effects;
}

export enum MutationKind {
  None = 0,
  Conditional = 1,
  Definite = 2,
}

type AliasingKind = 'Alias' | 'Capture' | 'CreateFrom' | 'Assign';
function joinEffects(
  effect1: AliasingKind,
  effect2: AliasingKind,
): AliasingKind {
  if (effect1 === 'Capture' || effect2 === 'Capture') {
    return 'Capture';
  } else if (effect1 === 'Assign' || effect2 === 'Assign') {
    return 'Assign';
  } else {
    return 'Alias';
  }
}
