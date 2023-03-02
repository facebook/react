import * as t from "@babel/types";
import invariant from "invariant";
import { Environment } from "../HIR";
import {
  HIRFunction,
  Instruction,
  Type,
  typeEquals,
  TypeId,
  TypeVar,
} from "../HIR/HIR";
import { eachInstructionOperand } from "../HIR/visitors";

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

export default function (func: HIRFunction) {
  const unifier = new Unifier();
  for (const e of generate(func)) {
    unifier.unify(e.left, e.right);
  }
  apply(func, unifier);
}

function apply(func: HIRFunction, unifier: Unifier) {
  for (const [_, block] of func.body.blocks) {
    for (const phi of block.phis) {
      phi.type = unifier.get(phi.type);
    }
    for (const instr of block.instructions) {
      for (const place of eachInstructionOperand(instr)) {
        place.identifier.type = unifier.get(place.identifier.type);
      }
      const { lvalue } = instr;
      lvalue.identifier.type = unifier.get(lvalue.identifier.type);
    }
  }
}

type TypeEquation = {
  left: Type;
  right: Type;
};

function equation(left: Type, right: Type): TypeEquation {
  return {
    left,
    right,
  };
}

function* generate(
  func: HIRFunction
): Generator<TypeEquation, void, undefined> {
  for (const [_, block] of func.body.blocks) {
    for (const phi of block.phis) {
      yield equation(phi.type, {
        kind: "Phi",
        operands: [...phi.operands.values()].map((id) => id.type),
      });
    }

    for (const instr of block.instructions) {
      yield* generateInstructionTypes(func.env, instr);
    }
  }
}

function* generateInstructionTypes(
  env: Environment,
  instr: Instruction
): Generator<TypeEquation, void, undefined> {
  const { lvalue, value } = instr;
  const left = lvalue.identifier.type;

  switch (value.kind) {
    case "JSXText":
    case "Primitive": {
      yield equation(left, { kind: "Primitive" });
      break;
    }

    case "UnaryExpression": {
      yield equation(left, { kind: "Primitive" });
      break;
    }

    case "LoadLocal": {
      yield equation(left, value.place.identifier.type);
      break;
    }

    case "StoreLocal": {
      yield equation(left, value.value.identifier.type);
      yield equation(
        value.lvalue.place.identifier.type,
        value.value.identifier.type
      );
      break;
    }

    case "BinaryExpression": {
      if (isPrimitiveBinaryOp(value.operator)) {
        yield equation(value.left.identifier.type, { kind: "Primitive" });
        yield equation(value.right.identifier.type, { kind: "Primitive" });
      }
      yield equation(left, { kind: "Primitive" });
      break;
    }

    case "LoadGlobal": {
      const hook = env.getHookDeclaration(value.name);
      if (hook !== null) {
        const type: Type = { kind: "Hook", definition: hook };
        yield equation(left, type);
      }
      break;
    }

    case "CallExpression": {
      const hook =
        value.callee.identifier.name !== null
          ? env.getHookDeclaration(value.callee.identifier.name)
          : null;
      let type: Type;
      if (hook !== null) {
        type = { kind: "Hook", definition: hook };
      } else {
        type = { kind: "Function" };
      }
      yield equation(value.callee.identifier.type, type);
      break;
    }

    case "ObjectExpression": {
      invariant(left !== null, "invald object expression");
      yield equation(left, { kind: "Object" });
      break;
    }
  }
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

    if (type.kind === "Phi") {
      const operands = new Set(type.operands.map((i) => this.get(i).kind));

      invariant(operands.size > 0, "there should be at least one operand");
      const kind = operands.values().next().value;

      // there's only one unique type and it's not a type var
      if (operands.size === 1 && kind !== "Type") {
        this.unify(v, type.operands[0]);
        return;
      }
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

    if (type.kind === "Phi") {
      return type.operands.some((o) => this.occursCheck(v, o));
    }

    return false;
  }

  get(type: Type): Type {
    if (type.kind === "Type") {
      if (this.substitutions.has(type.id)) {
        return this.get(this.substitutions.get(type.id)!);
      }
    }

    if (type.kind === "Phi") {
      return { kind: "Phi", operands: type.operands.map((o) => this.get(o)) };
    }

    return type;
  }
}
