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

export type AliasSet = Set<Identifier>;
class AbstractState {
  aliases = new DisjointSet<Identifier>();
  // NOTE(gsn): Should this be a part of AbstractObject? No, because this has
  // nothing to do with values in the object.
  objectAliases = new Map<Identifier, Map<string, AliasSet>>();

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

  alias(lvalue: LValue, alias: Place) {
    // Complex lvalue:
    //   lvalue.memberPath = alias;
    //   lvalue.memberPath = alias.someMemberPath;
    if (lvalue.place.memberPath !== null) {
      // TODO(gsn): Handle nested memberPaths in lvalue.
      if (lvalue.place.memberPath.length > 1) {
        return;
      }
      let memberPath = lvalue.place.memberPath[0];

      // Consider the case of:
      //   lvalue.memberPath = alias;
      //   mutate(lvalue);            <-- `alias` should be considered mutable
      //                                   here.
      //
      // Similarly for this case,
      //   mutate(lvalue.memberPath); <-- `alias` should be considered mutable
      //                                   here as well.
      //
      // But what about this case:
      //   mutate(lvalue.foo);        <-- Do we consider `alias` mutable here?
      //                                  No!
      //
      // To distinguish between these different cases, we need to build separate
      // alias sets for each memberPath of `lvalue`.
      let objectAlias = this.objectAliases.get(lvalue.place.identifier);
      if (objectAlias === undefined) {
        objectAlias = new Map<string, AliasSet>();
        this.objectAliases.set(lvalue.place.identifier, objectAlias);
      }

      let memberAlias = objectAlias.get(memberPath);
      if (memberAlias === undefined) {
        memberAlias = new Set<Identifier>();
        objectAlias.set(memberPath, memberAlias);
      }

      memberAlias.add(alias.identifier);
      this.aliases.union([lvalue.place.identifier, alias.identifier]);
      return;
    }

    // Simple lvalue:
    //   lvalue = alias;
    //   lvalue = alias.memberPath;
    this.aliases.union([lvalue.place.identifier, alias.identifier]);
  }

  store(lvalue: LValue, value: AbstractValue) {
    // TODO(gsn): Handle stores for complex lvalue
    if (lvalue.place.memberPath !== null) {
      return;
    }

    // Simple lvalue:
    //   lvalue = alias;
    //   lvalue = alias.memberPath;
    this.#values.set(lvalue.place.identifier, value);
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

export function buildAliasSets(func: HIRFunction): Array<AliasSet> {
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

  // No need to alias Primitives.
  if (alias !== null && value.kind !== "Primitive") {
    state.alias(lvalue, alias);
  }

  state.store(lvalue, value);
}
