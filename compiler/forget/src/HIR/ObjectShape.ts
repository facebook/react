/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import invariant from "invariant";
import { Effect } from "./HIR";
import {
  BuiltInType,
  FunctionType,
  ObjectType,
  PolyType,
  PrimitiveType,
} from "./Types";

/**
 * This file exports types and defaults for JavaScript object shapes. These are
 * stored and used by a Forget `Environment`. See comments in `Types.ts`,
 * `Globals.ts`, and `Environment.ts` for more details.
 */

const PRIMITIVE_TYPE: PrimitiveType = {
  kind: "Primitive",
};

let nextAnonId = 0;
// We currently use strings for anonymous ShapeIds since they are easily
// debuggable, even though `Symbol()` might be more performant
function createAnonId(): string {
  return `<generated_${nextAnonId++}>`;
}

/**
 * Add a function to an existing ShapeRegistry.
 *
 * @returns a {@link FunctionType} representing the added function.
 */
export function addFunction(
  registry: ShapeRegistry,
  properties: Iterable<[string, BuiltInType | null]>,
  fn: FunctionSignature
): FunctionType {
  const shapeId = createAnonId();
  addShape(registry, shapeId, properties, fn);
  return {
    kind: "Function",
    return: fn.returnType,
    shapeId,
  };
}

/**
 * Add an object to an existing ShapeRegistry.
 *
 * @returns an {@link ObjectType} representing the added object.
 */
export function addObject(
  registry: ShapeRegistry,
  id: string | null,
  properties: Iterable<[string, BuiltInType | null]>
): ObjectType {
  const shapeId = id ?? createAnonId();
  addShape(registry, shapeId, properties, null);
  return {
    kind: "Object",
    shapeId,
  };
}

function addShape(
  registry: ShapeRegistry,
  id: string,
  properties: Iterable<[string, BuiltInType | null]>,
  functionType: FunctionSignature | null
): ObjectShape {
  const shape: ObjectShape = {
    properties: new Map(properties),
    functionType,
  };

  invariant(
    !registry.has(id),
    `[ObjectShape] Could not add shape to registry: name ${id} already exists.`
  );
  registry.set(id, shape);
  return shape;
}

/**
 * Call signature of a function, used for type and effect inference.
 *
 * Note: Param type is not recorded since it currently does not affect inference.
 * Specifically, we currently do not:
 *  - infer types based on their usage in argument position
 *  - handle inference for overloaded / generic functions
 */
export type FunctionSignature = {
  positionalParams: Array<Effect>;
  restParam: Effect | null;
  returnType: BuiltInType | PolyType;
  calleeEffect: Effect;
};

/**
 * Shape of an {@link FunctionType} if {@link ObjectShape.functionType} is present,
 * or {@link ObjectType} otherwise.
 *
 * Constructors (e.g. the global `Array` object) and other functions (e.g. `Math.min`)
 * are both represented by {@link ObjectShape.functionType}.
 */
export type ObjectShape = {
  properties: Map<string, BuiltInType | null>;
  functionType: FunctionSignature | null;
};

/**
 * Every valid ShapeRegistry must contain ObjectShape definitions for
 * {@link BuiltInArrayId} and {@link BuiltInObjectId}, since these are the
 * the inferred types for [] and {}.
 */
export type ShapeRegistry = Map<string, ObjectShape>;
export const BuiltInArrayId = "BuiltInArray";
export const BuiltInObjectId = "BuiltInObject";

/**
 * ShapeRegistry with default definitions for built-ins.
 */
export const BUILTIN_SHAPES: ShapeRegistry = new Map();

/* Built-in array shape */
addObject(BUILTIN_SHAPES, BuiltInArrayId, [
  [
    "at",
    addFunction(BUILTIN_SHAPES, [], {
      positionalParams: [Effect.Read],
      restParam: null,
      returnType: { kind: "Poly" },
      calleeEffect: Effect.Read,
    }),
  ],
  [
    "concat",
    addFunction(BUILTIN_SHAPES, [], {
      positionalParams: [],
      restParam: Effect.Capture,
      returnType: {
        kind: "Object",
        shapeId: BuiltInArrayId,
      },
      calleeEffect: Effect.Read,
    }),
  ],
  ["length", PRIMITIVE_TYPE],
  [
    "push",
    addFunction(BUILTIN_SHAPES, [], {
      positionalParams: [],
      restParam: Effect.Capture,
      returnType: PRIMITIVE_TYPE,
      calleeEffect: Effect.Mutate,
    }),
  ],
  // TODO: rest of Array properties
]);

/* Built-in Object shape */
addObject(BUILTIN_SHAPES, BuiltInObjectId, [
  [
    "toString",
    addFunction(BUILTIN_SHAPES, [], {
      positionalParams: [],
      restParam: null,
      returnType: PRIMITIVE_TYPE,
      calleeEffect: Effect.Read,
    }),
  ],
  // TODO:
  // hasOwnProperty, isPrototypeOf, propertyIsEnumerable, toLocaleString, valueOf
]);
