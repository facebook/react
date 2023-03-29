/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import invariant from "invariant";
import {
  Effect,
  HIRFunction,
  InstructionId,
  makeInstructionId,
  Place,
} from "../HIR/HIR";
import { printPlace } from "../HIR/PrintHIR";
import {
  eachInstructionLValue,
  eachInstructionOperand,
  eachTerminalOperand,
} from "../HIR/visitors";
import { assertExhaustive } from "../Utils/utils";

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

function infer(place: Place, instrId: InstructionId): void {
  place.identifier.mutableRange.end = makeInstructionId(instrId + 1);
}

function inferPlace(
  place: Place,
  instrId: InstructionId,
  inferMutableRangeForStores: boolean
): void {
  switch (place.effect) {
    case Effect.Unknown: {
      throw new Error(`Found an unknown place ${printPlace(place)}}!`);
    }
    case Effect.Capture:
    case Effect.Read:
    case Effect.Freeze:
      return;
    case Effect.Store:
      if (inferMutableRangeForStores) {
        infer(place, instrId);
      }
      return;
    case Effect.Mutate: {
      infer(place, instrId);
      return;
    }
    default:
      assertExhaustive(place.effect, `Unexpected ${printPlace(place)} effect`);
  }
}

export function inferMutableLifetimes(
  func: HIRFunction,
  inferMutableRangeForStores: boolean
): void {
  for (const [_, block] of func.body.blocks) {
    for (const phi of block.phis) {
      let start = Number.MAX_SAFE_INTEGER;
      let end = phi.id.mutableRange.end as number;
      for (const [_, operand] of phi.operands) {
        start = Math.min(start, operand.mutableRange.start);
        end = Math.max(end, operand.mutableRange.end);
      }
      invariant(
        start !== Number.MAX_SAFE_INTEGER,
        "Expected phi to have a start range value"
      );
      phi.id.mutableRange = {
        start: makeInstructionId(start),
        end: makeInstructionId(end),
      };
    }

    for (const instr of block.instructions) {
      for (const operand of eachInstructionLValue(instr)) {
        const lvalueId = operand.identifier;

        // lvalue start being mutable when they're initially assigned a
        // value.
        lvalueId.mutableRange.start = instr.id;

        // Let's be optimistic and assume this lvalue is not mutable by
        // default.
        lvalueId.mutableRange.end = makeInstructionId(instr.id + 1);
      }
      for (const operand of eachInstructionOperand(instr)) {
        inferPlace(operand, instr.id, inferMutableRangeForStores);
      }
    }
    for (const operand of eachTerminalOperand(block.terminal)) {
      inferPlace(operand, block.terminal.id, inferMutableRangeForStores);
    }
  }
}
