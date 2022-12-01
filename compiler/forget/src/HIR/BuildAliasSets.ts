import invariant from "invariant";
import DisjointSet from "./DisjointSet";
import { HIRFunction, Identifier, Instruction, Place, LValue } from "./HIR";
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

class AbstractState {
  aliases = new DisjointSet<Identifier>();
  #values = new Map<Identifier, AbstractValue>();

  // Simple lvalue:
  //   lvalue = alias;
  //   lvalue = alias.memberPath;
  alias(lvalue: LValue, alias: Place) {
    // Simple alias:
    //    lvalue = alias;
    if (alias.memberPath === null) {
      let value = this.#values.get(alias.identifier);

      // Don't know what this, let's default to an Object conservatively.
      if (value === undefined) {
        value = { kind: "Object", values: new Map() };
      }

      this.#values.set(lvalue.place.identifier, value);

      // No need to alias Primitives
      if (value.kind !== "Primitive") {
        this.aliases.union([lvalue.place.identifier, alias.identifier]);
      }
      return;
    }

    // Complex alias:
    //   lvalue = alias.memberPath;
    if (alias.memberPath.length > 1) {
      // TODO(gsn): Handle nested member paths
      return;
    }

    let object = this.#values.get(alias.identifier);

    // Don't know what this, let's default to an Object conservatively.
    if (object === undefined) {
      object = { kind: "Object", values: new Map() };
    }

    // We're doing a member lookup on a non object.
    //
    //   alias = 1;
    //   lvalue = alias.memberPath;
    if (object.kind !== "Object") {
      // Conservatively type the value as object.
      //
      // NOTE(gsn): Should this be an AbstractUnknown rather than an
      // AbstractObject?
      this.#values.set(lvalue.place.identifier, {
        kind: "Object",
        values: new Map(),
      });
      this.aliases.union([lvalue.place.identifier, alias.identifier]);
      return;
    }

    let value = object.values.get(alias.memberPath[0]);

    // We don't have a value for this member path.
    //
    //   alias = {};
    //   lvalue = alias.memberPath;
    if (value === undefined) {
      // Conservatively type the value as object.
      this.#values.set(lvalue.place.identifier, {
        kind: "Object",
        values: new Map(),
      });
      this.aliases.union([lvalue.place.identifier, alias.identifier]);
      return;
    }

    // We have a value for this memberPath!
    //
    //    alias.memberPath = value;
    //    lvalue = alias.memberPath;
    this.#values.set(lvalue.place.identifier, value);

    // No need to alias Primitives.
    if (value.kind !== "Primitive") {
      this.aliases.union([lvalue.place.identifier, alias.identifier]);
    }
  }

  buildAliasSets(): Array<Set<Identifier>> {
    const aliasIds: Map<Identifier, number> = new Map();
    const aliasSets: Map<number, Set<Identifier>> = new Map();

    this.aliases.forEach((identifier, groupIdentifier) => {
      let aliasId = aliasIds.get(groupIdentifier);
      if (aliasId == null) {
        aliasId = aliasIds.size;
        aliasIds.set(groupIdentifier, aliasId);
      }

      let aliasSet = aliasSets.get(aliasId);
      if (aliasSet === undefined) {
        aliasSet = new Set();
        aliasSets.set(aliasId, aliasSet);
      }
      aliasSet.add(identifier);
    });

    return [...aliasSets.values()];
  }
}

export function buildAliasSets(func: HIRFunction): Array<Set<Identifier>> {
  const state = new AbstractState();
  for (const [_, block] of func.body.blocks) {
    for (const instr of block.instructions) {
      inferInstr(instr, state);
    }
  }
  return state.buildAliasSets();
}

function inferInstr(instr: Instruction, state: AbstractState) {
  const { lvalue, value: instrValue } = instr;
  let alias: Place | null = null;
  switch (instrValue.kind) {
    case "Identifier": {
      alias = instrValue;
      break;
    }
    default:
      return;
  }

  invariant(
    alias !== null,
    `expected ${printInstructionValue(instrValue)} to have an alias`
  );

  // TODO(gsn): handle this.
  if (lvalue === null) {
    return;
  }

  // simple aliasing
  if (lvalue.place.memberPath === null) {
    state.alias(lvalue, alias);
  }
}
