/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { CompilerError } from "../CompilerError";
import {
  GeneratedSource,
  HIRFunction,
  Identifier,
  IdentifierId,
  SourceLocation,
} from "./HIR";
import { printPlace } from "./PrintHIR";
import {
  eachInstructionLValue,
  eachInstructionValueOperand,
  eachTerminalOperand,
} from "./visitors";

/**
 * Validation pass to check that there is a 1:1 mapping between Identifier objects and IdentifierIds,
 * ie there can only be one Identifier instance per IdentifierId.
 */
export function validateConsistentIdentifiers(fn: HIRFunction): void {
  const identifiers: Identifiers = new Map();
  const assignments: Set<IdentifierId> = new Set();
  for (const [, block] of fn.body.blocks) {
    for (const phi of block.phis) {
      validate(identifiers, phi.id);
      for (const [, operand] of phi.operands) {
        validate(identifiers, operand);
      }
    }
    for (const instr of block.instructions) {
      if (instr.lvalue.identifier.name !== null) {
        CompilerError.invariant(
          `Expected all lvalues to be temporaries, found '${instr.lvalue.identifier.name}'`,
          instr.lvalue.loc
        );
      }
      if (assignments.has(instr.lvalue.identifier.id)) {
        CompilerError.invariant(
          `Expected lvalues to be assigned exactly once, found duplicate assignment of '${printPlace(
            instr.lvalue
          )}'`,
          instr.lvalue.loc
        );
      }
      assignments.add(instr.lvalue.identifier.id);
      for (const operand of eachInstructionLValue(instr)) {
        validate(identifiers, operand.identifier, operand.loc);
      }
      for (const operand of eachInstructionValueOperand(instr.value)) {
        validate(identifiers, operand.identifier, operand.loc);
      }
    }
    for (const operand of eachTerminalOperand(block.terminal)) {
      validate(identifiers, operand.identifier, operand.loc);
    }
  }
}

type Identifiers = Map<IdentifierId, Identifier>;

function validate(
  identifiers: Identifiers,
  identifier: Identifier,
  loc: SourceLocation | null = null
): void {
  const previous = identifiers.get(identifier.id);
  if (previous === undefined) {
    identifiers.set(identifier.id, identifier);
  } else if (identifier !== previous) {
    CompilerError.invariant(
      `Duplicate identifier for id ${identifier.id}`,
      loc ?? GeneratedSource
    );
  }
}
