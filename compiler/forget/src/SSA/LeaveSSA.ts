/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import invariant from "invariant";
import {
  BasicBlock,
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
} from "../HIR/HIR";
import {
  eachInstructionValueOperand,
  eachTerminalOperand,
} from "../HIR/visitors";

/**
 * Removes SSA form by converting all phis into explicit bindings and assignments. There are two main categories
 * of phis:
 *
 * ## Reassignments (operands are independently memoizable)
 *
 * These are phis that occur after some high-level control flow such as an if, switch, or loop. These phis are rewritten
 * to add a new `let` binding for the phi id prior to the control flow node (ie prior to the if/switch),
 * and to add a reassignment to that let binding in each of the phi's predecessors.
 *
 * Example:
 *
 * ```javascript
 * // Input
 * let x1 = null;
 * if (a) {
 *   x2 = b;
 * } else {
 *   x3 = c;
 * }
 * x4 = phi(x2, x3);
 * return x4;
 *
 * // Output
 * const x1 = null;
 * let x4; // synthesized binding for the phi identifier
 * if (a) {
 *   x2 = b;
 *   x4 = x2;; // sythesized assignment to the phi identifier
 * } else {
 *   x3 = c;
 *   x4 = x3; // synthesized assignment
 * }
 * // phi removed
 * return x4;
 * ```
 *
 * ## Rewrites (operands are not independently memoizable)
 *
 * Phis that occur inside loop constructs cannot use the reassignment strategy, because there isn't an appropriate place
 * to add the new let binding. Instead, we select a single "canonical" id for these phis which is the operand that is
 * defined first. Then, all assignments and references for any of the phi ir and operands are rewritten to reference
 * the canonical id instead.
 *
 * Example:
 *
 * ```javascript
 * // Input
 * for (
 *  let i1 = 0;
 *  { i2 = phi(i1, i2); i2 < 10 }; // note the phi in the test block
 *  i2 += 1
 * ) { ... }
 *
 * // Output
 * for (
 *   let i1 = 0; // i1 is defined first, so it becomes the canonical id
 *   i1 < 10; // rewritten to canonical id
 *   i1 += 1 // rewritten to canonical id
 * )
 * ```
 */
export function leaveSSA(fn: HIRFunction): void {
  // For "memoizable" phis (see docblock), this maps the original identifiers to the identifier they
  // should be reassigned to. The keys are phi operands, and the values are the phi id to which
  // they are being explicitly reassigned.
  const reassignments: Map<Identifier, Identifier> = new Map();

  // For non-memoizable phis, this maps original identifiers to the identifier they should be
  // *rewritten* to. The keys are the original identifiers, and the value will be _either_ the
  // phi id or, more typically, the operand that was defined prior to the phi.
  const rewrites: Map<Identifier, Identifier> = new Map();

  type PhiState = {
    phi: Phi;
    block: BasicBlock;
  };
  function pushPhis(arr: Array<PhiState>, block: BasicBlock): void {
    for (const phi of block.phis) {
      arr.push({ phi, block });
    }
  }

  for (const [, block] of fn.body.blocks) {
    invariant(
      block.phis.size === 0,
      "Expected all phis to be cleared by predecessors"
    );

    // Find any phi nodes which need a variable declaration in the current block
    // This includes phis in fallthrough nodes, or blocks that form part of control flow
    // such as for or while (and later if/switch).
    const reassignmentPhis: Array<PhiState> = [];
    const rewritePhis: Array<PhiState> = [];
    const terminal = block.terminal;
    if (
      (terminal.kind === "if" ||
        terminal.kind === "switch" ||
        terminal.kind === "while" ||
        terminal.kind === "for") &&
      terminal.fallthrough !== null
    ) {
      const fallthrough = fn.body.blocks.get(terminal.fallthrough)!;
      pushPhis(reassignmentPhis, fallthrough);
      fallthrough.phis.clear();
    }
    if (terminal.kind === "while" || terminal.kind === "for") {
      const test = fn.body.blocks.get(terminal.test)!;
      pushPhis(rewritePhis, test);
      test.phis.clear();

      const loop = fn.body.blocks.get(terminal.loop)!;
      pushPhis(rewritePhis, loop);
      loop.phis.clear();
    }
    if (terminal.kind === "for") {
      const init = fn.body.blocks.get(terminal.init)!;
      pushPhis(rewritePhis, init);
      init.phis.clear();

      const update = fn.body.blocks.get(terminal.update)!;
      pushPhis(rewritePhis, update);
      update.phis.clear();
    }
    if (terminal.kind === "logical" || terminal.kind === "ternary") {
      const fallthrough = fn.body.blocks.get(terminal.fallthrough)!;
      pushPhis(rewritePhis, fallthrough);
      fallthrough.phis.clear();
    }

    for (const { phi, block: phiBlock } of reassignmentPhis) {
      // In some cases one of the phi operands can be defined *before* the let binding
      // we will generate. For example, a variable that is only rebound in one branch of
      // an if but not another. In this case we populate the let binding with this initial
      // value rather than generate an extra assignment.
      let initOperand: Identifier | null = null;

      // Determine the canonical id to use for this phi. In general this is the phi id,
      // but if one phi flows into another as an operand, this will be the final phi.
      let canonicalId = reassignments.get(phi.id);
      if (canonicalId === undefined) {
        canonicalId = phi.id;
        canonicalId.mutableRange.start = Math.min(
          canonicalId.mutableRange.start,
          terminal.id
        ) as InstructionId;
        reassignments.set(phi.id, canonicalId);
      }

      // all versions of the variable need to be remapped to the canonical id
      for (const [, operand] of phi.operands) {
        reassignments.set(operand, canonicalId);
        if (operand.mutableRange.start < terminal.id) {
          invariant(
            initOperand === null,
            "A phi cannot have two operands initialized before its declaration"
          );
          initOperand = operand;
        }
      }

      // If there are no instructions in the block then there's just a terminal
      // node, which has no mutation, so that should be false.
      //
      // TODO(joe): This above statement is true, right? Could there be a value
      // block with instructions in terminals?
      const isPhiMutatedAfterCreation: boolean =
        phi.id.mutableRange.end >
        (phiBlock.instructions.at(0)?.id ?? phiBlock.terminal.id);

      // If a phi is never mutated after creation, reset its mutable range to be itself
      if (!isPhiMutatedAfterCreation) {
        canonicalId.mutableRange.start = phiBlock.terminal.id;
        canonicalId.mutableRange.end = makeInstructionId(
          phiBlock.terminal.id + 1
        );
      }

      // If this phi id is the canonical id we need to generate a let binding for it
      // (otherwise, it means this phi merges into some other phi which already generated
      // a binding
      if (canonicalId === phi.id) {
        const instr: Instruction = {
          // NOTE: reuse the terminal id since these lets must be scoped with the terminal anyway.
          // the mutable range of this canonical id must by definition span from the binding (before
          // the if) to the phi, so it's safe to reuse the terminal's id.
          id: block.terminal.id,
          lvalue: {
            place: {
              kind: "Identifier",
              identifier: canonicalId,
              effect: Effect.Mutate,
              loc: GeneratedSource,
            },
            kind: InstructionKind.Let,
          },
          value:
            initOperand !== null
              ? {
                  kind: "Identifier",
                  identifier: initOperand,
                  effect: Effect.Read,
                  loc: GeneratedSource,
                }
              : {
                  kind: "Primitive",
                  // TODO: consider leaving the variable uninitialized rather than explicitly undefined.
                  value: undefined,
                  loc: GeneratedSource,
                },
          loc: GeneratedSource,
        };
        block.instructions.push(instr);
      }

      // Generate an assignment in each predecessor
      for (const [predecessorId, operand] of phi.operands) {
        if (isPhiMutatedAfterCreation) {
          operand.mutableRange.end = phi.id.mutableRange.end;
        }
        if (operand === initOperand) {
          continue;
        }
        const predecessor = fn.body.blocks.get(predecessorId)!;
        const instr: Instruction = {
          id: predecessor.terminal.id,
          lvalue: {
            place: {
              kind: "Identifier",
              identifier: canonicalId,
              effect: Effect.Mutate,
              loc: GeneratedSource,
            },
            kind: InstructionKind.Reassign,
          },
          value: {
            kind: "Identifier",
            identifier: operand,
            effect: Effect.Read,
            loc: GeneratedSource,
          },
          loc: GeneratedSource,
        };
        predecessor.instructions.push(instr);
      }
    }

    // Similar logic for rewrite phis that occur in loops, except that instead of a new let binding
    // we pick one of the operands as the canonical id, and rewrite all references to the other
    // operands and the phi to reference this canonical id.
    for (const { phi } of rewritePhis) {
      let canonicalId = rewrites.get(phi.id);
      if (canonicalId === undefined) {
        canonicalId = phi.id;
        for (const [, operand] of phi.operands) {
          let canonicalOperand = rewrites.get(operand) ?? operand;
          if (canonicalOperand.id < canonicalId.id) {
            canonicalId = canonicalOperand;
          }
        }
        canonicalId.mutableRange.start = Math.min(
          canonicalId.mutableRange.start,
          terminal.id
        ) as InstructionId;
        rewrites.set(phi.id, canonicalId);
      }

      // all versions of the variable need to be remapped to the canonical id
      // also extend the mutable range of the canonical id based on the min/max
      // of the ranges of its operands
      let start = canonicalId.mutableRange.start as number;
      let end = canonicalId.mutableRange.end as number;
      for (const [, operand] of phi.operands) {
        start = Math.min(start, operand.mutableRange.start);
        end = Math.max(end, operand.mutableRange.end);
        rewrites.set(operand, canonicalId);
      }
      canonicalId.mutableRange.start = makeInstructionId(start);
      canonicalId.mutableRange.end = makeInstructionId(end);
    }

    // Finally, iterate the instructions and perform any rewrites as well as converting
    // SSA variables to `const` where possible
    for (const instr of block.instructions) {
      const { lvalue } = instr;
      if (
        lvalue.kind === InstructionKind.Const &&
        rewrites.has(lvalue.place.identifier)
      ) {
        // For rewrites, the declaration of the canonical identifier has to be `let`,
        // all other assignments are reassignments (which we annotate for codegen
        // purposes).
        lvalue.kind =
          rewrites.get(lvalue.place.identifier) === lvalue.place.identifier
            ? InstructionKind.Let
            : InstructionKind.Reassign;
      }
      rewritePlace(lvalue.place, rewrites);
      for (const operand of eachInstructionValueOperand(instr.value)) {
        rewritePlace(operand, rewrites);
      }
    }
    for (const operand of eachTerminalOperand(terminal)) {
      rewritePlace(operand, rewrites);
    }
  }
}

// Rewrite @param place's identifier based on the given rewrite mapping, if the identifier
// is present. Also expands the mutable range of the target identifier to include the
// place's range.
function rewritePlace(
  place: Place,
  rewrites: Map<Identifier, Identifier>
): void {
  const prevIdentifier = place.identifier;
  const nextIdentifier = rewrites.get(prevIdentifier);
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
