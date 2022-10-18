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

function getStaticCallee(expression: t.Node): string | null {
  if (t.isIdentifier(expression)) {
    return expression.name;
  }
  if (
    t.isMemberExpression(expression) ||
    t.isOptionalMemberExpression(expression)
  ) {
    const { object, property } = expression;
    const objectName = getStaticCallee(object);
    const propertyName = getStaticCallee(property);
    if (objectName && propertyName) {
      return `${objectName}.${propertyName}`;
    }
  }
  return null;
}

export function run(
  _irFunc: IR.Func,
  func: NodePath<t.Function>,
  context: CompilerContext
) {
  const funcBody = func.get("body");

  if (context.opts.flags.bailOnCapitalizedFunctionCalls) {
    function isValidFunctionCallName(
      functionName: string,
      fullName: string
    ): boolean {
      return (
        ALLOWED_CAPITALIZED_STDLIB_FUNCTIONS.has(fullName) ||
        context.opts.allowedCapitalizedUserFunctions.has(fullName) ||
        !/^[A-Z]/.test(functionName)
      );
    }

    funcBody.traverse({
      CallExpression(path) {
        const callee = path.get("callee");
        if (t.isIdentifier(callee.node)) {
          // Allow `Module().method()`;
          if (
            t.isMemberExpression(path.parent) ||
            t.isOptionalMemberExpression(path.parent)
          ) {
            return;
          }
          const name = callee.node.name;
          if (!isValidFunctionCallName(name, name)) {
            context.bailout("BailOnCapitalizedFunctionCalls", {
              code: "E0018",
              path: callee,
              context: null,
            });
          }
        } else if (
          t.isMemberExpression(callee.node) ||
          t.isOptionalMemberExpression(callee.node)
        ) {
          if (t.isIdentifier(callee.node.property)) {
            const fullName = getStaticCallee(callee.node);
            if (
              fullName &&
              !isValidFunctionCallName(callee.node.property.name, fullName)
            ) {
              context.bailout("BailOnCapitalizedFunctionCalls", {
                code: "E0018",
                path: callee,
                context: null,
              });
            }
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
