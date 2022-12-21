import * as t from "@babel/types";
import invariant from "invariant";
import {
  HIRFunction,
  Instruction,
  Place,
  Type,
  typeEquals,
  TypeId,
  TypeVar,
} from "./HIR";
import { eachInstructionOperand } from "./visitors";

function isPrimitiveBinaryOp(op: t.BinaryExpression["operator"]) {
  switch (op) {
    case "+":
    case "-":
    case "/":
    case "%":
    case "*":
    case "**":
    case "&":
    case "|":
    case ">>":
    case ">>":
    case "<<":
    case "^":
    case "==":
    case "==":
    case "!=":
    case "!=":
    case ">":
    case "<":
    case ">=":
    case "<=":
    case "|>":
      return true;
    default:
      return false;
  }
}

export function inferTypes(func: HIRFunction) {
  const unifier = new Unifier();
  for (const e of generate(func, unifier)) {
    unifier.unify(e.left, e.right);
  }
  apply(func, unifier);
}

function apply(func: HIRFunction, unifier: Unifier) {
  for (const [_, block] of func.body.blocks) {
    for (const instr of block.instructions) {
      for (const place of eachInstructionOperand(instr)) {
        place.identifier.type = unifier.get(place.identifier.type);
      }
      const { lvalue } = instr;
      if (lvalue !== null) {
        lvalue.place.identifier.type = unifier.get(
          lvalue.place.identifier.type
        );
      }
    }
  }
}

type TypeEquation = {
  left: Type;
  right: Type;
};

function* generate(func: HIRFunction, unifier: Unifier) {
  for (const [_, block] of func.body.blocks) {
    for (const instr of block.instructions) {
      yield* generateTypeEquation(instr, unifier);
    }
  }
}

function generateTypeEquation(
  instr: Instruction,
  unifier: Unifier
): Array<TypeEquation> {
  const equations: Array<TypeEquation> = [];

  function add(left: Type | null, right: Type | null) {
    if (left === null || right === null) return;
    equations.push({
      left,
      right,
    });
  }

  const { lvalue, value } = instr;
  const left = assignType(lvalue?.place);

  switch (value.kind) {
    case "Primitive": {
      add(left, { kind: "Primitive" });
      break;
    }

    case "Identifier": {
      add(left, assignType(value));
      break;
    }

    case "BinaryExpression": {
      if (isPrimitiveBinaryOp(value.operator)) {
        add(assignType(value.left), { kind: "Primitive" });
        add(assignType(value.right), { kind: "Primitive" });
      }
      add(left, { kind: "Primitive" });
      break;
    }

    case "CallExpression": {
      add(assignType(value.callee), { kind: "Function" });
      break;
    }

    case "ObjectExpression": {
      invariant(left !== null, "invald object expression");
      add(left, { kind: "Object" });
      break;
    }
  }
  return equations;
}

function assignType(place: Place | undefined): Type | null {
  // We type only top level identifiers. Typing objects is not very useful
  // when we have to be so conservative.
  if (place?.memberPath !== null) {
    return null;
  }

  return place.identifier.type;
}

type Substitution = Map<TypeId, Type>;
class Unifier {
  substitutions: Substitution = new Map();

  unify(tA: Type, tB: Type) {
    if (typeEquals(tA, tB)) {
      return;
    }

    if (tA.kind === "Type") {
      this.bindVariableTo(tA, tB);
      return;
    }

    if (tB.kind === "Type") {
      this.bindVariableTo(tB, tA);
      return;
    }
  }

  bindVariableTo(v: TypeVar, type: Type): void {
    if (this.substitutions.has(v.id)) {
      this.unify(this.substitutions.get(v.id)!, type);
      return;
    }

    if (type.kind === "Type" && this.substitutions.has(type.id)) {
      this.unify(v, this.substitutions.get(type.id)!);
      return;
    }

    if (this.occursCheck(v, type)) {
      throw new Error("cycle detected");
    }

    this.substitutions.set(v.id, type);
  }

  occursCheck(v: TypeVar, type: Type): boolean {
    if (typeEquals(v, type)) return true;

    if (type.kind === "Type" && this.substitutions.has(type.id)) {
      return this.occursCheck(v, this.substitutions.get(type.id)!);
    }

    return false;
  }

  get(type: Type): Type {
    if (type.kind === "Type") {
      if (this.substitutions.has(type.id)) {
        return this.get(this.substitutions.get(type.id)!);
      } else {
        return type;
      }
    }

    return type;
  }
}
