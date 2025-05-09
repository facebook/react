/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  HIRFunction,
  Identifier,
  isRefOrRefValue,
  makeInstructionId,
} from '../HIR';
import {eachInstructionOperand} from '../HIR/visitors';
import {isMutable} from '../ReactiveScopes/InferReactiveScopeVariables';

/**
 * Finds instructions with operands that co-mutate and extends all their mutable ranges
 * to end at the same point (the highest `end` value of the group). Note that the
 * alias sets used in InferMutableRanges are meant for values that strictly alias:
 * a mutation of one value in the set would directly modify the same object as some
 * other value in the set.
 *
 * However, co-mutation can cause an alias to one object to be stored within another object,
 * for example:
 *
 * ```
 * const a = {};
 * const b = {};
 * const f = () => b.c; //
 * setProperty(a, 'b', b); // equiv to a.b = b
 *
 * a.b.c = 'c'; // this mutates b!
 * ```
 *
 * Here, the co-mutation in `setProperty(a, 'b', b)` means that a reference to b may be stored
 * in a, vice-versa, or both. We need to extend the mutable range of both a and b to reflect
 * the fact the values may mutate together.
 *
 * Previously this was implemented in InferReactiveScopeVariables, but that is too late:
 * we need this to be part of the InferMutableRanges fixpoint iteration to account for functions
 * like `f` in the example, which capture a reference to a value that may change later. `f`
 * cannot be independently memoized from the `setProperty()` call due to the co-mutation.
 *
 * See aliased-capture-mutate and aliased-capture-aliased-mutate fixtures for examples.
 */
export function inferMutableRangesForComutation(fn: HIRFunction): void {
  for (const block of fn.body.blocks.values()) {
    for (const instr of block.instructions) {
      let operands: Array<Identifier> | null = null;
      for (const operand of eachInstructionOperand(instr)) {
        if (
          isMutable(instr, operand) &&
          operand.identifier.mutableRange.start > 0
        ) {
          if (
            instr.value.kind === 'FunctionExpression' ||
            instr.value.kind === 'ObjectMethod'
          ) {
            if (operand.identifier.type.kind === 'Primitive') {
              continue;
            }
          }
          operands ??= [];
          operands.push(operand.identifier);
        }
      }
      if (operands != null) {
        // Find the last instruction which mutates any of the mutable operands
        let lastMutatingInstructionId = makeInstructionId(0);
        for (const id of operands) {
          if (id.mutableRange.end > lastMutatingInstructionId) {
            lastMutatingInstructionId = id.mutableRange.end;
          }
        }

        /**
         * Update all mutable operands's mutable ranges to end at the same point
         */
        for (const id of operands) {
          if (
            id.mutableRange.end < lastMutatingInstructionId &&
            !isRefOrRefValue(id)
          ) {
            id.mutableRange.end = lastMutatingInstructionId;
          }
        }
      }
    }
  }
}
