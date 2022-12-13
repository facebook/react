import invariant from "invariant";
import DisjointSet from "./DisjointSet";
import {
  HIRFunction,
  Identifier,
  Instruction,
  LValue,
  Place,
  Type,
} from "./HIR";
import { printInstructionValue } from "./PrintHIR";

type AbstractValue = AbstractObject | AbstractPrimitive;
type AbstractObject = {
  kind: "Object";
  values: Map<string, AbstractValue>;
};
type AbstractPrimitive = {
  kind: "Primitive";
  value: number | boolean | string | null | undefined;
};

function typeOf(value: AbstractValue) {
  switch (value.kind) {
    case "Primitive":
      return Type.Primitive;
    case "Object":
      return Type.Object;
    default:
      return Type.Any;
  }
}

class AbstractState {
  #values = new Map<Identifier, AbstractValue>();

  read(alias: Place): AbstractValue {
    // Simple alias:
    //    read(alias);
    if (alias.memberPath === null) {
      let value = this.#values.get(alias.identifier);

      // Don't know what this is, let's default to an Object conservatively.
      if (value === undefined) {
        value = { kind: "Object", values: new Map() };
      }

      this.#values.set(alias.identifier, value);
      return value;
    }

    if (alias.memberPath.length > 1) {
      // TODO(gsn): Correctly handle nested member paths when reading values
      return { kind: "Object", values: new Map() };
    }

    // Complex alias:
    //   read(alias.memberPath);
    let object = this.#values.get(alias.identifier);

    // Don't know what this is, let's default to an Object conservatively.
    if (object === undefined) {
      object = { kind: "Object", values: new Map() };
      this.#values.set(alias.identifier, object);
    }

    // We're doing a member lookup on a non object.
    //
    //   alias = 1;
    //   read(alias.memberPath);
    if (object.kind !== "Object") {
      // Update alias to be an object
      object = { kind: "Object", values: new Map() };
      this.#values.set(alias.identifier, object);

      // Conservatively type the value as object.
      //
      // NOTE(gsn): Should this be an AbstractUnknown rather than an
      // AbstractObject?
      let value: AbstractObject = { kind: "Object", values: new Map() };
      object.values.set(alias.memberPath[0], value);
      return value;
    }

    let value = object.values.get(alias.memberPath[0]);

    // We don't have a value for this member path.
    //
    //   alias = {};
    //   read(alias.memberPath);
    if (value === undefined) {
      // Conservatively type the value as object.
      value = {
        kind: "Object",
        values: new Map(),
      };
      object.values.set(alias.memberPath[0], value);
      return value;
    }

    // We have a value for this memberPath!
    //
    //   alias.memberPath = value;
    //   read(alias.memberPath);
    return value;
  }

  store(lvalue: LValue, value: AbstractValue) {
    // TODO(gsn): Handle stores for complex lvalue
    if (lvalue.place.memberPath !== null) {
      return;
    }

    // Simple lvalue:
    //   lvalue = alias;
    //   lvalue = alias.memberPath;
    lvalue.place.type = typeOf(value);
    this.#values.set(lvalue.place.identifier, value);
  }
}

export function inferTypes(func: HIRFunction) {
  const state = new AbstractState();
  for (const [_, block] of func.body.blocks) {
    for (const instr of block.instructions) {
      inferInstr(instr, state);
    }
  }
}

function inferInstr(instr: Instruction, state: AbstractState) {
  const { lvalue, value: instrValue } = instr;
  let alias: Place | null = null;
  let value: AbstractValue | null = null;
  switch (instrValue.kind) {
    case "Primitive": {
      value = {
        kind: "Primitive",
        value: instrValue.value,
      };
      break;
    }
    case "Identifier": {
      alias = instrValue;
      value = state.read(alias);
      break;
    }
    default:
      return;
  }

  invariant(
    value !== null,
    `expected ${printInstructionValue(instrValue)} to be an alias or value`
  );

  // TODO(gsn): handle this.
  if (lvalue === null) {
    return;
  }

  state.store(lvalue, value);
}
