/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import {
  Effect,
  HIRFunction,
  Identifier,
  InstructionId,
  Place,
} from "../HIR/HIR";
import { eachInstructionValueOperand } from "../HIR/visitors";
import DisjointSet from "../Utils/DisjointSet";

export function inferAliasForStores(
  func: HIRFunction,
  aliases: DisjointSet<Identifier>
) {
  for (const [_, block] of func.body.blocks) {
    for (const instr of block.instructions) {
      const { value, lvalue } = instr;
      if (lvalue.place.effect !== Effect.Store) {
        continue;
      }
      switch (value.kind) {
        case "ArrayExpression":
        case "ObjectExpression":
        case "ComputedStore":
        case "PropertyStore":
        case "FunctionExpression": {
          for (const operand of eachInstructionValueOperand(value)) {
            if (
              operand.effect === Effect.Capture ||
              operand.effect === Effect.Store
            ) {
              maybeAlias(aliases, lvalue.place, operand, instr.id);
            }
          }
          break;
        }
      }
    }
  }
}

function maybeAlias(
  aliases: DisjointSet<Identifier>,
  lvalue: Place,
  rvalue: Place,
  id: InstructionId
): void {
  if (
    lvalue.identifier.mutableRange.end > id + 1 ||
    rvalue.identifier.mutableRange.end > id
  ) {
    aliases.union([lvalue.identifier, rvalue.identifier]);
  }
}
