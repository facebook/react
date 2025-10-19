/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {HIRFunction, IdentifierId} from '../HIR';

/**
 * Checks if a function has any references to variables from outer scopes
 * (beyond the explicitly tracked context array). This includes LoadContext
 * instructions which indicate the function is accessing variables that are
 * not passed as parameters or declared locally.
 */
function hasUnaccountedOuterScopeReferences(fn: HIRFunction): boolean {
  for (const [, block] of fn.body.blocks) {
    for (const instr of block.instructions) {
      // Check if this instruction loads from outer scope context
      if (instr.value.kind === 'LoadContext') {
        // LoadContext means we're accessing a variable from an outer scope
        // that's not in the context array. This function cannot be safely outlined.
        return true;
      }

      // Recursively check nested functions
      if (
        instr.value.kind === 'FunctionExpression' ||
        instr.value.kind === 'ObjectMethod'
      ) {
        if (hasUnaccountedOuterScopeReferences(instr.value.loweredFunc.func)) {
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
        // FIXED: Also check that the function doesn't have any LoadContext instructions
        // which would indicate it's accessing variables from outer scopes not tracked
        // in the context array. See https://github.com/facebook/react/issues/34901
        !hasUnaccountedOuterScopeReferences(value.loweredFunc.func)
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
