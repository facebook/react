import invariant from "invariant";
import DisjointSet from "./DisjointSet";
import { HIRFunction, Identifier, Instruction, LValue, Place } from "./HIR";
import { printInstructionValue } from "./PrintHIR";

export type AliasSet = Set<Identifier>;

class AliasAnalyser {
  aliases = new DisjointSet<Identifier>();
  // NOTE(gsn): Should this be a part of AbstractObject? No, because this has
  // nothing to do with values in the object.
  objectAliases = new Map<Identifier, Map<string, AliasSet>>();

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
      return;
    }

    // Simple lvalue:
    //   lvalue = alias;
    //   lvalue = alias.memberPath;
    this.aliases.union([lvalue.place.identifier, alias.identifier]);
  }
}

export function inferAliases(func: HIRFunction): DisjointSet<Identifier> {
  const analyser = new AliasAnalyser();
  for (const [_, block] of func.body.blocks) {
    for (const instr of block.instructions) {
      inferInstr(instr, analyser);
    }
  }

  return analyser.aliases;
}

function inferInstr(instr: Instruction, state: AliasAnalyser) {
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

  // TODO(gsn): handle this.
  if (lvalue === null) {
    return;
  }

  if (alias !== null) {
    state.alias(lvalue, alias);
  }
}
