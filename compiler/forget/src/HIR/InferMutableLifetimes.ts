/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import invariant from "invariant";
import { assertExhaustive } from "../Common/utils";
import DisjointSet from "./DisjointSet";
import {
  Effect,
  HIRFunction,
  Identifier,
  Instruction,
  InstructionId,
  makeInstructionId,
  Place,
} from "./HIR";
import { printInstruction, printPlace } from "./PrintHIR";
import { eachInstructionOperand } from "./visitors";

/**
 * For each usage of a value in the given function, determines if the usage
 * may be succeeded by a mutable usage of that same value and if so updates
 * the usage to be mutable.
 *
 * Stated differently, this inference ensures that inferred capabilities of
 * each reference are as follows:
 * - freeze: the value is frozen at this point
 * - readonly: the value is not modified at this point *or any subsequent
 *   point*
 * - mutable: the value is modified at this point *or some subsequent point*.
 *
 * Note that this refines the capabilities inferered by InferReferenceCapability,
 * which looks at individual references and not the lifetime of a value's mutability.
 *
 * == Algorithm
 *
 * TODO:
 * 1. Forward data-flow analysis to determine aliasing. Unlike InferReferenceCapability
 *    which only tracks aliasing of top-level variables (`y = x`), this analysis needs
 *    to know if a value is aliased anywhere (`y.x = x`). The forward data flow tracks
 *    all possible locations which may have aliased a value. The concrete result is
 *    a mapping of each Place to the set of possibly-mutable values it may alias.
 *
 * ```
 * const x = []; // {x: v0; v0: mutable []}
 * const y = {}; // {x: v0, y: v1; v0: mutable [], v1: mutable []}
 * y.x = x;      // {x: v0, y: v1; v0: mutable [v1], v1: mutable [v0]}
 * read(x);      // {x: v0, y: v1; v0: mutable [v1], v1: mutable [v0]}
 * mutate(y);    // can infer that y mutates v0 and v1
 * ```
 *
 * DONE:
 * 2. Forward data-flow analysis to compute mutability liveness. Walk forwards over
 *    the CFG and track which values are mutated in a successor.
 *
 * ```
 * mutate(y);    // mutable y => v0, v1 mutated
 * read(x);      // x maps to v0, v1, those are in the mutated-later set, so x is mutable here
 * ...
 * ```
 */

function inferPlace(place: Place, instr: Instruction) {
  switch (place.effect) {
    case Effect.Unknown: {
      throw new Error(
        `Found an unkown place ${printPlace(place)} at ${printInstruction(
          instr
        )}!`
      );
    }
    case Effect.Read:
    case Effect.Freeze:
      return;
    case Effect.Mutate: {
      place.identifier.mutableRange.end = makeInstructionId(instr.id + 1);
      return;
    }
    default:
      assertExhaustive(place.effect, `Unexpected ${printPlace(place)} effect`);
  }
}

export function inferMutableRanges(func: HIRFunction) {
  const aliases = new DisjointSet<Identifier>();

  for (const [_, block] of func.body.blocks) {
    for (const phi of block.phis) {
      let start = Number.MAX_SAFE_INTEGER;
      let end = Number.MIN_SAFE_INTEGER;
      for (const [_, operand] of phi.operands) {
        start = Math.min(start, operand.mutableRange.start);
        end = Math.max(end, operand.mutableRange.end);
      }
      invariant(
        start !== Number.MAX_SAFE_INTEGER && end !== Number.MIN_SAFE_INTEGER,
        "Expected phi to have set start/end range values"
      );
      phi.id.mutableRange = {
        start: makeInstructionId(start),
        end: makeInstructionId(end),
      };
    }

    for (const instr of block.instructions) {
      for (const input of eachInstructionOperand(instr)) {
        inferPlace(input, instr);
      }

      if (instr.lvalue !== null) {
        if (instr.value.kind === "Identifier") {
          // TODO(gsn): Handle complex aliasing.
          if (
            instr.value.memberPath === null &&
            instr.lvalue.place.memberPath === null
          ) {
            // direct aliasing: `a = b`;
            aliases.union([
              instr.lvalue.place.identifier,
              instr.value.identifier,
            ]);
          }
        }

        if (instr.lvalue.place.memberPath === null) {
          const lvalueId = instr.lvalue.place.identifier;

          // lvalue start being mutable when they're initially assigned a
          // value.
          lvalueId.mutableRange.start = instr.id;

          // Let's be optimistic and assume this lvalue is not mutable by
          // default.
          lvalueId.mutableRange.end = makeInstructionId(instr.id + 1);
        } else {
          inferPlace(instr.lvalue.place, instr);
        }
      }
    }
  }

  const aliasIds: Map<Identifier, number> = new Map();
  // Store the mutable range and set of identifiers for each scope
  const aliasIndentifiers: Map<
    number,
    { end: InstructionId; identifiers: Set<Identifier> }
  > = new Map();

  aliases.forEach((identifier, groupIdentifier) => {
    let aliasId = aliasIds.get(groupIdentifier);
    if (aliasId == null) {
      aliasId = aliasIds.size;
      aliasIds.set(groupIdentifier, aliasId);
    }

    let alias = aliasIndentifiers.get(aliasId);
    if (alias === undefined) {
      alias = {
        end: identifier.mutableRange.end,
        identifiers: new Set(),
      };
      aliasIndentifiers.set(aliasId, alias);
    } else {
      alias.end = makeInstructionId(
        Math.max(alias.end, identifier.mutableRange.end)
      );
    }
    alias.identifiers.add(identifier);
  });

  for (const [_, alias] of aliasIndentifiers) {
    // Update mutableRange.end only if the identifiers have actually been
    // mutated.
    const haveIdentifiersBeenMutated = [...alias.identifiers].some(
      (id) => id.mutableRange.end > id.mutableRange.start
    );

    if (haveIdentifiersBeenMutated) {
      for (const identifier of alias.identifiers) {
        identifier.mutableRange.end = alias.end;
      }
    }
  }
}
