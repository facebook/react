/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import DisjointSet from "../Utils/DisjointSet";
import { HIRFunction, Identifier } from "./HIR";

export function inferAliasForFields(
  func: HIRFunction,
  aliases: DisjointSet<Identifier>
) {
  for (const [_, block] of func.body.blocks) {
    for (const instr of block.instructions) {
      let { lvalue, value } = instr;

      // Not an aliasing instruction.
      if (value.kind !== "Identifier") {
        continue;
      }

      // No lvalue, no aliasing.
      if (lvalue === null) {
        continue;
      }

      // No field aliasing.
      if (lvalue.place.memberPath === null) {
        continue;
      }

      // lvalue or value get mutated later, so this aliasing is observable.
      if (
        lvalue.place.identifier.mutableRange.end > instr.id ||
        value.identifier.mutableRange.end > instr.id
      ) {
        aliases.union([lvalue.place.identifier, value.identifier]);
      }
    }
  }
}
