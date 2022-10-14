/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import type { CompilerContext } from "../CompilerContext";
import * as IR from "../IR";
import { PassKind, PassName } from "../Pass";

/**
 * Sketchy Code Check
 *
 * This middle end checks for "sketchy" code patterns to potentially bail out
 * when found.
 */
export default {
  name: PassName.SketchyCodeCheck,
  kind: PassKind.IRFunc as const,
  run,
};

const ALLOWED_CAPITALIZED_STDLIB_FUNCTIONS = new Set([
  "AggregateError",
  "Array",
  "BigInt",
  "Boolean",
  "Date",
  "Error",
  "EvalError",
  "Function",
  "InternalError",
  "Number",
  "Object",
  "RangeError",
  "ReferenceError",
  "RegExp",
  "String",
  "Symbol",
  "SyntaxError",
  "TypeError",
  "URIError",
]);

export function run(
  _irFunc: IR.Func,
  func: NodePath<t.Function>,
  context: CompilerContext
) {
  const funcBody = func.get("body");

  if (context.opts.flags.bailOnCapitalizedFunctionCalls) {
    funcBody.traverse({
      CallExpression(path) {
        const callee = path.get("callee");
        if (t.isIdentifier(callee.node)) {
          const name = callee.node.name;
          if (
            ALLOWED_CAPITALIZED_STDLIB_FUNCTIONS.has(name) ||
            context.opts.allowedCapitalizedUserFunctions.has(name)
          ) {
            return;
          }
          // Allow `Module().method()`;
          if (
            t.isMemberExpression(path.parent) ||
            t.isOptionalMemberExpression(path.parent)
          ) {
            return;
          }
          if (/^[A-Z]/.test(name)) {
            context.bailout("BailOnCapitalizedFunctionCalls", {
              code: "E0018",
              path: callee,
              context: null,
            });
          }
        }
      },
    });
  }

  if (
    context.opts.flags.bailOnNestedComponents &&
    funcBody.scope.parent.parent != null
  ) {
    context.bailout("BailOnNestedComponents", {
      code: "E0019",
      path: func,
      context: null,
    });
  }
}
