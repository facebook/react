import * as t from "@babel/types";
import invariant from "invariant";
import {
  HIRFunction,
  Instruction,
  LValue,
  makeType,
  Place,
  PropType,
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
  const { lvalue, value } = instr;
  const left: Type | null = assignTypeForLvalue(lvalue, equations, unifier);

  switch (value.kind) {
    case "Primitive": {
      if (left !== null) {
        equations.push({
          left,
          right: { kind: "Primitive" },
        });
      }
      break;
    }

    case "Identifier": {
      if (left !== null) {
        let right: Type = assignTypeForPlace(value, equations);
        equations.push({
          left,
          right,
        });
      }

      break;
    }

    case "BinaryExpression": {
      if (isPrimitiveBinaryOp(value.operator)) {
        equations.push({
          left: value.left.identifier.type,
          right: { kind: "Primitive" },
        });
        equations.push({
          left: value.right.identifier.type,
          right: { kind: "Primitive" },
        });
      }

      if (left !== null) {
        equations.push({
          left,
          right: { kind: "Primitive" },
        });
      }

      break;
    }

    case "CallExpression": {
      const argTypes = value.args.map((a) => a.identifier.type);

      // TODO(gsn): Handle method calls separately
      if (value.callee.memberPath !== null) {
        break;
      }

      equations.push({
        left: value.callee.identifier.type,
        right: { kind: "Function" },
      });

      break;
    }

    case "ObjectExpression": {
      invariant(left !== null, "invald object expression");
      const properties = new Map(
        [...(value.properties?.entries() ?? [])].map(([prop, place]) => [
          prop,
          place.identifier.type,
        ])
      );

      equations.push({
        left,
        right: {
          kind: "Object",
          properties,
        },
      });
      break;
    }
  }
  return equations;
}

function assignTypeForPlace(
  value: Place,
  equations: Array<TypeEquation>
): Type {
  if (value.memberPath === null) {
    return value.identifier.type;
  }

  if (value.memberPath.length > 1) {
    // TODO(gsn): Lower nested memberPaths in HIR
    return makeType();
  }

  const propName = value.memberPath[0];
  const propType = makeType();
  equations.push({
    left: propType,
    right: {
      kind: "Prop",
      objectType: value.identifier.type,
      name: propName,
    },
  });

  return propType;
}

function assignTypeForLvalue(
  lvalue: LValue | null,
  equations: Array<TypeEquation>,
  unifier: Unifier
): Type | null {
  if (lvalue === null) return null;

  return (
    unifier.generalize(lvalue.place.identifier.type, lvalue.place.memberPath) ??
    assignTypeForPlace(lvalue.place, equations)
  );
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

    if (type.kind === "Prop") {
      this.bindToProp(v, type);
      return;
    }

    if (this.occursCheck(v, type)) {
      throw new Error("cycle detected");
    }

    this.substitutions.set(v.id, type);
  }

  bindToProp(type: TypeVar, prop: PropType) {
    let object = prop.objectType;

    if (object.kind === "Type" && this.substitutions.has(object.id)) {
      object = this.substitutions.get(object.id)!;
    }

    if (object.kind === "Object") {
      if (!object.properties.has(prop.name)) {
        object.properties.set(prop.name, type);
        return;
      }

      this.unify(object.properties.get(prop.name)!, type);
      return;
    }

    this.substitutions.set(type.id, prop);
  }

  occursCheck(v: TypeVar, type: Type): boolean {
    if (typeEquals(v, type)) return true;

    if (type.kind === "Type" && this.substitutions.has(type.id)) {
      return this.occursCheck(v, this.substitutions.get(type.id)!);
    }

    if (type.kind === "Object") {
      return [...type.properties.values()].some((p) => this.occursCheck(v, p));
    }

    if (type.kind === "Prop") {
      return this.occursCheck(v, type.objectType);
    }

    return false;
  }

  get(type: Type): Type {
    if (type.kind === "Primitive") {
      return type;
    }

    if (type.kind === "Type") {
      if (this.substitutions.has(type.id)) {
        return this.get(this.substitutions.get(type.id)!);
      } else {
        return type;
      }
    }

    return type;
  }

  generalize(objectType: Type, name: Array<string> | null): Type | null {
    if (objectType.kind === "Type" && this.substitutions.has(objectType.id)) {
      objectType = this.substitutions.get(objectType.id)!;
    }

    if (
      name !== null &&
      objectType.kind === "Object" &&
      objectType.properties.has(name[0])
    ) {
      let type = objectType.properties.get(name[0])!;
      if (type.kind === "Poly") {
        return type;
      }

      type = { kind: "Poly" };

      objectType.properties.set(name[0], type);
      return type;
    }

    return null;
  }
}
