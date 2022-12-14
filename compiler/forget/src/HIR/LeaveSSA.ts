/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import invariant from "invariant";
import {
  Effect,
  GeneratedSource,
  HIRFunction,
  Identifier,
  Instruction,
  InstructionId,
  InstructionKind,
  makeInstructionId,
  Phi,
  Place,
} from "./HIR";
import { eachInstructionValueOperand, eachTerminalOperand } from "./visitors";

/**
 * Removes SSA form by creating unique variable declarations for the versions of each variables.
 * - Versions of a variable that do not flow into a phi node are each assigned their own const variable
 * declaration.
 * - If multiple versions of a variable flow into some phi node, then all those versions are reassigned to
 * the phi version. A single declaration is created at the same block scope as the phi, prior to any of the
 * assignments.
 */
export function leaveSSA(fn: HIRFunction) {
  // Maps identifiers that appear as a phi or phi operand to a single canonical identifier
  // for all instances.
  const variableMapping: Map<Identifier, Identifier> = new Map();
  const hasDeclaration: Set<Identifier> = new Set();

  for (const [, block] of fn.body.blocks) {
    invariant(
      block.phis.size === 0,
      "Expected all phis to be cleared by predecessors"
    );

    // Identifiers (from phis) that *may* need a new `let` declaration created. If the original
    // variable declaration flows into the phi, then we can reuse its declaration - this is
    // discovered during iteration of instructions.
    const needsDeclaration: Set<Identifier> = new Set();

    // Find any phi nodes which need a variable declaration in the current block
    // This includes phis in fallthrough nodes, or blocks that form part of control flow
    // such as for or while (and later if/switch).
    const phis: Array<Phi> = [];
    const terminal = block.terminal;
    if (
      (terminal.kind === "if" ||
        terminal.kind === "switch" ||
        terminal.kind === "while" ||
        terminal.kind === "for") &&
      terminal.fallthrough !== null
    ) {
      const fallthrough = fn.body.blocks.get(terminal.fallthrough)!;
      phis.push(...fallthrough.phis);
      fallthrough.phis.clear();
    }
    if (terminal.kind === "while" || terminal.kind === "for") {
      const test = fn.body.blocks.get(terminal.test)!;
      phis.push(...test.phis);
      test.phis.clear();

      const loop = fn.body.blocks.get(terminal.loop)!;
      phis.push(...loop.phis);
      loop.phis.clear();
    }
    if (terminal.kind === "for") {
      const init = fn.body.blocks.get(terminal.init)!;
      phis.push(...init.phis);
      init.phis.clear();

      const update = fn.body.blocks.get(terminal.update)!;
      phis.push(...update.phis);
      update.phis.clear();

      // find declarations in the for init
      for (const instr of init.instructions) {
        if (instr.lvalue !== null && instr.lvalue.place.memberPath === null) {
          hasDeclaration.add(instr.lvalue.place.identifier);
        }
      }
    }

    // For each phi, determine a canonical identifier to use for versions of the variable
    // that appear in the phi (as its output id and operands). If this is the first time
    // we're seeing the phi id, then we may need to generate a new variable declaration
    // Note that there can be multiple phi nodes for the same variable, we capture the
    // outermost scope by visiting predecessor blocks first.
    for (const phi of phis) {
      let canonicalId = variableMapping.get(phi.id);
      if (canonicalId === undefined) {
        // Determine a new canonical id. We use the id/operand whose id is lowest,
        // which ensures that _if_ the original variable declaration is one of the
        // options we'll choose it and can reuse the declaration.
        canonicalId = phi.id;
        for (const [, operand] of phi.operands) {
          let canonicalOperand = variableMapping.get(operand) ?? operand;
          if (canonicalOperand.id < canonicalId.id) {
            canonicalId = canonicalOperand;
          }
        }
        canonicalId.mutableRange.start = Math.min(
          canonicalId.mutableRange.start,
          terminal.id
        ) as InstructionId;
        variableMapping.set(phi.id, canonicalId);
        if (!hasDeclaration.has(canonicalId)) {
          needsDeclaration.add(canonicalId);
        }
      }

      // all versions of the variable need to be remapped to the canonical id
      // also extend the mutable range of the canonical id based on the min/max
      // of the ranges of its operands
      let start = canonicalId.mutableRange.start as number;
      let end = canonicalId.mutableRange.end as number;
      for (const [, operand] of phi.operands) {
        start = Math.min(start, operand.mutableRange.start);
        end = Math.max(end, operand.mutableRange.end);
        variableMapping.set(operand, canonicalId);
      }
      canonicalId.mutableRange.start = makeInstructionId(start);
      canonicalId.mutableRange.end = makeInstructionId(end);
    }

    // Visit instructions and rewrite identifiers based on the variable mapping
    // updated above.
    for (const instr of block.instructions) {
      const { lvalue, value } = instr;
      if (lvalue !== null) {
        updatePlace(lvalue.place, variableMapping);
        if (lvalue.place.memberPath === null) {
          if (!variableMapping.has(lvalue.place.identifier)) {
            // This variable does not flow into a phi, therefore there
            // is no reassignment. Convert the declaration to a const.
            lvalue.kind = InstructionKind.Const;
          } else if (
            variableMapping.get(lvalue.place.identifier) ===
            lvalue.place.identifier
          ) {
            // This is an existing declaration we can reuse as the canonical declaration for its
            // phi. Note, the declaration must already be a `let` or else it would be invalid to
            // reassign the variable in the first place.
            needsDeclaration.delete(lvalue.place.identifier);
          }
          hasDeclaration.add(lvalue.place.identifier);
        }
      }
      for (const operand of eachInstructionValueOperand(value)) {
        updatePlace(operand, variableMapping);
      }
    }

    for (const operand of eachTerminalOperand(terminal)) {
      operand.identifier =
        variableMapping.get(operand.identifier) ?? operand.identifier;
    }

    // Generate new let declarations for any remaining phi variables
    for (const identifier of needsDeclaration) {
      const instr: Instruction = {
        // NOTE: reuse the terminal id since these lets must be scoped with the terminal anyway
        // the only reason they exist is that there is a scope that will span the control flow.
        id: block.terminal.id,
        lvalue: {
          place: {
            kind: "Identifier",
            memberPath: null,
            identifier,
            effect: Effect.Mutate,
            loc: GeneratedSource,
          },
          kind: InstructionKind.Let,
        },
        value: {
          kind: "Primitive",
          value: undefined,
          loc: GeneratedSource,
        },
        loc: GeneratedSource,
      };
      block.instructions.push(instr);
    }
  }
}

function updatePlace(
  place: Place,
  variableMapping: Map<Identifier, Identifier>
) {
  const prevIdentifier = place.identifier;
  const nextIdentifier = variableMapping.get(prevIdentifier);
  if (nextIdentifier === undefined || nextIdentifier === prevIdentifier) {
    return;
  }
  nextIdentifier.mutableRange.start = makeInstructionId(
    Math.min(
      nextIdentifier.mutableRange.start,
      prevIdentifier.mutableRange.start
    )
  );
  nextIdentifier.mutableRange.end = makeInstructionId(
    Math.max(nextIdentifier.mutableRange.end, prevIdentifier.mutableRange.end)
  );
  place.identifier = nextIdentifier;
}
