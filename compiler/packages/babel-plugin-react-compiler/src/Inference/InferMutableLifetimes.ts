/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  Effect,
  HIRFunction,
  Identifier,
  InstructionId,
  InstructionKind,
  isRefOrRefValue,
  makeInstructionId,
  Place,
} from '../HIR/HIR';
import {printPlace} from '../HIR/PrintHIR';
import {
  eachInstructionLValue,
  eachInstructionOperand,
  eachTerminalOperand,
} from '../HIR/visitors';
import {assertExhaustive} from '../Utils/utils';

/*
 * For each usage of a value in the given function, determines if the usage
 * may be succeeded by a mutable usage of that same value and if so updates
 * the usage to be mutable.
 *
 * Stated differently, this inference ensures that inferred capabilities of
 * each reference are as follows:
 * - freeze: the value is frozen at this point
 * - readonly: the value is not modified at this point *or any subsequent
 *    point*
 * - mutable: the value is modified at this point *or some subsequent point*.
 *
 * Note that this refines the capabilities inferered by InferReferenceCapability,
 * which looks at individual references and not the lifetime of a value's mutability.
 *
 * == Algorithm
 *
 * TODO:
 * 1. Forward data-flow analysis to determine aliasing. Unlike InferReferenceCapability
 *     which only tracks aliasing of top-level variables (`y = x`), this analysis needs
 *     to know if a value is aliased anywhere (`y.x = x`). The forward data flow tracks
 *     all possible locations which may have aliased a value. The concrete result is
 *     a mapping of each Place to the set of possibly-mutable values it may alias.
 *
 * ```
 * const x = []; // {x: v0; v0: mutable []}
 * const y = {}; // {x: v0, y: v1; v0: mutable [], v1: mutable []}
 * y.x = x;      // {x: v0, y: v1; v0: mutable [v1], v1: mutable [v0]}
 * read(x);      // {x: v0, y: v1; v0: mutable [v1], v1: mutable [v0]}
 * mutate(y);    // can infer that y mutates v0 and v1
 * ```
 *
 * DONE:
 * 2. Forward data-flow analysis to compute mutability liveness. Walk forwards over
 *     the CFG and track which values are mutated in a successor.
 *
 * ```
 * mutate(y);    // mutable y => v0, v1 mutated
 * read(x);      // x maps to v0, v1, those are in the mutated-later set, so x is mutable here
 * ...
 * ```
 */

function infer(place: Place, instrId: InstructionId): void {
  if (!isRefOrRefValue(place.identifier)) {
    place.identifier.mutableRange.end = makeInstructionId(instrId + 1);
  }
}

function inferPlace(
  place: Place,
  instrId: InstructionId,
  inferMutableRangeForStores: boolean,
): void {
  switch (place.effect) {
    case Effect.Unknown: {
      throw new Error(`Found an unknown place ${printPlace(place)}}!`);
    }
    case Effect.Capture:
    case Effect.Read:
    case Effect.Freeze:
      return;
    case Effect.Store:
      if (inferMutableRangeForStores) {
        infer(place, instrId);
      }
      return;
    case Effect.ConditionallyMutate:
    case Effect.Mutate: {
      infer(place, instrId);
      return;
    }
    default:
      assertExhaustive(place.effect, `Unexpected ${printPlace(place)} effect`);
  }
}

export function inferMutableLifetimes(
  func: HIRFunction,
  inferMutableRangeForStores: boolean,
): void {
  /*
   * Context variables only appear to mutate where they are assigned, but we need
   * to force their range to start at their declaration. Track the declaring instruction
   * id so that the ranges can be extended if/when they are reassigned
   */
  const contextVariableDeclarationInstructions = new Map<
    Identifier,
    InstructionId
  >();
  for (const [_, block] of func.body.blocks) {
    for (const phi of block.phis) {
      const isPhiMutatedAfterCreation: boolean =
        phi.id.mutableRange.end >
        (block.instructions.at(0)?.id ?? block.terminal.id);
      if (
        inferMutableRangeForStores &&
        isPhiMutatedAfterCreation &&
        phi.id.mutableRange.start === 0
      ) {
        for (const [, operand] of phi.operands) {
          if (phi.id.mutableRange.start === 0) {
            phi.id.mutableRange.start = operand.mutableRange.start;
          } else {
            phi.id.mutableRange.start = makeInstructionId(
              Math.min(phi.id.mutableRange.start, operand.mutableRange.start),
            );
          }
        }
      }
    }

    for (const instr of block.instructions) {
      for (const operand of eachInstructionLValue(instr)) {
        const lvalueId = operand.identifier;

        /*
         * lvalue start being mutable when they're initially assigned a
         * value.
         */
        lvalueId.mutableRange.start = instr.id;

        /*
         * Let's be optimistic and assume this lvalue is not mutable by
         * default.
         */
        lvalueId.mutableRange.end = makeInstructionId(instr.id + 1);
      }
      for (const operand of eachInstructionOperand(instr)) {
        inferPlace(operand, instr.id, inferMutableRangeForStores);
      }

      if (
        instr.value.kind === 'DeclareContext' ||
        (instr.value.kind === 'StoreContext' &&
          instr.value.lvalue.kind !== InstructionKind.Reassign)
      ) {
        // Save declarations of context variables
        contextVariableDeclarationInstructions.set(
          instr.value.lvalue.place.identifier,
          instr.id,
        );
      } else if (instr.value.kind === 'StoreContext') {
        /*
         * Else this is a reassignment, extend the range from the declaration (if present).
         * Note that declarations may not be present for context variables that are reassigned
         * within a function expression before (or without) a read of the same variable
         */
        const declaration = contextVariableDeclarationInstructions.get(
          instr.value.lvalue.place.identifier,
        );
        if (
          declaration != null &&
          !isRefOrRefValue(instr.value.lvalue.place.identifier)
        ) {
          const range = instr.value.lvalue.place.identifier.mutableRange;
          if (range.start === 0) {
            range.start = declaration;
          } else {
            range.start = makeInstructionId(Math.min(range.start, declaration));
          }
        }
      }
    }
    for (const operand of eachTerminalOperand(block.terminal)) {
      inferPlace(operand, block.terminal.id, inferMutableRangeForStores);
    }
  }
}
