import invariant from "invariant";
import {
  HIRFunction,
  FunctionExpression,
  Identifier,
  mergeConsecutiveBlocks,
  Place,
} from "../HIR";
import { constantPropagation } from "../Optimization";
import { eliminateRedundantPhi, enterSSA } from "../SSA";
import { inferTypes } from "../TypeInference";
import { logHIRFunction } from "../Utils/logger";
import { inferMutableRanges } from "./InferMutableRanges";
import inferReferenceEffects from "./InferReferenceEffects";

type Dependency = {
  place: Place;
  path: Array<string> | null;
};

function declareProperty(
  properties: Map<Identifier, Dependency>,
  lvalue: Place,
  object: Place,
  property: string
): void {
  const objectDependency = properties.get(object.identifier);
  let nextDependency: Dependency;
  if (objectDependency === undefined) {
    nextDependency = { place: object, path: [property] };
  } else {
    nextDependency = {
      place: objectDependency.place,
      path: [...(objectDependency.path ?? []), property],
    };
  }
  properties.set(lvalue.identifier, nextDependency);
}

export default function analyseFunctions(func: HIRFunction) {
  const properties: Map<Identifier, Dependency> = new Map();

  for (const [_, block] of func.body.blocks) {
    for (const instr of block.instructions) {
      switch (instr.value.kind) {
        case "FunctionExpression": {
          lower(instr.value.loweredFunc);
          infer(instr.value, properties, func.context);
          break;
        }
        case "PropertyLoad": {
          declareProperty(
            properties,
            instr.lvalue.place,
            instr.value.object,
            instr.value.property
          );
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

function infer(
  value: FunctionExpression,
  properties: Map<Identifier, Dependency>,
  context: Place[]
) {
  const mutations = new Set(
    value.loweredFunc.context
      .filter((dep) => isMutated(dep.identifier))
      .map((m) => m.identifier.name)
      .filter((m) => m !== null) as string[]
  );

  const mutatedDeps: Place[] = [];
  for (const dep of value.dependencies) {
    let name: string | null = null;

    if (properties.has(dep.identifier)) {
      const receiver = properties.get(dep.identifier)!;
      name = receiver.place.identifier.name;
    } else {
      name = dep.identifier.name;
    }

    if (name !== null && mutations.has(name)) {
      mutatedDeps.push(dep);
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
      mutatedDeps.push(place);
    }
  }

  value.mutatedDeps = mutatedDeps;
}

function isMutated(id: Identifier) {
  return id.mutableRange.end - id.mutableRange.start > 1;
}
