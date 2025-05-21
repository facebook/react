/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  HIRFunction,
  Identifier,
  InstructionId,
  isRefOrRefValue,
} from '../HIR/HIR';
import DisjointSet from '../Utils/DisjointSet';

export function inferMutableRangesForAlias(
  _fn: HIRFunction,
  aliases: DisjointSet<Identifier>,
): void {
  const aliasSets = aliases.buildSets();
  for (const aliasSet of aliasSets) {
    /*
     * Update mutableRange.end only if the identifiers have actually been
     * mutated.
     */
    const mutatingIdentifiers = [...aliasSet].filter(
      id =>
        id.mutableRange.end - id.mutableRange.start > 1 && !isRefOrRefValue(id),
    );

    if (mutatingIdentifiers.length > 0) {
      // Find final instruction which mutates this alias set.
      let lastMutatingInstructionId = 0;
      for (const id of mutatingIdentifiers) {
        if (id.mutableRange.end > lastMutatingInstructionId) {
          lastMutatingInstructionId = id.mutableRange.end;
        }
      }

      /*
       * Update mutableRange.end for all aliases in this set ending before the
       * last mutation.
       */
      for (const alias of aliasSet) {
        if (
          alias.mutableRange.end < lastMutatingInstructionId &&
          !isRefOrRefValue(alias)
        ) {
          alias.mutableRange.end = lastMutatingInstructionId as InstructionId;
        }
      }
    }
  }
}
