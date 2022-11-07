/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { assertExhaustive } from "../Common/utils";
import { Effect, HIRFunction, Instruction, Place } from "./HIR";
import { printInstruction, printPlace } from "./PrintHIR";

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
      place.identifier.mutableRange.end = instr.id;
      return;
    }
    default:
      assertExhaustive(place.effect, `Unexpected ${printPlace(place)} effect`);
  }
}

export function inferMutableRanges(func: HIRFunction) {
  for (const [_, block] of func.body.blocks) {
    for (const phi of block.phis) {
      phi.id.mutableRange = {
        start: -1, // TODO(gsn): This is a hack, we should assign proper ids to phis.
        end: -1,
      };
    }

    for (const instr of block.instructions) {
      for (const input of collectInputs(instr)) {
        inferPlace(input, instr);
      }

      if (instr.lvalue !== null) {
        if (instr.lvalue.place.memberPath === null) {
          const lvalueId = instr.lvalue.place.identifier;

          // lvalue start being mutable when they're initially assigned a
          // value.
          lvalueId.mutableRange.start = instr.id;

          // Let's be optimistic and assume this lvalue is not mutable by
          // default.
          lvalueId.mutableRange.end = instr.id;
        } else {
          inferPlace(instr.lvalue.place, instr);
        }
      }
    }
  }
}

export function* collectInputs(instr: Instruction) {
  const instrValue = instr.value;
  switch (instrValue.kind) {
    case "NewExpression":
    case "CallExpression": {
      yield instrValue.callee;
      for (const arg of instrValue.args) {
        yield arg;
      }
      break;
    }
    case "BinaryExpression": {
      yield instrValue.left;
      yield instrValue.right;
      break;
    }
    case "Identifier": {
      yield instrValue;
      break;
    }
    case "UnaryExpression": {
      yield instrValue.value;
      break;
    }
    case "JsxExpression": {
      yield instrValue.tag;
      for (const place of instrValue.props.values()) {
        yield place;
      }
      if (instrValue.children) {
        for (const c of instrValue.children) {
          yield c;
        }
      }
      break;
    }
    case "JsxFragment": {
      for (const c of instrValue.children) {
        yield c;
      }
      break;
    }
    case "ObjectExpression": {
      if (instrValue.properties !== null) {
        const props = instrValue.properties;
        for (const place of props.values()) {
          yield place;
        }
      }
      break;
    }
    case "ArrayExpression": {
      for (const e of instrValue.elements) {
        yield e;
      }
      break;
    }
    case "OtherStatement":
    case "Primitive":
    case "JSXText": {
      break;
    }
    default: {
      assertExhaustive(
        instrValue,
        `Unexpected instruction kind '${(instrValue as any).kind}'`
      );
    }
  }
}
