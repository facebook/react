/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { CompilerError } from "..";
import { HIRFunction } from "../HIR";

export function outlineFunctions(fn: HIRFunction): void {
  for (const [, block] of fn.body.blocks) {
    for (const instr of block.instructions) {
      const { value } = instr;

      if (
        value.kind === "FunctionExpression" ||
        value.kind === "ObjectMethod"
      ) {
        // Recurse in case there are inner functions which can be outlined
        outlineFunctions(value.loweredFunc.func);
      }

      if (
        value.kind === "FunctionExpression" &&
        value.loweredFunc.dependencies.length === 0 &&
        value.loweredFunc.func.context.length === 0 &&
        // TODO: handle outlining named functions
        value.loweredFunc.func.id === null
      ) {
        const loweredFunc = value.loweredFunc.func;

        const id = fn.env.generateUniqueGlobalIdentifier(loweredFunc.id);
        CompilerError.invariant(id.name !== null && id.name.kind === "named", {
          reason: "Expected to generate a named variable",
          loc: value.loc,
        });
        loweredFunc.id = id.name.value;

        fn.env.outlineFunction(loweredFunc, null);
        instr.value = {
          kind: "LoadGlobal",
          binding: {
            kind: "Global",
            name: id.name.value,
          },
          loc: value.loc,
        };
      }
    }
  }
}
