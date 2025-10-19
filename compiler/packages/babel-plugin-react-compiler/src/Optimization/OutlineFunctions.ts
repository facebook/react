/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {HIRFunction, IdentifierId} from '../HIR';

/**
 * Checks if a function accesses context variables that are not explicitly
 * tracked in its context array. Context variables are those that are both
 * accessed within a function expression and reassigned somewhere in the
 * outer scope.
 */
function accessesOuterContextVariables(fn: HIRFunction): boolean {
  const contextIdentifiers = new Set(
    fn.context.map(place => place.identifier.id),
  );

  for (const [, block] of fn.body.blocks) {
    for (const instr of block.instructions) {
      if (
        instr.value.kind === 'LoadContext' ||
        instr.value.kind === 'StoreContext'
      ) {
        const place =
          instr.value.kind === 'LoadContext'
            ? instr.value.place
            : instr.value.lvalue.place;
        if (!contextIdentifiers.has(place.identifier.id)) {
          return true;
        }
      }

      if (
        instr.value.kind === 'FunctionExpression' ||
        instr.value.kind === 'ObjectMethod'
      ) {
        if (accessesOuterContextVariables(instr.value.loweredFunc.func)) {
          return true;
        }
      }
    }
  }
  return false;
}

export function outlineFunctions(
  fn: HIRFunction,
  fbtOperands: Set<IdentifierId>,
): void {
  for (const [, block] of fn.body.blocks) {
    for (const instr of block.instructions) {
      const {value, lvalue} = instr;

      if (
        value.kind === 'FunctionExpression' ||
        value.kind === 'ObjectMethod'
      ) {
        // Recurse in case there are inner functions which can be outlined
        outlineFunctions(value.loweredFunc.func, fbtOperands);
      }
      if (
        value.kind === 'FunctionExpression' &&
        value.loweredFunc.func.context.length === 0 &&
        // TODO: handle outlining named functions
        value.loweredFunc.func.id === null &&
        !fbtOperands.has(lvalue.identifier.id) &&
        !accessesOuterContextVariables(value.loweredFunc.func)
      ) {
        const loweredFunc = value.loweredFunc.func;

        const id = fn.env.generateGloballyUniqueIdentifierName(
          loweredFunc.id ?? loweredFunc.nameHint,
        );
        loweredFunc.id = id.value;

        fn.env.outlineFunction(loweredFunc, null);
        instr.value = {
          kind: 'LoadGlobal',
          binding: {
            kind: 'Global',
            name: id.value,
          },
          loc: value.loc,
        };
      }
    }
  }
}
