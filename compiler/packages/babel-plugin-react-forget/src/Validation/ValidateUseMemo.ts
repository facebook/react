/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { CompilerError } from "..";
import {
  FunctionExpression,
  HIRFunction,
  IdentifierId,
  getHookKind,
} from "../HIR";

export function validateUseMemo(fn: HIRFunction): void {
  const functions = new Map<IdentifierId, FunctionExpression>();
  for (const [, block] of fn.body.blocks) {
    for (const { lvalue, value } of block.instructions) {
      switch (value.kind) {
        case "FunctionExpression": {
          functions.set(lvalue.identifier.id, value);
          break;
        }
        case "MethodCall":
        case "CallExpression": {
          // Is the function being called useMemo, with at least 1 argument?
          const callee =
            value.kind === "CallExpression"
              ? value.callee.identifier
              : value.property.identifier;
          const hookKind = getHookKind(fn.env, callee);
          if (hookKind !== "useMemo" || value.args.length === 0) {
            continue;
          }

          // If yes get the first argument and if it refers to a locally defined function
          // expression, validate the function
          const [arg] = value.args;
          if (arg.kind !== "Identifier") {
            continue;
          }
          const body = functions.get(arg.identifier.id);
          if (body === undefined) {
            continue;
          }

          if (body.loweredFunc.func.params.length > 0) {
            CompilerError.invalidReact({
              reason: "useMemo callbacks may not accept any arguments",
              description: null,
              loc: body.loc,
              suggestions: null,
            });
          }

          if (body.loweredFunc.func.async || body.loweredFunc.func.generator) {
            CompilerError.invalidReact({
              reason:
                "useMemo callbacks may not be async or generator functions",
              description: null,
              loc: body.loc,
              suggestions: null,
            });
          }

          break;
        }
      }
    }
  }
}
