/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {HIRFunction, IdentifierId, Place, ScopeId} from '../HIR';
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
   * For each reactive scope we track whether there are known/conditional local and transitive
   * mutations. This is used to recover precise mutation effects for each of the params and
   * context variables.
   */
  const trackedScopes = new Map<
    ScopeId,
    {local: MutationKind; transitive: MutationKind}
  >();
  for (const operand of fn.context) {
    tracked.set(operand.identifier.id, operand);
    if (operand.identifier.scope != null) {
      getOrInsertDefault(trackedScopes, operand.identifier.scope.id, {
        local: MutationKind.None,
        transitive: MutationKind.None,
      });
    }
  }
  for (const param of fn.params) {
    const place = param.kind === 'Identifier' ? param : param.place;
    tracked.set(place.identifier.id, place);
    if (place.identifier.scope != null) {
      getOrInsertDefault(trackedScopes, place.identifier.scope.id, {
        local: MutationKind.None,
        transitive: MutationKind.None,
      });
    }
  }

  /**
   * Track capturing/aliasing of context vars and params into each other and into the return.
   * We don't need to track locals and intermediate values, since we're only concerned with effects
   * as they relate to arguments visible outside the function.
   *
   * For each aliased identifier we track capture/alias/createfrom and then merge this with how
   * the value is used. Eg capturing an alias => capture. See joinEffects() helper.
   */
  type AliasedIdentifier = {
    kind: 'Capture' | 'Alias' | 'CreateFrom';
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
          effect.kind === 'Mutate' &&
          effect.value.identifier.scope != null &&
          trackedScopes.has(effect.value.identifier.scope.id)
        ) {
          const scope = trackedScopes.get(effect.value.identifier.scope.id)!;
          scope.local = MutationKind.Definite;
        } else if (
          effect.kind === 'MutateConditionally' &&
          effect.value.identifier.scope != null &&
          trackedScopes.has(effect.value.identifier.scope.id)
        ) {
          const scope = trackedScopes.get(effect.value.identifier.scope.id)!;
          scope.local = Math.max(MutationKind.Conditional, scope.local);
        } else if (
          effect.kind === 'MutateTransitive' &&
          effect.value.identifier.scope != null &&
          trackedScopes.has(effect.value.identifier.scope.id)
        ) {
          const scope = trackedScopes.get(effect.value.identifier.scope.id)!;
          scope.transitive = MutationKind.Definite;
        } else if (
          effect.kind === 'MutateTransitiveConditionally' &&
          effect.value.identifier.scope != null &&
          trackedScopes.has(effect.value.identifier.scope.id)
        ) {
          const scope = trackedScopes.get(effect.value.identifier.scope.id)!;
          scope.transitive = Math.max(
            MutationKind.Conditional,
            scope.transitive,
          );
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

  // Create mutation effects based on observed mutation types
  for (const value of tracked.values()) {
    if (
      value.identifier.id === fn.returns.identifier.id ||
      value.identifier.scope == null
    ) {
      continue;
    }
    const scope = trackedScopes.get(value.identifier.scope.id)!;
    if (scope.local === MutationKind.Definite) {
      effects.push({kind: 'Mutate', value});
    } else if (scope.local === MutationKind.Conditional) {
      effects.push({kind: 'MutateConditionally', value});
    }
    if (scope.transitive === MutationKind.Definite) {
      effects.push({kind: 'MutateTransitive', value});
    } else if (scope.transitive === MutationKind.Conditional) {
      effects.push({kind: 'MutateTransitiveConditionally', value});
    }
  }
  // Create aliasing effects based on observed data flow
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

enum MutationKind {
  None = 0,
  Conditional = 1,
  Definite = 2,
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
