/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {HIRFunction, Identifier, makeInstructionId} from '../HIR/HIR';
import DisjointSet from '../Utils/DisjointSet';
import {inferMutableRangesForAlias} from './InferMutableRangesForAlias';

export function inferMutationAliasingRanges(fn: HIRFunction): void {
  /**
   * Part 1
   * Infer ranges for transitive mutations, which includes mutations that affect
   * captured references and not just direct aliases. We build a distjoing set
   * that tracks capturing and direct aliasing, and look at transitive mutations
   * only.
   */
  const captures = new DisjointSet<Identifier>();
  for (const block of fn.body.blocks.values()) {
    for (const phi of block.phis) {
      captures.union([
        phi.place.identifier,
        ...[...phi.operands.values()].map(place => place.identifier),
      ]);
    }

    for (const instr of block.instructions) {
      if (instr.effects == null) continue;
      for (const effect of instr.effects) {
        if (
          effect.kind === 'Alias' ||
          effect.kind === 'CreateFrom' ||
          effect.kind === 'Capture'
        ) {
          captures.union([effect.from.identifier, effect.into.identifier]);
        } else if (effect.kind === 'MutateTransitive') {
          const value = effect.value;
          value.identifier.mutableRange.end = makeInstructionId(instr.id + 1);
        }
      }
    }
  }
  inferMutableRangesForAlias(fn, captures);

  /**
   * Part 2
   * Infer ranges for local (non-transitive) mutations. We build a disjoint set
   * that only tracks direct value aliasing, and look only at local mutations
   * to extend ranges
   */
  const aliases = new DisjointSet<Identifier>();
  for (const block of fn.body.blocks.values()) {
    for (const phi of block.phis) {
      aliases.union([
        phi.place.identifier,
        ...[...phi.operands.values()].map(place => place.identifier),
      ]);
    }

    for (const instr of block.instructions) {
      if (instr.effects == null) continue;
      for (const effect of instr.effects) {
        if (effect.kind === 'Alias' || effect.kind === 'CreateFrom') {
          aliases.union([effect.from.identifier, effect.into.identifier]);
        } else if (effect.kind === 'Mutate') {
          const value = effect.value;
          value.identifier.mutableRange.end = makeInstructionId(instr.id + 1);
        }
      }
    }
  }
  inferMutableRangesForAlias(fn, aliases);
}
