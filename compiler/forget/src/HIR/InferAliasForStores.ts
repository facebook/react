/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import invariant from "invariant";
import DisjointSet from "../Utils/DisjointSet";
import { Effect, HIRFunction, Identifier } from "./HIR";

export function inferAliasForStores(
  func: HIRFunction,
  aliases: DisjointSet<Identifier>
) {
  for (const [_, block] of func.body.blocks) {
    for (const instr of block.instructions) {
      const { value, lvalue } = instr;
      if (lvalue === null || lvalue.place.effect !== Effect.Store) {
        continue;
      }

      invariant(
        value.kind === "Identifier",
        "only identifiers can be aliased by stores"
      );

      if (
        lvalue.place.identifier.mutableRange.end > instr.id ||
        value.identifier.mutableRange.end > instr.id
      ) {
        aliases.union([lvalue.place.identifier, value.identifier]);
      }
    }
  }
}
