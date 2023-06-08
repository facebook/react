/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import invariant from "invariant";
import {
  Effect,
  FunctionExpression,
  HIRFunction,
  Identifier,
  isRefValueType,
  isUseRefType,
  Place,
  ReactiveScopeDependency,
} from "../HIR";
import { constantPropagation } from "../Optimization";
import { eliminateRedundantPhi } from "../SSA";
import { inferTypes } from "../TypeInference";
import { logHIRFunction } from "../Utils/logger";
import { inferMutableRanges } from "./InferMutableRanges";
import inferReferenceEffects from "./InferReferenceEffects";

class State {
  properties: Map<Identifier, ReactiveScopeDependency> = new Map();

  declareProperty(lvalue: Place, object: Place, property: string): void {
    const objectDependency = this.properties.get(object.identifier);
    let nextDependency: ReactiveScopeDependency;
    if (objectDependency === undefined) {
      nextDependency = { identifier: object.identifier, path: [property] };
    } else {
      nextDependency = {
        identifier: objectDependency.identifier,
        path: [...objectDependency.path, property],
      };
    }
    this.properties.set(lvalue.identifier, nextDependency);
  }

  declareTemporary(lvalue: Place, value: Place): void {
    const resolved: ReactiveScopeDependency = this.properties.get(
      value.identifier
    ) ?? {
      identifier: value.identifier,
      path: [],
    };
    this.properties.set(lvalue.identifier, resolved);
  }
}

export default function analyseFunctions(func: HIRFunction): void {
  const state = new State();

  for (const [_, block] of func.body.blocks) {
    for (const instr of block.instructions) {
      switch (instr.value.kind) {
        case "FunctionExpression": {
          lower(instr.value.loweredFunc);
          infer(instr.value, state, func.context);
          break;
        }
        case "PropertyLoad": {
          state.declareProperty(
            instr.lvalue,
            instr.value.object,
            instr.value.property
          );
          break;
        }
        case "ComputedLoad": {
          // The path is set to an empty string as the path doesn't really
          // matter for a computed load.
          state.declareProperty(instr.lvalue, instr.value.object, "");
          break;
        }
        case "LoadLocal":
        case "LoadContext": {
          if (instr.lvalue.identifier.name === null) {
            state.declareTemporary(instr.lvalue, instr.value.place);
          }
          break;
        }
      }
    }
  }
}

function lower(func: HIRFunction): void {
  eliminateRedundantPhi(func);
  constantPropagation(func);
  inferTypes(func);
  analyseFunctions(func);
  inferReferenceEffects(func, { isFunctionExpression: true });
  inferMutableRanges(func);
  logHIRFunction("AnalyseFunction (inner)", func);
}

function infer(
  value: FunctionExpression,
  state: State,
  context: Place[]
): void {
  const mutations = new Set(
    value.loweredFunc.context
      .filter((dep) => isMutatedOrReassigned(dep.identifier))
      .map((m) => m.identifier.name)
      .filter((m) => m !== null) as string[]
  );

  for (const dep of value.dependencies) {
    let name: string | null = null;

    if (state.properties.has(dep.identifier)) {
      const receiver = state.properties.get(dep.identifier)!;
      name = receiver.identifier.name;
    } else {
      name = dep.identifier.name;
    }

    if (name !== null && mutations.has(name)) {
      dep.effect = Effect.Capture;
    } else if (isUseRefType(dep.identifier) || isRefValueType(dep.identifier)) {
      // TODO: this is a hack to ensure we treat functions which reference refs
      // as having a capture and therefore being considered mutable. this ensures
      // the function gets a mutable range which accounts for anywhere that it
      // could be called, and allows us to help ensure it isn't called during
      // render
      dep.effect = Effect.Capture;
    }
  }

  // This could potentially add duplicate deps to mutatedDeps in the case of
  // mutating a context ref in the child function and in this parent function.
  // It might be useful to dedupe this.
  //
  // In practice this never really matters because the Component function has no
  // context refs, so it will never have duplicate deps.
  for (const place of context) {
    invariant(
      place.identifier.name !== null,
      "context refs should always have a name"
    );

    if (mutations.has(place.identifier.name)) {
      place.effect = Effect.Capture;
      value.dependencies.push(place);
    }
  }
}

function isMutatedOrReassigned(id: Identifier): boolean {
  // This check checks for mutation and reassingnment, so the usual check for
  // mutation (ie, `mutableRange.end - mutableRange.start > 1`) isn't quite
  // enough.
  //
  // We need to track re-assignments in context refs as we need to reflect the
  // re-assignment back to the captured refs.
  return id.mutableRange.end > id.mutableRange.start;
}
