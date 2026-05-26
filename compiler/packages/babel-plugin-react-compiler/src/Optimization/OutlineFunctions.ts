/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {HIRFunction, IdentifierId} from '../HIR';

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
        !accessesOuterScopeBinding(value.loweredFunc.func)
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

/**
 * Returns true if the function expression accesses a variable that was
 * classified as ModuleLocal but is not actually defined at the program/module
 * scope. This happens when a component is defined inside a factory function:
 * the factory function's locals are resolved as `scope.parent` bindings and
 * tagged as ModuleLocal, but they only exist within the factory closure and
 * would be undefined if the function were outlined to module scope.
 */
function accessesOuterScopeBinding(fn: HIRFunction): boolean {
  const programScope = fn.env.parentFunction.scope.getProgramParent();
  for (const [, block] of fn.body.blocks) {
    for (const instr of block.instructions) {
      const {value} = instr;
      if (
        value.kind === 'LoadGlobal' &&
        value.binding.kind === 'ModuleLocal' &&
        programScope.getBinding(value.binding.name) == null
      ) {
        return true;
      }
    }
  }
  return false;
}
