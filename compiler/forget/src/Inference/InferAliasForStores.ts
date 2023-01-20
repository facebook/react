/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import DisjointSet from "../Utils/DisjointSet";
import {
  Effect,
  HIRFunction,
  Identifier,
  InstructionId,
  Place,
} from "../HIR/HIR";

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
        case "Identifier": {
          maybeAlias(aliases, lvalue.place, value, instr.id);
          break;
        }
        case "ArrayExpression": {
          for (const item of value.elements) {
            maybeAlias(aliases, lvalue.place, item, instr.id);
          }
          break;
        }
        case "ObjectExpression": {
          if (value.properties !== null) {
            for (const [, property] of value.properties) {
              maybeAlias(aliases, lvalue.place, property, instr.id);
            }
          }
          break;
        }
        case "PropertyStore": {
          maybeAlias(aliases, value.object, value.value, instr.id);
          break;
        }
        case "FunctionExpression": {
          for (const dep of value.mutatedDeps) {
            maybeAlias(aliases, lvalue.place, dep, instr.id);
          }
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
    lvalue.identifier.mutableRange.end > id ||
    rvalue.identifier.mutableRange.end > id
  ) {
    aliases.union([lvalue.identifier, rvalue.identifier]);
  }
}
