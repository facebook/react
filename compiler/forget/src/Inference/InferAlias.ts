import {
  HIRFunction,
  Identifier,
  Instruction,
  isPrimitiveType,
  Place,
} from "../HIR/HIR";
import DisjointSet from "../Utils/DisjointSet";

export type AliasSet = Set<Identifier>;

export function inferAliases(func: HIRFunction): DisjointSet<Identifier> {
  const aliases = new DisjointSet<Identifier>();
  for (const [_, block] of func.body.blocks) {
    for (const instr of block.instructions) {
      inferInstr(instr, aliases);
    }
  }

  return aliases;
}

function inferInstr(instr: Instruction, aliases: DisjointSet<Identifier>) {
  const { lvalue, value: instrValue } = instr;
  let alias: Place | null = null;
  switch (instrValue.kind) {
    case "LoadLocal": {
      if (isPrimitiveType(instrValue.place.identifier)) {
        return;
      }
      alias = instrValue.place;
      break;
    }
    case "StoreLocal": {
      // aliases.union([instrValue.place.identifier, instrValue.value.identifier]);
      alias = instrValue.value;
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

  aliases.union([lvalue.place.identifier, alias.identifier]);
}
