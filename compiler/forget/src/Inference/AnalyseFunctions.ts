import invariant from "invariant";
import {
  Effect,
  FunctionExpression,
  HIRFunction,
  Identifier,
  mergeConsecutiveBlocks,
  Place,
  ReactiveScopeDependency,
} from "../HIR";
import { constantPropagation } from "../Optimization";
import { eliminateRedundantPhi, enterSSA } from "../SSA";
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
        path: [...(objectDependency.path ?? []), property],
      };
    }
    this.properties.set(lvalue.identifier, nextDependency);
  }

  declareTemporary(lvalue: Place, value: Place): void {
    const resolved: ReactiveScopeDependency = this.properties.get(
      value.identifier
    ) ?? {
      identifier: value.identifier,
      path: null,
    };
    this.properties.set(lvalue.identifier, resolved);
  }
}

export default function analyseFunctions(func: HIRFunction) {
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
            instr.lvalue.place,
            instr.value.object,
            instr.value.property
          );
          break;
        }
        case "LoadLocal": {
          if (instr.lvalue.place.identifier.name === null) {
            state.declareTemporary(instr.lvalue.place, instr.value.place);
          }
          break;
        }
      }
    }
  }
}

function lower(func: HIRFunction) {
  mergeConsecutiveBlocks(func);
  enterSSA(func);
  eliminateRedundantPhi(func);
  constantPropagation(func);
  inferTypes(func);
  analyseFunctions(func);
  inferReferenceEffects(func);
  inferMutableRanges(func);
  logHIRFunction("AnalyseFunction (inner)", func);
}

function infer(value: FunctionExpression, state: State, context: Place[]) {
  const mutations = new Set(
    value.loweredFunc.context
      .filter((dep) => isMutated(dep.identifier))
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

function isMutated(id: Identifier) {
  return id.mutableRange.end - id.mutableRange.start > 1;
}
