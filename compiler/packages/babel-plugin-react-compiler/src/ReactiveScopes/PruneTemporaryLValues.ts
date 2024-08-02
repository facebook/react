/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  DeclarationId,
  InstructionId,
  Place,
  ReactiveFunction,
  ReactiveInstruction,
} from '../HIR/HIR';
import {ReactiveFunctionVisitor, visitReactiveFunction} from './visitors';

/*
 * Nulls out lvalues for temporary variables that are never accessed later. This only
 * nulls out the lvalue itself, it does not remove the corresponding instructions.
 */
export function pruneUnusedLValues(fn: ReactiveFunction): void {
  const lvalues = new Map<DeclarationId, ReactiveInstruction>();
  visitReactiveFunction(fn, new Visitor(), lvalues);
  for (const [, instr] of lvalues) {
    instr.lvalue = null;
  }
}

type LValues = Map<DeclarationId, ReactiveInstruction>;

class Visitor extends ReactiveFunctionVisitor<LValues> {
  override visitPlace(id: InstructionId, place: Place, state: LValues): void {
    state.delete(place.identifier.declarationId);
  }
  override visitInstruction(
    instruction: ReactiveInstruction,
    state: LValues,
  ): void {
    this.traverseInstruction(instruction, state);
    if (
      instruction.lvalue !== null &&
      instruction.lvalue.identifier.name === null
    ) {
      state.set(instruction.lvalue.identifier.declarationId, instruction);
    }
  }
}
