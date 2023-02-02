import {
  HIRFunction,
  Identifier,
  Instruction,
  isPrimitiveType,
  LValue,
  Place,
} from "../HIR/HIR";
import DisjointSet from "../Utils/DisjointSet";

export type AliasSet = Set<Identifier>;

class AliasAnalyser {
  aliases = new DisjointSet<Identifier>();

  alias(lvalue: LValue, alias: Place) {
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
      if (isPrimitiveType(instrValue.identifier)) {
        return;
      }
      alias = instrValue;
      break;
    }
    case "ComputedLoad":
    case "PropertyLoad": {
      alias = instrValue.object;
      break;
    }
    case "TypeCastExpression": {
      alias = instrValue.value;
      break;
    }
    default:
      return;
  }

  state.alias(lvalue, alias);
}
