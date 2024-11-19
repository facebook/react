/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {HIRFunction, InstructionId, isRefOrRefValue, Place} from '../HIR/HIR';
import DisjointSet from '../Utils/DisjointSet';

export function inferMutableRangesForAlias(
  _fn: HIRFunction,
  aliases: DisjointSet<Place>,
): void {
  const aliasSets = aliases.buildSets();
  for (const aliasSet of aliasSets) {
    /*
     * Update mutableRange.end only if the identifiers have actually been
     * mutated.
     */
    const mutatingIdentifiers = [...aliasSet].filter(
      place =>
        place.identifier.mutableRange.end -
          place.identifier.mutableRange.start >
          1 && !isRefOrRefValue(place.type),
    );

    if (mutatingIdentifiers.length > 0) {
      // Find final instruction which mutates this alias set.
      let lastMutatingInstructionId = 0;
      for (const place of mutatingIdentifiers) {
        if (place.identifier.mutableRange.end > lastMutatingInstructionId) {
          lastMutatingInstructionId = place.identifier.mutableRange.end;
        }
      }

      /*
       * Update mutableRange.end for all aliases in this set ending before the
       * last mutation.
       */
      for (const alias of aliasSet) {
        if (
          alias.identifier.mutableRange.end < lastMutatingInstructionId &&
          !isRefOrRefValue(alias.type)
        ) {
          alias.identifier.mutableRange.end =
            lastMutatingInstructionId as InstructionId;
        }
      }
    }
  }
}
