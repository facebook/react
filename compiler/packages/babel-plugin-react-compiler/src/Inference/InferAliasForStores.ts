/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {Effect, HIRFunction, InstructionId, Place} from '../HIR/HIR';
import {
  eachInstructionLValue,
  eachInstructionValueOperand,
} from '../HIR/visitors';
import DisjointSet from '../Utils/DisjointSet';

export function inferAliasForStores(
  func: HIRFunction,
  aliases: DisjointSet<Place>,
): void {
  for (const [_, block] of func.body.blocks) {
    for (const instr of block.instructions) {
      const {value, lvalue} = instr;
      const isStore =
        lvalue.effect === Effect.Store ||
        /*
         * Some typed functions annotate callees or arguments
         * as Effect.Store.
         */
        ![...eachInstructionValueOperand(value)].every(
          operand => operand.effect !== Effect.Store,
        );

      if (!isStore) {
        continue;
      }
      for (const operand of eachInstructionLValue(instr)) {
        maybeAlias(aliases, lvalue, operand, instr.id);
      }
      for (const operand of eachInstructionValueOperand(value)) {
        if (
          operand.effect === Effect.Capture ||
          operand.effect === Effect.Store
        ) {
          maybeAlias(aliases, lvalue, operand, instr.id);
        }
      }
    }
  }
}

function maybeAlias(
  aliases: DisjointSet<Place>,
  lvalue: Place,
  rvalue: Place,
  id: InstructionId,
): void {
  if (
    lvalue.identifier.mutableRange.end > id + 1 ||
    rvalue.identifier.mutableRange.end > id
  ) {
    aliases.union([lvalue, rvalue]);
  }
}
