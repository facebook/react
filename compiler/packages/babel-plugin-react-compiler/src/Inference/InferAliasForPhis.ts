/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {HIRFunction, Place} from '../HIR/HIR';
import DisjointSet from '../Utils/DisjointSet';

export function inferAliasForPhis(
  func: HIRFunction,
  aliases: DisjointSet<Place>,
): void {
  for (const [_, block] of func.body.blocks) {
    for (const phi of block.phis) {
      const isPhiMutatedAfterCreation: boolean =
        phi.place.identifier.mutableRange.end >
        (block.instructions.at(0)?.id ?? block.terminal.id);
      if (isPhiMutatedAfterCreation) {
        for (const [, operand] of phi.operands) {
          aliases.union([phi.place, operand]);
        }
      }
    }
  }
}
