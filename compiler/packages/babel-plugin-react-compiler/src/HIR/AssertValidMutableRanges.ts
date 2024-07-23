/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import invariant from 'invariant';
import {HIRFunction, Identifier, MutableRange} from './HIR';
import {
  eachInstructionLValue,
  eachInstructionOperand,
  eachTerminalOperand,
} from './visitors';

/*
 * Checks that all mutable ranges in the function are well-formed, with
 * start === end === 0 OR end > start.
 */
export function assertValidMutableRanges(fn: HIRFunction): void {
  for (const [, block] of fn.body.blocks) {
    for (const phi of block.phis) {
      for (const [, operand] of phi.operands) {
        visitIdentifier(operand);
      }
    }
    for (const instr of block.instructions) {
      for (const operand of eachInstructionLValue(instr)) {
        visitIdentifier(operand.identifier);
      }
      for (const operand of eachInstructionOperand(instr)) {
        visitIdentifier(operand.identifier);
      }
    }
    for (const operand of eachTerminalOperand(block.terminal)) {
      visitIdentifier(operand.identifier);
    }
  }
}

function visitIdentifier(identifier: Identifier): void {
  validateMutableRange(identifier.mutableRange);
  if (identifier.scope !== null) {
    validateMutableRange(identifier.scope.range);
  }
}

function validateMutableRange(mutableRange: MutableRange): void {
  invariant(
    (mutableRange.start === 0 && mutableRange.end === 0) ||
      mutableRange.end > mutableRange.start,
    'Identifier scope mutableRange was invalid: [%s:%s]',
    mutableRange.start,
    mutableRange.end,
  );
}
