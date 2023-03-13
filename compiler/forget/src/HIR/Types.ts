/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import invariant from "invariant";
import { Hook } from "./Hooks";

export type Type =
  | PrimitiveType
  | HookType
  | FunctionType
  | ObjectType
  | PhiType
  | PolyType
  | TypeVar;
export type PrimitiveType = { kind: "Primitive" };
export type FunctionType = {
  kind: "Function";
};
export type HookType = {
  kind: "Hook";
  definition: Hook;
};
export type ObjectType = { kind: "Object" };
export type TypeVar = {
  kind: "Type";
  id: TypeId;
};
export type PolyType = {
  kind: "Poly";
};
export type PhiType = {
  kind: "Phi";
  operands: Array<Type>;
};

/**
 * Simulated opaque type for TypeId to prevent using normal numbers as ids
 * accidentally.
 */
const opaqueTypeId = Symbol();
export type TypeId = number & { [opaqueTypeId]: "IdentifierId" };

export function makeTypeId(id: number): TypeId {
  invariant(
    id >= 0 && Number.isInteger(id),
    "Expected instruction id to be a non-negative integer"
  );
  return id as TypeId;
}

let typeCounter = 0;
export function makeType(): TypeVar {
  return {
    kind: "Type",
    id: makeTypeId(typeCounter++),
  };
}

export function typeEquals(tA: Type, tB: Type): boolean {
  if (tA.kind !== tB.kind) return false;
  return (
    typeVarEquals(tA, tB) ||
    funcTypeEquals(tA, tB) ||
    hookTypeEquals(tA, tB) ||
    objectTypeEquals(tA, tB) ||
    primitiveTypeEquals(tA, tB) ||
    polyTypeEquals(tA, tB) ||
    phiTypeEquals(tA, tB)
  );
}

function typeVarEquals(tA: Type, tB: Type): boolean {
  if (tA.kind === "Type" && tB.kind === "Type") {
    return tA.id === tB.id;
  }
  return false;
}

function typeKindCheck(tA: Type, tb: Type, type: string): boolean {
  return tA.kind === type && tb.kind === type;
}

function primitiveTypeEquals(tA: Type, tB: Type): boolean {
  return typeKindCheck(tA, tB, "Primitive");
}

function polyTypeEquals(tA: Type, tB: Type): boolean {
  return typeKindCheck(tA, tB, "Poly");
}

function objectTypeEquals(tA: Type, tB: Type): boolean {
  return typeKindCheck(tA, tB, "Object");
}

function funcTypeEquals(tA: Type, tB: Type): boolean {
  return typeKindCheck(tA, tB, "Function");
}

function hookTypeEquals(tA: Type, tB: Type): boolean {
  return (
    tA.kind === "Hook" && tB.kind === "Hook" && tA.definition === tB.definition
  );
}

function phiTypeEquals(tA: Type, tB: Type): boolean {
  if (tA.kind === "Phi" && tB.kind === "Phi") {
    if (tA.operands.length !== tB.operands.length) {
      return false;
    }

    let operands = new Set(tA.operands);
    for (let i = 0; i < tB.operands.length; i++) {
      if (!operands.has(tB.operands[i])) {
        return false;
      }
    }
  }

  return false;
}
