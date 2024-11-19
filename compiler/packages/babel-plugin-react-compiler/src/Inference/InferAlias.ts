/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import invariant from 'invariant';
import {CompilerError} from '..';
import {
  HIRFunction,
  Identifier,
  IdentifierId,
  Instruction,
  isPrimitiveType,
  Place,
} from '../HIR/HIR';
import {printPlace} from '../HIR/PrintHIR';
import {
  eachInstructionLValue,
  eachInstructionValueOperand,
  eachPatternOperand,
  eachTerminalOperand,
} from '../HIR/visitors';
import DisjointSet from '../Utils/DisjointSet';

export type AliasSet = Set<Identifier>;

export function inferAliases(func: HIRFunction): DisjointSet<Place> {
  const aliases = new DisjointSet<Place>();
  const declarations = new Map<IdentifierId, Place>();
  for (const param of func.params) {
    const place = param.kind === 'Identifier' ? param : param.place;
    declarations.set(place.identifier.id, place);
  }
  for (const [_, block] of func.body.blocks) {
    for (const phi of block.phis) {
      declarations.set(phi.place.identifier.id, phi.place);
    }
    for (const instr of block.instructions) {
      inferInstr(instr, aliases, declarations);
    }
    for (const operand of eachTerminalOperand(block.terminal)) {
      const declaration = declarations.get(operand.identifier.id);
      if (declaration !== undefined) {
        aliases.union([declaration, operand]);
      }
    }
  }

  return aliases;
}

function assertGet(map: Map<IdentifierId, Place>, place: Place): Place {
  const value = map.get(place.identifier.id);
  if (value === undefined) {
    CompilerError.invariant(value !== undefined, {
      reason: `Missing declaration for ${printPlace(place)}`,
      loc: place.loc,
    });
  }
  return value;
}

function inferInstr(
  instr: Instruction,
  aliases: DisjointSet<Place>,
  declarations: Map<IdentifierId, Place>,
): void {
  const {lvalue, value: instrValue} = instr;
  switch (instrValue.kind) {
    case 'LoadLocal':
    case 'LoadContext': {
      if (!isPrimitiveType(instrValue.place.type)) {
        const places = [
          lvalue,
          instrValue.place,
          assertGet(declarations, instrValue.place),
        ];
        aliases.union(places);
      }
      break;
    }
    case 'StoreLocal':
    case 'StoreContext': {
      if (!isPrimitiveType(instrValue.value.type)) {
        const places = [
          lvalue,
          instrValue.lvalue.place,
          instrValue.value,
          assertGet(declarations, instrValue.value)!,
        ];
        aliases.union(places);
      }
      break;
    }
    case 'Destructure': {
      aliases.union([
        lvalue,
        ...eachPatternOperand(instrValue.lvalue.pattern),
        instrValue.value,
        assertGet(declarations, instrValue.value)!,
      ]);
      break;
    }
    case 'ComputedLoad':
    case 'PropertyLoad': {
      aliases.union([
        lvalue,
        instrValue.object,
        assertGet(declarations, instrValue.object)!,
      ]);
      break;
    }
    case 'TypeCastExpression': {
      if (!isPrimitiveType(instrValue.value.type)) {
        aliases.union([
          lvalue,
          instrValue.value,
          assertGet(declarations, instrValue.value),
        ]);
      }
      break;
    }
    default: {
      for (const operand of eachInstructionValueOperand(instrValue)) {
        const declaration = declarations.get(operand.identifier.id);
        if (declaration != null) {
          aliases.union([operand, declaration]);
        }
      }
      break;
    }
  }
  for (const lvalue of eachInstructionLValue(instr)) {
    if (!declarations.has(lvalue.identifier.id)) {
      declarations.set(lvalue.identifier.id, lvalue);
    }
  }
}
